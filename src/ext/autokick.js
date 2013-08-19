/*jslint browser: true, devel: true, indent: 4, vars: true, nomen: true, regexp: true, forin: true */
/*global $, _ */

var loadAutokickModule;
(function () {
    "use strict";

    console.log('Preparing to load auto kick module');

    var exists = function (obj) {
        return (typeof obj !== 'undefined' && obj !== null);
    };

    // Wait (non-blocking) until the required objects have been instantiated
    var dbWait = setInterval(function () {
        var gs, gso, zch;
        console.log('Checking for Auto Kick dependencies');
        try {
            gs = window.GokoSalvager;
            gso = gs.get_option;
            zch = window.FS.ZoneClassicHelper;
        } catch (e) {}

        if ([gso, zch].every(exists)) {
            console.log('Loading auto kick module');
            loadAutokickModule(gs, zch);
            clearInterval(dbWait);
        }
    }, 100);
}());

/*
 * Auto kick module
 *
 * Goko dependencies:
 *   - getRating API specifics ($elPro and $elQuit trigger getting the pro ranking)
 *   - onPlayerJoinTable API
 *   - lot of other APIs (bootTable, table settings, isLocalOwner)
 * Internal dependencies
 *   - option: autokick
 *   - option: blacklist
 */
loadAutokickModule = function (gs, zch) {
    "use strict";

    var joinSound = document.createElement('div');
    joinSound.innerHTML = '<audio id="_joinSound" style="display: none;" src="sounds/startTurn.ogg"></audio>';
    document.getElementById('viewport').appendChild(joinSound);
    zch.prototype.old_onPlayerJoinTable = zch.prototype.onPlayerJoinTable;
    zch.prototype.onPlayerJoinTable = function (t, tp) {
        this.old_onPlayerJoinTable(t, tp);
        var p = tp.get('player');

        if (gs.get_option('autokick') && this.isLocalOwner(t)) {
            var settings = JSON.parse(t.get("settings"));
            var pro = settings.ratingType === 'pro';
            var m = settings.name.toLowerCase().match(/\b(\d+)(\d{3}|k)\+/);
            var mr = null;
            if (m) {
                mr = parseInt(m[1], 10) * 1000 + (m[2] === 'k' ? 0 : parseInt(m[2], 10));
            }
            var ratingHelper = this.meetingRoom.getHelper('RatingHelper');
            var self = this;
            if (mr) {
                ratingHelper.getRating({
                    playerId: p.get("playerId"),
                    $elPro: $(document.createElement('div')),
                    $elQuit: $(document.createElement('div'))
                }, function (resp) {
                    if (!resp.data) {
                        return;
                    }
                    var r = pro ? resp.data.ratingPro : resp.data.rank;
                    if (r !== undefined && r < mr) {
                        self.meetingRoom.conn.bootTable({
                            table: t.get('number'),
                            playerAddress: p.get('playerAddress')
                        });
                    } else {
                        document.getElementById('_joinSound').play();
                    }
                });
            } else {
                document.getElementById('_joinSound').play();
            }
        }

        if (gs.get_option('blacklist').indexOf(tp.getName()) > -1 && this.isLocalOwner(t)) {
            this.meetingRoom.conn.bootTable({
                table: t.get('number'),
                playerAddress: p.get('playerAddress')
            });
        }
    };
};
