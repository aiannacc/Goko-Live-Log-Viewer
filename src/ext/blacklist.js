(function () {
    "use strict";

    var mod = GS.modules.blacklist = new GS.Module('Blacklist');
    mod.dependencies = [
        'FS.MeetingRoom',
        'FS.ClassicTableView',
        'GS.WS'
    ];
    mod.load = function () {
        FS.MeetingRoom.prototype.old_onRoomChat = FS.MeetingRoom.prototype.onRoomChat;
        FS.MeetingRoom.prototype.onRoomChat = function (resp) {
            var player = this.playerList.findByAddress(resp.data.playerAddress).getName();

            // Hide chat messages from censored players
            var blist = GS.getCombinedBlacklist();
            if (blist[player] === undefined || !blist[player].censor) {
                this.old_onRoomChat(resp);
            }
        };

        GS.getMyBlacklist = function () {
            return GS.get_option('blacklist2');
        };

        GS.cacheCommonBlacklist = function (percentile, callback) {
            GS.WS.waitSendMessage(
                'QUERY_BLACKLIST_COMMON',
                {percentile: percentile},
                function (resp) {
                    GS.cachedCommonBlacklist = resp.common_blacklist;
                    GS.commonBlacklistRetreived = true;
                    console.log('Retrieved and cached common blacklist');
                    if (callback !== undefined) {
                        callback();
                    }
                }
            );
        };

        // Attempt to retreive the common blacklist from GS server.
        GS.commonBlacklistRetreived = false;
        GS.commonBlacklistWarningGiven = false;
        GS.cacheCommonBlacklist(GS.get_option('blacklist_common'));

        // Until and unless we can connect to the GS server, just use an empty
        // common blacklist.  Warn once in console.
        GS.getCombinedBlacklist = function () {
            var combined = {};
            if (GS.commonBlacklistRetreived) {
                combined = _.clone(GS.cachedCommonBlacklist);
            } else {
                if (!GS.commonBlacklistWarningGiven) {
                    console.warn('Common blacklist not available.');
                    GS.commonBlacklistWarningGiven = true;
                }
            }

            var local = GS.get_option('blacklist2');
            _.keys(local).map(function (pname) {
                combined[pname] = local[pname];
            });
            return combined;
        };

        FS.ClassicTableView.prototype.old_modifyDOM = FS.ClassicTableView.prototype.modifyDOM;
        FS.ClassicTableView.prototype.modifyDOM = function () {
            FS.ClassicTableView.prototype.old_modifyDOM.call(this);

            var players, name, blacklisted, localPlayerJoined;

            if (this.model && this.model.getJoinedPlayers) {

                players = this.model.getJoinedPlayers();

                _(players).each(function (player, index, list) {
                    name = player.getName();

                    // Determine whether a blacklisted player is at the table
                    var blist = GS.get_option('blacklist2');
                    if (blist[name] !== undefined && !blist[name].noplay
                            && this.model && this.model.view && this.model.view.$el) {
                        blacklisted = true;
                    }

                    // Determine whether we're at the table
                    if (name === this.meetingRoom.getLocalPlayer().getName()) {
                        localPlayerJoined = true;
                    }
                }, this);

                if (blacklisted && !localPlayerJoined) {
                    // Hide games with blacklisted players unless we're in them too
                    this.model.view.$el.hide();
                } else if (blacklisted && localPlayerJoined) {
                    // This shouldn't happen: our game should kick the blacklisted
                    // player, while his should be invisible to us.
                    console.log("Error: in a game with a blacklisted player.");
                }
            }
        };
    };
}());
