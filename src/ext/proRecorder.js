/*jslint browser: true, devel: true, indent: 4, maxlen: 90, es5: true, vars:true, nomen:true */
/*global $, _, WebSocket, GS, mtgRoom */

(function () {
    "use strict";

    var mod = GS.modules.proRecorder = new GS.Module('Pro Rating Recorder');
    mod.dependencies = [ ];
    mod.load = function () {
        mod.ratings = [];
        var rec = function (id) {
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
                    mu: x.ratingData.mean,
                    sd: x.ratingData.SD
                });
            });
        };
        var fn = function (m) {
            if (GS.get_option('record_pro_ratings')) {
                console.log('Received ISO update');
                _.keys(m.new_levels).map(rec);
            }
        };
        GS.modules.wsConnection.listenForMessage('UPDATE_ISO_LEVELS', fn);
    };
}());
