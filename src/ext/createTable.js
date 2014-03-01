/*jslint browser: true, devel: true, indent: 4, vars: true, nomen: true, regexp: true, forin: true, white:true */
/*global $, _, GS, FS, mtgRoom */

(function () {
    "use strict";

    console.log('Loading Create Table');

    var mod = GS.modules.createTable = new GS.Module('createTable');
    mod.dependencies = [
        'FS.Dominion.DeckBuilder.Persistent',
        'mtgRoom'
    ];
    mod.load = function () {
        GS.gokoPRM = FS.Dominion.DeckBuilder.Persistent.prototype._proRandomMethod;
        
        var canonize = function (cardName) {
            var out = cardName.replace("'","").replace(" ","");
            return out.charAt(0).toLowerCase() + out.slice(1);
        };

        var cardsToNameIds = function (cards) {
            return cards.map(function (c) {
                return { nameId: canonize(c) };
            });
        };

        GS.leaveTable = function () {
            // Leave current table, if any
            var zch = mtgRoom.getHelper('ZoneClassicHelper');
            if (zch.hasOwnProperty('currentTable') && zch.currentTable !== null) {
                zch.leaveTable(zch.currentTable);
            }
        };
    
        // TODO: Implement useShelters and useColonies
        GS.createTable = function (tableName, numPlayers, ratingSystem,
                                   useShelters, useColonies, kingdom) {
            // First leave whatever table we're currently seated at
            GS.leaveTable();

            var seatsState = [1, 2, 3, 4, 5, 6].map(function (i) {
                return (i <= numPlayers + 1);
            });
    
            var deck = new FS.Dominion.DeckBuilder.Model.CardDeck();
            deck = deck.doEmpty();
            deck.set({ name: 'Salvager deck' });

            mtgRoom.deckBuilder.persistent.getRandomDeck({
                app: mtgRoom.deckBuilder,
                deck: deck,
                useEternalGenerateMethod: true  // (Goko typo)
            }, function (d) {
                var tSettings = {
                    name: tableName,
                    seatsState: seatsState,
                    gameData: {uid: ""},
                    kingdomCards: kingdom,
                    platinumColony: useColonies,
                    useShelters: useShelters,
                    ratingType: ratingSystem
                };
                var tOpts = {
                    settings: JSON.stringify(tSettings),
                    isLock: false,
                    isRequestJoin: false,
                    isRequestSit: false,
                    tableIndex: null
                };
                mtgRoom.getHelper('ZoneClassicHelper').createTable(tOpts);
            });
        };

        // Specify the exact kingdom to be used in the next pro game
        GS.fixNextProKingdom = function (cards) {
            GS.nextProCards = cardsToNameIds(cards);
            FS.Dominion.DeckBuilder.Persistent.prototype._proRandomMethod = function () {
                // Restore random deck generation
                FS.Dominion.DeckBuilder.Persistent.prototype._proRandomMethod = GS.gokoPRM;
                // But use the fixed deck this one time
                return GS.nextProCards;
            };
        };
    };
}());
