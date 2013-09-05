/*jslint browser: true, devel: true, indent: 4, vars: true, nomen: true, regexp: true, forin: true, white:true */
/*global $, _ */

/*
 * Blacklist Module
 */
var loadBlacklistModule = function (gs, mr, ctv) {
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

window.GokoSalvager.depWait(
    ['GokoSalvager',
     'window.FS.MeetingRoom',
     'window.FS.ClassicTableView'],
    100, loadBlacklistModule, this, 'Blacklist Module'
);
