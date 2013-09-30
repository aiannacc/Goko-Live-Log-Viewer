/*jslint vars:true, nomen:true, forin:true, regexp:true */
/*globals _, GS, FS */

(function () {
    "use strict";

    // Initialize data structure
    GS.vp = {};

    var sum = function (a, b) { return a + b; };

    GS.modules.vpcalculator = new GS.Module('VP Calculator');
    GS.modules.vpcalculator.dependencies = ['FS.Dominion.CardBuilder.Data.cards'];
    GS.modules.vpcalculator.load = function () {

        var gokoCardData = function (englishCardName) {
            return FS.Dominion.CardBuilder.Data.cards.filter(function (c) {
                return c.name[0] === englishCardName;
            })[0];
        };

        // A single card's VP, given the final deck
        var cardVPValue = function (card, deck) {
            var cname;
            switch (card) {
            case 'Duke':
                return deck.Duchy || 0;
            case 'Fairgrounds':
                return 2 * Math.floor(_.size(deck) / 5);
            case 'Feodum':
                return Math.floor((deck.Silver || 0) / 3);
            case 'Gardens':
                return Math.floor(_.values(deck).reduce(sum) / 10);
            case 'Silk Road':
                var vpCardCount = 0;
                for (cname in deck) {
                    if (gokoCardData(cname).type.match(/victory/)) {
                        vpCardCount += deck[cname];
                    }
                }
                return Math.floor(vpCardCount / 4);
            case 'Vineyard':
                var actionCardCount = 0;
                for (cname in deck) {
                    if (gokoCardData(cname).type.match(/(^|[^e])action/)) {
                        actionCardCount += deck[cname];
                    }
                }
                return Math.floor(actionCardCount / 3);
            case 'Farmland':
            case 'Tunnel':
            case 'Nobles':
            case 'Dame Josephine':
                return 2;
            default:
                // Use goko's data except for Farmland, Tunnel, and Dame J.,
                // which they have wrong in Dominion.CardDuilder.Data.cards
                return gokoCardData(card).vp;
            }
        };

        // Sum of card VP values and vp tokens
        GS.vp.getVPTotal = function (pname) {
            var deck = GS.cardCounts[pname];
            if (typeof deck === 'undefined') { return 0; }
            return _.keys(deck).map(function (card) {
                return cardVPValue(card, deck) * deck[card];
            }).reduce(sum) + GS.vptokens[pname];
        };

        // Format scores for display in chat
        GS.sendScores = function () {
            var scoreString = _.values(GS.vp.toggle.players).map(function (p) {
                return p.pname + ': ' + p.vps;
            }).join(', ');
            GS.sendRoomChat(scoreString);
        };
    };
}());
