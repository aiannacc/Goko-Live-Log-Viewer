/*jslint browser: true, devel: true, indent: 4, vars: true, nomen: true, regexp: true, forin: true */
/*global $, _, Audio, GS, FS, mtgRoom */

(function () {
    "use strict";

    var KickCriterion, RangeKickCriterion, NameKickCriterion, BlacklistKickCriterion;

    var mod = GS.modules.autokick = new GS.Module('autokick');
    mod.dependencies = [
        'FS.ZoneClassicHelper',
        'mtgRoom.conn'
    ];
    mod.load = function () {
        var kick, kickOrNotify, self = this;
        this.myProRating = null;
        this.kickedOpps = [];
        this.explainedOpps = [];

        GS.alsoDo(FS.ZoneClassicHelper, 'onPlayerJoinTable', null, function (table, join) {
            if (this.isLocalOwner(table)) {
                var tableName = JSON.parse(table.get('settings')).name;
                var opp = join.get('player');
                var myId = mtgRoom.localPlayer.getId();
                console.info('On Join', tableName, opp);

                // A Goko race condition can cause opponent's "playerId" field
                // to not be populated.  Slice it out of the "playerAddress".
                var oppId = opp.get('playerAddress').slice(30, 54);

                // Ratings:
                var proCache = mtgRoom.helpers.RatingHelper._rankingsCached;
                var oppPro = proCache[oppId].ratingPro;
                var myPro = proCache[myId].ratingPro;
                var myIso = null, oppIso = null;
                if (GS.isoLevelCache !== 'undefined') {
                    myIso = GS.isoLevelCache[myId];
                    oppIso = GS.isoLevelCache[oppId];
                }
                console.info('Ratings', myPro, oppPro, myIso, oppIso);

                // Isotropish kick criteria
                var isoCrit = new RangeKickCriterion('isotropish.com rating level',
                                    GS.parseIsoRange(tableName), myIso, oppIso);
                isoCrit.apply = GS.get_option('autokick_by_level')
                                && typeof oppIso !== 'undefined'
                                && oppIso !== null;

                // Goko Pro kick criteria
                var proCrit = new RangeKickCriterion('Pro rating',
                                    GS.parseProRange(tableName), myPro, oppPro);
                proCrit.apply = GS.get_option('autokick_by_rating');

                // Player name kick criteria
                var forCrit = new NameKickCriterion(tableName, opp.get('playerName'));
                forCrit.apply = GS.get_option('autokick_by_forname');

                // Blacklist no-play kick criteria
                var blCrit = new BlacklistKickCriterion(GS.getCombinedBlacklist(),
                                                        opp.get('playerName'));

                // Don't kick or notify when in Adventure/Play Bots modes
                // or when the user adds a bot to his own game
                var room = mtgRoom.roomList.findByRoomId(mtgRoom.currentRoomId);
                var doKickNotify = !opp.get('isBot')
                        && typeof room !== 'undefined'
                        && room.get('name').indexOf('Private') !== 0;

                // Either notify the user or kick the joiner and optionally
                // explain why
                if (doKickNotify) {
                    console.info(proCrit, isoCrit, forCrit, blCrit);
                    if (proCrit.shouldKick()) {
                        kick(table, opp, proCrit.whyKick());
                    } else if (isoCrit.shouldKick()) {
                        kick(table, opp, isoCrit.whyKick());
                    } else if (forCrit.shouldKick()) {
                        kick(table, opp, forCrit.whyKick());
                    } else if (blCrit.shouldKick()) {
                        kick(table, opp, blCrit.whyKick());
                    } else {
                        var msg = opp.get('playerName') + ' joined '
                                + ' [Pro ' + proCache[oppId].ratingPro
                                + ', Iso ' + oppIso + ']';
                        GS.notifyUser(msg, new Audio('sounds/startTurn.ogg'));
                    }
                }
            }
        });

        kick = function (table, joiner, whyKick) {
            // Kick joiner
            mtgRoom.conn.bootTable({
                table: table.get('number'),
                playerAddress: joiner.get('playerAddress')
            });

            var oppId = joiner.get('playerAddress').slice(30, 54);
            GS.debug(GS.get_option('explain_kicks'));
            GS.debug(_.contains(self.kickedOpps, oppId));
            GS.debug(!_.contains(self.explainedOpps, oppId));
            GS.debug(joiner.get('playerName').toLowerCase().indexOf('guest') !== 0);
            GS.debug(whyKick !== null);
            GS.debug(whyKick);
           
            // Explain kick if a non-guest tries to join twice
            if (GS.get_option('explain_kicks')
                    && _.contains(self.kickedOpps, oppId)
                    && !_.contains(self.explainedOpps, oppId)
                    && (joiner.get('playerName').toLowerCase().indexOf('guest') !== 0)
                    && whyKick !== null) {
                var text = joiner.get('playerName') + ', ' + whyKick;
                mtgRoom.conn.chat({text: text});
                self.explainedOpps.push(oppId);
            }

            self.kickedOpps.push(oppId);
        };
    };

    KickCriterion = function () {
        this.apply = true;
    };
    KickCriterion.prototype.evaluate = function () {
        // To be overridden by subclasses
        //return { wouldKick: false, whyKick: null };
        throw 'Not Implemented';
    };
    KickCriterion.prototype.shouldKick = function () {
        return this.apply && this.evaluate().wouldKick;
    };
    KickCriterion.prototype.whyKick = function () {
        return this.evaluate().whyKick;
    };

    RangeKickCriterion = function (ratingSystemName, range, myRating, oppRating) {
        if (range.hasOwnProperty('difference')) {
            this.min = myRating - range.difference;
            this.max = myRating + range.difference;
        } else {
            this.min = range.min;
            this.max = range.max;
        }
        this.oppRating = oppRating;
        this.ratingSystemName = ratingSystemName;
    };
    RangeKickCriterion.prototype = Object.create(KickCriterion.prototype);
    RangeKickCriterion.prototype.evaluate = function () {
        var out = {};
        if (this.oppRating === null) {
            out.wouldKick = true;
            if (this.min !== null) {
                out.whyKick = 'my minimum ' + this.ratingSystemName + ' is ' + this.min;
            }
        } else if (this.min > this.oppRating) {
            out.wouldKick = true;
            out.whyKick = 'my minimum ' + this.ratingSystemName + ' is ' + this.min;
        } else if (this.max < this.oppRating) {
            out.wouldKick = true;
            out.whyKick = 'my maximum ' + this.ratingSystemName + ' is ' + this.max;
        }
        return out;
    };

    NameKickCriterion = function (tableName, oppName) {
        var m = tableName.toLowerCase().match(/for (.*)/);
        this.forName = (m === null ? null : m[1]);
        this.oppName = oppName;
    };
    NameKickCriterion.prototype = Object.create(KickCriterion.prototype);
    NameKickCriterion.prototype.evaluate = function () {
        return {
            wouldKick: this.forName !== null &&
                this.forName.indexOf(this.oppName.toLowerCase()) !== 0,
            whyKick: "I'm waiting for " + this.forName
        };
    };

    BlacklistKickCriterion = function (blacklist, oppName) {
        this.prototype = KickCriterion.prototype;
        this.noplayNames = [];
        var self = this;
        _.each(GS.getCombinedBlacklist(), function (blEntry, blName) {
            if (blEntry.noplay) {
                self.noplayNames.push(blName.toLowerCase());
            }
        });
        this.oppName = oppName;
    };
    BlacklistKickCriterion.prototype = Object.create(KickCriterion.prototype);
    BlacklistKickCriterion.prototype.evaluate = function () {
        return {
            wouldKick: _.contains(this.noplayNames, this.oppName.toLowerCase()),
            whyKick: null       // No explanations for blacklisted players
        };
    };
}());
