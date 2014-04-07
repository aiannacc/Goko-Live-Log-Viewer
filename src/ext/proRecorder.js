/*jslint browser: true, devel: true, indent: 4, maxlen: 90, es5: true, vars:true, nomen:true */
/*global $, _, WebSocket, GS, mtgRoom */

(function () {
    "use strict";

    var mod = GS.modules.proRecorder = new GS.Module('Pro Rating Recorder');
    mod.dependencies = [];
    mod.load = function () {
        mod.playerIds = [];
        mod.ratings = [];
        
        mod.rec_all = function (ids) {
            console.log('Running rec_all');
            mtgRoom.conn.getRatings({
                version: 1,
                playerIds: ids,
                ratingSystemId: mtgRoom.helpers.RatingHelper.ratingSystemPro
            }).then(function (resp) {
                var pids = resp.ratings.map(function (r) {
                    return r.playerId;
                });
                var ratings = resp.ratings.map(function (r) {
                    return r.ratingData;
                });
                GS.sendWSMessage('SUBMIT_PRO_RATINGS', {
                    playerIds: pids,
                    ratings: ratings
                });
            });
        };

        var rec = function (id) {
            if (mod.playerIds.indexOf(id) === -1) {
                mod.playerIds.push(id);
            }
            console.log('Running Record for ' + id);
            mtgRoom.conn.getRating({
                version: 1,
                playerId: id,
                ratingSystemId: mtgRoom.helpers.RatingHelper.ratingSystemPro
            }).then(function (x) {
                console.log('Recording ratings');
                mod.ratings.push({
                    id: id,
                    time: new Date(),
                    pro: x.ratingData
                });
                GS.sendWSMessage('SUBMIT_PRO_RATING', {
                    playerId: id,
                    old_mu: x.ratingData.mean,
                    old_sd: x.ratingData.mean,
                    mu: x.ratingData.mean,
                    sd: x.ratingData.SD
                });
            });
        };

        mod.recordInterval = setInterval(function () {
            if ((new Date() < new Date(2014, 3, 5, 22, 10))
                    && (new Date() > new Date(2014, 3, 5, 22, 25))) {
                mod.rec_all(mod.playerIds);
            }
            if (new Date() > new Date(2014, 3, 5, 22, 25)) {
                clearInterval(mod.recordInterval);
            }
        }, 60 * 1000);

        var fn = function (m) {
            if (GS.get_option('record_pro_ratings')) {
                console.log('Received ISO update');
                _.keys(m.new_levels).map(rec);
            }
        };
        GS.modules.wsConnection.listenForMessage('UPDATE_ISO_LEVELS', fn);
    };
}());
