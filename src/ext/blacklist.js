/*jslint browser: true, devel: true, indent: 4, vars: true, nomen: true, regexp: true, forin: true, white:true */
/*global $, _, GS, FS */

(function() {
    "use strict";

    var mod = GS.modules.blacklist = new GS.Module('Blacklist');
    mod.dependencies = ['FS.MeetingRoom', 'FS.ClassicTableView'];
    mod.load = function () {
        FS.MeetingRoom.prototype.old_onRoomChat = FS.MeetingRoom.prototype.onRoomChat;
        FS.MeetingRoom.prototype.onRoomChat = function (resp) {
            var player = this.playerList.findByAddress(resp.data.playerAddress).getName();
    
            if (GS.get_option('blacklist').indexOf(player) > -1) {
                return;
            }
    
            this.old_onRoomChat(resp);
        };
    
        FS.ClassicTableView.prototype.old_modifyDOM = FS.ClassicTableView.prototype.modifyDOM;
        FS.ClassicTableView.prototype.modifyDOM = function () {
            FS.ClassicTableView.prototype.old_modifyDOM.call(this);
    
            var players, name, blacklisted, localPlayerJoined;
    
            if (this.model && this.model.getJoinedPlayers) {
                players = this.model.getJoinedPlayers();
                _(players).each(function (player, index, list) {
                    name = player.getName();
                    if (GS.get_option('blacklist').indexOf(name) > -1 && this.model && this.model.view && this.model.view.$el) {
                        blacklisted = true;
                    }
                    if (name === this.meetingRoom.getLocalPlayer().getName()) {
                        localPlayerJoined = true;
                    }
                }, this);
    
                if (blacklisted && !localPlayerJoined) {
                    this.model.view.$el.hide();
                } else if (blacklisted && localPlayerJoined) {
                    GS.debug("Warning: in a game with a blacklisted player.");
                }
            }
        };
    };
}());
