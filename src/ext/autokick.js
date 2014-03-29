/*jslint browser: true, devel: true, indent: 4, vars: true, nomen: true, regexp: true, forin: true, white:true */
/*global $, _, Audio, GS, FS, mtgRoom */

(function () {
    "use strict";

    console.log('Loading autokick');

    var mod = GS.modules.autokick = new GS.Module('autokick');
    mod.dependencies = [
        'FS.ZoneClassicHelper',
        'mtgRoom'
    ];
    mod.load = function () {
        var getProRating, kickOrNotify, kickOrNotify2, explainKick,
            self = this;
        this.kickedOpps = [];

        getProRating = function (gokoconn, playerId, callback) {
            gokoconn.getRating({
                playerId: playerId,
                ratingSystemId: '501726b67af16c2af2fc9c54'
            }, function (resp) {
                return callback(resp.data.rating);
            });
        };

        kickOrNotify = function (gokoconn, table, joiner) {

            // Asynchronously get my rating
            getProRating(gokoconn, gokoconn.connInfo.playerId, function (myRating) {
                if (typeof myRating === 'undefined') {
                    GS.debug('No pro rating found for me -- using 1000');
                    myRating = 1000;
                }

                // Asynchronously get joiner's rating
                getProRating(gokoconn, joiner.get('playerId'), function (hisRating) {
                    if (typeof hisRating === 'undefined') {
                        GS.debug('No pro rating found for ' + joiner.get('playerName') + ' -- using 1000');
                        hisRating = 1000;
                    }

                    kickOrNotify2(gokoconn, table, joiner, myRating, hisRating);
                });
            });
        };

        kickOrNotify2 = function (gokoconn, table, joiner, myRating, hisRating) {
            var shouldKick = false, whyKick;
            var hisName = joiner.get('playerName');
            var tablename = null;
            if (table !== null) {
                var tableSettings = table.get('settings');
                if (tableSettings !== null && tableSettings !== '') {
                    tablename = JSON.parse(tableSettings).name || tablename;
                }
            }

            console.info('Deciding whether to kick', joiner);

            // Kick players whose ratings are too high or too low for me
            if (GS.get_option('autokick_by_rating') && tablename !== null) {

                var range = GS.parseRange(tablename, myRating);
                var minRating = range[0];
                var maxRating = range[1];

                if ((minRating && hisRating < minRating)
                        || (maxRating && hisRating > maxRating)) {
                    GS.debug(hisName + 'is outside my rating range... kicking');
                    shouldKick = true;
                    whyKick = {
                        reason: 'rating', 
                        min: minRating,
                        max: maxRating,
                        rating: hisRating
                    };
                }
            }

            // Kick players not listed in "For X, Y, ..."
            if (GS.get_option('autokick_by_forname') && tablename !== null) {
                var m = tablename.toLowerCase().match(/for (.*)/);
                if (m && m[1].indexOf(hisName.toLowerCase()) < 0) {
                    GS.debug(hisName + 'is not my requested opponent... kicking');
                    shouldKick = true;
                    whyKick = {reason: 'forname', forwho: m[1]};
                }
            }

            // Kick players on my blacklist
            var i, blist = GS.getCombinedBlacklist();
            if (typeof blist[hisName] !== 'undefined' && blist[hisName].noplay) {
                GS.debug(hisName + 'is on my noplay blacklist... kicking');
                shouldKick = true;
                whyKick = {reason: 'blacklist'};
            }

            // Never kick bots
            if (joiner.get('isBot')) {
                GS.debug(hisName + ' is a bot... not kicking.');
                shouldKick = false;
            }

            // Kick joiner or play a sound to notify of successful join
            if (shouldKick) {
                gokoconn.bootTable({
                    table: table.get('number'),
                    playerAddress: joiner.get('playerAddress')
                });
                explainKick(joiner, whyKick);
            } else {
                var room = mtgRoom.roomList.findByRoomId(mtgRoom.currentRoomId);
                if (!joiner.get('isBot')
                        && typeof room !== 'undefined'
                        && room.get('name').indexOf('Private') !== 0) {
                    console.info('Opp joined', joiner, room);
                    var msg = 'Opponent joined: ' + joiner.get('playerName')
                                   + ' [Pro ' + hisRating + ']';
                    GS.notifyUser(msg, new Audio('sounds/startTurn.ogg'));
                }
            }
        };

        explainKick = function (joiner, whyKick) {
            console.info('TODO: explain kick', joiner, whyKick);
            if (!_.contains(self.kickedOpps, joiner.get('playerId'))) {
                var expl, shouldExplain;
                switch (whyKick.reason)
                {
                case 'rating':
                    shouldExplain = true;
                    if (whyKick.rating < whyKick.min) {
                        expl = 'my minimum rating is ' + whyKick.min + ' (Pro)';
                    } else if (whyKick.rating > whyKick.max) {
                        expl = 'my maximum rating is ' + whyKick.max + ' (Pro)';
                    }
                    break;
                case 'forname':
                    shouldExplain = true;
                    expl = 'I am waiting for ' + whyKick.forwho;
                    break;
                case 'blacklist':
                    shouldExplain = false;
                    break;
                }
                if (shouldExplain && GS.get_option('explain_kicks')) {
                    mtgRoom.conn.chat({text: joiner.get('playerName') + ', you were '
                                             + ' auto-kicked because ' + expl + '.'});
                    self.kickedOpps.push(joiner.get('playerId'));
                }
            }
        };

        GS.alsoDo(FS.ZoneClassicHelper, 'onPlayerJoinTable', null, function (t, tp) {
            if (this.isLocalOwner(t)) {
                kickOrNotify(this.meetingRoom.conn, t, tp.get('player'));
            }
        });
    };
}());
