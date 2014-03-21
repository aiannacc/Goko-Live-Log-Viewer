/*jslint browser: true, devel: true, indent: 4, vars: true, nomen: true, regexp: true, forin: true, white:true */
/*global $, _, Audio, GS, FS */

(function () {
    "use strict";

    console.log('Loading autokick');

    var mod = GS.modules.autokick = new GS.Module('autokick');
    mod.dependencies = ['FS.ZoneClassicHelper'];
    mod.load = function () {
        var getProRating, kickOrNotify, kickOrNotify2;
    
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
            var shouldKick = false;
            var hisName = joiner.get('playerName');
            var tablename = null;
            if (table !== null) {
                var tableSettings = table.get('settings');
                if (tableSettings !== null && tableSettings !== '') {
                    tablename = JSON.parse(tableSettings).name || tablename;
                }
            }
    
            // Kick players whose ratings are too high or too low for me
            if (GS.get_option('autokick_by_rating') && tablename !== null) {
    
                var range = GS.parseRange(tablename, myRating);
                var minRating = range[0];
                var maxRating = range[1];
    
                if ((minRating && hisRating < minRating)
                        || (maxRating && hisRating > maxRating)) {
                    GS.debug(hisName + 'is outside my rating range... kicking');
                    shouldKick = true;
                }
            }
            
            // Kick players not listed in "For X, Y, ..."
            if (GS.get_option('autokick_by_forname') && tablename !== null) {
                var m = tablename.toLowerCase().match(/for (.*)/);
                if (m && m[1].indexOf(hisName.toLowerCase()) < 0) {
                    GS.debug(hisName + 'is not my requested opponent... kicking');
                    shouldKick = true;
                }
            }
    
            // Kick players on my blacklist
            var i, blist = GS.getCombinedBlacklist();
            if (typeof blist[hisName] !== 'undefined' && blist[hisName].noplay) {
                GS.debug(hisName + 'is on my noplay blacklist... kicking');
                shouldKick = true;
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
            } else {
                if (!joiner.get('isBot')) {
                    // TODO: make this work on Safari too
                    GS.notifyUser('Opponent joined', new Audio('sounds/startTurn.ogg'));
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
