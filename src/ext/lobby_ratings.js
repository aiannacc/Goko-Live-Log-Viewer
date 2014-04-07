/*jslint browser: true, devel: true, indent: 4, vars: true, nomen: true, regexp: true, forin: true, white:true */
/*global $, _, GS, FS, mtgRoom, Promise, DEFAULT_RATING */

/*
 * Lobby ratings module
 *
 * Goko dependencies:
 * - getRating API specifics ($elPro and $elQuit trigger getting the pro ranking)
 * - class name of the player list rank element ('player-rank')
 * - format of the text content of the player list element ('username Rating: 1000')
 * - FS.RatingHelper, FS.ClassicRoomView, FS.MeetingRoomSetting
 * Internal dependencies:
 * - option: proranks
 * - option: sortrating
 * - option: blacklist
 */
(function () {
    "use strict";

    var mod = GS.modules.lobbyRatings = new GS.Module('Lobby Ratings');
    mod.dependencies = [
        'FS.RatingHelper',
        'FS.ClassicRoomView',
        'FS.MeetingRoomSetting',
        'mtgRoom'
    ];
    mod.load = function () {
        var insertInPlace, getSortablePlayerObjectFromElement,
            updateIsoRating, updateIsoRating2, modifyPlayerListElement;

        // One-time option conversion TODO: remove after all upgrade
        if (GS.get_option('sortkey') === 'pro') {
            GS.set_option('sortkey', 'rating');
        }

        // Cache all players' Isotropish ratings
        var fetchIsoTable; 
            GS.sendWSMessage('QUERY_ISO_TABLE', {}).then(function (resp) {
                console.log('Loaded isotropish level cache from ' + GS.WS.domain);
                GS.isoLevelCache = resp.isolevel;
            });
        GS.modules.wsConnection.listenForConnection(fetchIsoTable);
        GS.whenConnectionReady.then(fetchIsoTable);

        GS.modules.wsConnection.listenForMessage('UPDATE_ISO_LEVELS', function (m) {
            _.each(m.new_levels, function (isoLevel, playerId) {
                GS.isoLevelCache[playerId] = isoLevel;
                // TODO: update HTML elements for these players, if they
                //       happen to be in the same lobby as us
            });
        });

        // Display Isotropish rating on the player's lobby html element.  Sort
        // the player in the list of other players.
        updateIsoRating = function (playerId, playerElement) {
            // Players not in iso level cache may either have no rated games
            // or may not have a playerId to playerName connection in the
            // database.
            // 
            // Resolve the ambiguity by querying this player by both playerId
            // and playerName.  This will also allow the server to record the
            // id-name connection.
            // 
            if (typeof GS.isoLevelCache[playerId] !== 'undefined') {
                // Player in cache
                updateIsoRating2(playerId, playerElement);
            } else {
                // Player not in cache --> first look up player name
                var player = mtgRoom.playerList.findById(playerId)[0];

                // Undefined if player has already left lobby --> ignore him
                if (typeof player !== 'undefined') {
                    var playerName = player.get('playerName');
                    var msg = {
                        playerId: playerId,
                        playerName: playerName
                    };

                    // Request level based on both playerId and playerName.
                    // Server returns default starting level (0) if no games.
                    GS.WS.waitSendMessage('QUERY_ISOLEVEL', msg, function (resp) {
                        GS.isoLevelCache[playerId] = resp.isolevel;
                        updateIsoRating2(playerId, playerElement);
                    });
                }
            }
        };

        updateIsoRating2 = function (playerId, playerElement) {
            var rankDiv = playerElement.querySelector('.rank');
            $(rankDiv).append('  Level: ')
                      .append($('<span>').text(GS.isoLevelCache[playerId])
                                         .addClass('iso-level'));

            // Keep the list of players sorted
            insertInPlace(playerElement);
        };

        // NOTE: This inappropriately named function actually takes an HTML
        // element and inserts the rating into its .player-rank span element.
        FS.RatingHelper.prototype.old_getRating = FS.RatingHelper.prototype.getRating;

        // Hijack this method to sort the player list, show pro/iso ratings,
        // and hide censored players
        FS.RatingHelper.prototype.getRating = function (opts, callback) {
            var newCallback = callback, playerElement;
            if (opts.$el && opts.$el.hasClass('player-rank')) {
                playerElement = opts.$el.closest('li')[0];
                newCallback = function (resp) {
                    callback(resp);

                    modifyPlayerListElement(playerElement);
                };
                if (GS.get_option('proranks')) {
                    opts.$elPro = opts.$el;
                    opts.$elQuit = $(document.createElement('div'));
                    delete opts.$el;
                }
            }
            FS.RatingHelper.prototype.old_getRating.call(this, opts, newCallback);
        };

        GS.alsoDo(FS.PlayerListView, 'render', null, function () {
            console.log('Running PLV render');
            window.playerListView = this;
        });

        GS.getProRating = function (playerId) {
            if (typeof playerId === 'undefined') {
                playerId = mtgRoom.getLocalPlayer().getId();
            }
            return new Promise(function (resolve, reject) {
                var res = resolve;
                var rej = reject;
                mtgRoom.conn.getRating({
                    version: 1,
                    playerId: playerId, 
                    ratingSystemId: mtgRoom.options.ratingSystemPro
                }).then(function (resp) {
                    res({
                        mu: resp.ratingData.mean,
                        sigma: resp.ratingData.SD,
                        level: resp.ratingData.mean - 2 * resp.ratingData.SD,
                        displayed: resp.rating
                    });
                });
            });
        };

//        <div class="vp-player-view">
//          <div class="vp-player-detail" style="">
//            <img src="" style="height: 56px; width: 56px;">
//          </div>
//          <p class="vp-name">
//          </p>
//          <p class="vp-line clearfix">
//            <span class="vp-label record"> Record: </span>
//            <span class="vp-value record vp-wld">
//              <span rating-player-wld="516da267e4b082c74d7c3ddd">
//            </span>
//          </p>
//          <p class="vp-line clearfix">
//            <span class="vp-label"> Casual Rating: </span>
//            <span class="vp-value vp-ranking">
//              <span rating-player="516da267e4b082c74d7c3ddd">
//            </span>
//          </p>
//          <p class="vp-line clearfix">
//            <span class="vp-label"> Pro Rating: </span>
//            <span class="vp-value vp-rating-pro">
//              <span rating-player-pro="516da267e4b082c74d7c3ddd">
//            </span>
//          </p>
//          <p class="vp-line clearfix vp-line-quit">
//            <span class="vp-label"> Quit %: </span>
//            <span class="vp-value vp-quit-percent">
//              <span rating-player-quit="516da267e4b082c74d7c3ddd">
//            </span>
//          </p>
//          <button class="fs-mtrm-dominion-action-btn btn-kick-player">
//          </button>
//        </div>

        GS.alsoDo(FS.ClassicPlayerDetailView, 'showWithPlayer', null, function () {
            var $el = this.$el;
            var playerId = $el.find('.vp-ranking').children().attr('rating-player');

            // Show large numbers of games like "3k"
            //var record = $el.find('.vp-wld').text().split('-');
            //record = record.map(function (num) {
            //    return num > 1000 ? Math.round(num/1000) + 'k' : num;
            //});
            //$el.find('.vp-wld').text(record.join('-'));

            // Shorten labels
            $el.find('.vp-ranking').parent().find('.vp-label').text('Casual:');
            $el.find('.vp-rating-pro').parent().find('.vp-label').text('Pro:');

            // Add Isotropic Level.  Consider removing quit percentage.
            if (GS.get_option('isoranks')) {
                $el.find('.vp-line-quit').before(
                    $('<p class="vp-line clearfix">')
                        .append($('<span class="vp-label"> Isotropish: </span>'))
                        .append($('<span class="vp-value iso-rating"></span>').
                            text(GS.isoLevelCache[playerId])));
                //$el.find('.vp-line-quit').remove();
            }

            var oppRating, myRating;
            var addAssessment = function (wld_delta) {
                console.info('Recieved Assessment', wld_delta);
                var delta = {
                    win: wld_delta.win.me.displayed,
                    draw: wld_delta.draw.me.displayed,
                    loss: wld_delta.loss.me.displayed
                };
                var wld = {
                    win: Math.floor(myRating.level + delta.win) - myRating.displayed,
                    draw: Math.floor(myRating.level + delta.draw) - myRating.displayed,
                    loss: Math.floor(myRating.level + delta.loss) - myRating.displayed
                };
                var wld_text = 'Win:  +' + wld.win + '\n'
                    + 'Loss: ' + wld.loss + '\n'
                    + 'Draw: ' + (wld.draw > 0 ? '+' : '') + wld.draw;
                $el.find('.vp-rating-pro').attr('title', wld_text);
            };

            GS.getProRating(playerId).then(function (r) {
                oppRating = r;
                return GS.getProRating(mtgRoom.getLocalPlayer().getId());
            }).then(function (r) {
                myRating = r;
                GS.WS.sendMessage('QUERY_ASSESSMENT', {
                    myRating: myRating,
                    hisRating: oppRating,
                    system: 'pro'
                }, function (resp) {
                    addAssessment(resp.wld_delta);
                });
            }).then(undefined, function (e) {
                console.error(e);
            });
        });

        GS.alsoDo(FS.ClassicPlayerDetailView, 'render', null, function () {
            console.log('Running CPDV render');
            window.detailView = this;
        });

        FS.ClassicRoomView.prototype.old_modifyDOM = FS.ClassicRoomView.prototype.modifyDOM;
        FS.ClassicRoomView.prototype.modifyDOM = function () {
            var originalRating = this.meetingRoom.options.ratingSystemId;
            if (GS.get_option('proranks')) {
                this.meetingRoom.options.ratingSystemId = FS.MeetingRoomSetting.ratingSystemPro;
            }
            FS.ClassicRoomView.prototype.old_modifyDOM.call(this);
            this.meetingRoom.options.ratingSystemId = originalRating;
        };

        insertInPlace = function (element) {
            var list = element.parentNode;
            if (!list) {
                return; // Removed from the list before the ranking came
            }
            list.removeChild(element);

            var newEl = getSortablePlayerObjectFromElement(element),
                elements = list.children,
                b = elements.length,
                a = 0;

            while (a !== b) {
                var c = Math.floor((a + b) / 2);
                var compare = getSortablePlayerObjectFromElement(elements[c]);

                // sort first by rating, then alphabetically
                if (compare > newEl) {
                    b = c;
                } else {
                    a = c + 1;
                }
            }
            list.insertBefore(element, elements[a] || null);
        };

        getSortablePlayerObjectFromElement = function (element) {
            switch (GS.get_option('sortkey'))
            {
            case('pname'):
                return element.querySelector('.fs-mtrm-player-name>strong').innerHTML;
            case('rating'):
                var rankSpan = element.querySelector('.player-rank>span');
                return rankSpan ? parseInt(-rankSpan.innerHTML, 10) : 1;
            case('iso'):
                var isoSpan = element.querySelector('.iso-level');
                return isoSpan ? parseFloat(-isoSpan.innerHTML, 10) : 1;
            default:
                throw 'Invalid sort key: ' + GS.get_option('sortkey');
            }
        };

        modifyPlayerListElement = function (playerElement) {

            if (GS.get_option('isoranks')) {
                // Players with rating=1000 are players with no games.
                // Goko assigns this without querying its Connection,
                // so we can't intercept the query.  Assign these
                // players the default Isotropish rating of 0.
                try {
                    var playerId = playerElement.querySelector('.player-list-item')
                                                .getAttribute('data-playerid');
                    var playerName = mtgRoom.playerList
                                            .findById(playerId)[0]
                                            .get('playerName');

                    if (typeof GS.isoLevelCache === 'undefined') {
                        // Warn that the cache is not available
                        if (!GS.noIsoCacheWarned) {
                            console.log('ISO level cache not yet '
                                + 'available. Queing request to be '
                                + 'resolved later');
                            GS.noIsoCacheWarned = true;
                        }
                        // TODO: Insert rating into this element when the
                        // cache becomes available
                    } else {
                        // Update player's lobby list element.
                        updateIsoRating(playerId, playerElement);
                    }
                } catch (e) {
                    // Players sometimes disappear from the list before
                    // this code is reached.  Ignore these errors.
                }
            }

            // Don't show censored players on the player list
            var pname = playerElement
                .querySelector('.fs-mtrm-player-name>strong').innerHTML;
            var blist = GS.getCombinedBlacklist.then(function (blist) {
                if (typeof blist[pname.toLowerCase()] !== 'undefined'
                        && blist[pname.toLowerCase()].censor) {
                    $(playerElement).hide();
                } else {
                    $(playerElement).show();
                }
            });

            // Keep the list of players sorted
            insertInPlace(playerElement);
        };
    };
}());
