/*jslint browser: true, devel: true, indent: 4, vars: true, nomen: true, regexp: true, forin: true */
/*global $, _ */

var loadBlacklistModule;
(function () {
    "use strict";

    console.log('Preparing to load Blacklist module');

    var exists = function (obj) {
        return (typeof obj !== 'undefined' && obj !== null);
    };

    // Wait (non-blocking) until the required objects have been instantiated
    var dbWait = setInterval(function () {
        var gs, gso, mr, ctv;

        try {
            gs = window.GokoSalvager;
            gso = gs.get_option;
            mr = window.FS.MeetingRoom;
            ctv = window.FS.ClassicTableView;
        } catch (e) {}

        if ([gso].every(exists)) {
            console.log('Loading Blacklist module');
            loadBlacklistModule(gs, mr, ctv);
            clearInterval(dbWait);
        }
    }, 100);
}());

/*
 * Blacklist Module
 */
loadBlacklistModule = function (gs, mr, ctv) {
    "use strict";

    mr.prototype.old_onRoomChat = mr.prototype.onRoomChat;
    mr.prototype.onRoomChat = function (resp) {
        var player = this.playerList.findByAddress(resp.data.playerAddress).getName();

        if (gs.get_option('blacklist').indexOf(player) > -1) {
            return;
        }

        this.old_onRoomChat(resp);
    };

    ctv.prototype.old_modifyDOM = ctv.prototype.modifyDOM;
    ctv.prototype.modifyDOM = function () {
        ctv.prototype.old_modifyDOM.call(this);

        var players, name, blacklisted, localPlayerJoined;

        if (this.model && this.model.getJoinedPlayers) {
            players = this.model.getJoinedPlayers();
            _(players).each(function (player, index, list) {
                name = player.getName();
                if (gs.get_option('blacklist').indexOf(name) > -1 && this.model && this.model.view && this.model.view.$el) {
                    blacklisted = true;
                }
                if (name === this.meetingRoom.getLocalPlayer().getName()) {
                    localPlayerJoined = true;
                }
            }, this);

            if (blacklisted && !localPlayerJoined) {
                this.model.view.$el.hide();
            } else if (blacklisted && localPlayerJoined) {
                console.log("Warning: in a game with a blacklisted player.");
            }
        }
    };
};
