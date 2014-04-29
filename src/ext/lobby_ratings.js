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

        // One-time option conversion
        if (GS.get_option('sortkey') === 'pro') {
            GS.set_option('sortkey', 'rating');
        }

        // Cache all Isotropish ratings
        GS.noIsoCacheWarned = false;
        var queuedRequests = [];
        GS.WS.waitSendMessage('QUERY_ISO_TABLE', {}, function (resp) {

            GS.isoLevelCache = resp.isolevel;

            // Resolve queued ratings requests
            _.each(queuedRequests, function (r) {
                try {
                    updateIsoRating(r.playerId, r.playerElement);
                } catch (e) {
                    console.error(e);
                }
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
            if (GS.isoLevelCache[playerId] !== undefined) {
                // Player in cache
                updateIsoRating2(playerId, playerElement);
            } else {
                // Player not in cache --> first look up player name
                var player = mtgRoom.playerList.findById(playerId)[0];

                // Undefined if player has already left lobby --> ignore him
                if (player !== undefined) {
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

            // list view
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

            // popup view
            if (opts.$el && opts.$el.hasClass('vp-ranking')) {
                newCallback = function (resp) {
                    callback(resp);

                    // insert iso level right after Goko Pro rating
                    opts.$el.closest('div').find('.vp-rating-pro').closest('p')
                        .after(GS.template('popup-iso-level', {
                            level: GS.isoLevelCache[opts.playerId]
                        }));
                };
            }

            FS.RatingHelper.prototype.old_getRating.call(this, opts, newCallback);
        };

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
                a = 0,
                c, compare;

            while (a !== b) {
                c = Math.floor((a + b) / 2);
                compare = getSortablePlayerObjectFromElement(elements[c]);

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

                    if (GS.isoLevelCache === undefined) {
                        // Warn that the cache is not available
                        if (!GS.noIsoCacheWarned) {
                            console.log('ISO level cache not yet '
                                + 'available. Queing request to be '
                                + 'resolved later');
                            GS.noIsoCacheWarned = true;
                        }
                        // Insert rating into this element when the
                        // cache becomes available
                        queuedRequests.push({
                            playerId: playerId,
                            playerElement: playerElement
                        });
                    } else {
                        // Update player's lobby list element.
                        updateIsoRating(playerId, playerElement);
                    }
                } catch (ignore) {
                    // Players sometimes disappear from the list before
                    // this code is reached.  Ignore these errors.
                }
            }

            // Don't show censored players on the player list
            var blist = GS.getCombinedBlacklist(true);
            var pname = playerElement
                .querySelector('.fs-mtrm-player-name>strong').innerHTML;
            if (blist[pname.toLowerCase()] !== undefined
                    && blist[pname.toLowerCase()].censor) {
                $(playerElement).hide();
            } else {
                $(playerElement).show();
            }

            // Keep the list of players sorted
            insertInPlace(playerElement);
        };

    };
}());
