/*jslint browser: true, devel: true, indent: 4, vars: true, nomen: true, regexp: true, forin: true, white:true */
/*global $, _, GS, FS */

(function () {
    "use strict";

    console.log('Loading createTable');

    var mod = GS.modules.autokick = new GS.Module('Create Table');
    mod.dependencies = [
        'FS.Dominion.DeckBuilder.Persistent'
    ];
    mod.load = function () {
        GS.gokoPRM = FS.Dominion.DeckBuilder.Persistent.prototype._proRandomMethod;

        var cardsToNameIds = function (cards) {
            return cards.map(function (c) {
                return { nameId: c };
            });
        };

        // Specify the exact deck to be used in the next pro game
        // TODO: How to specify colonies/shelters?
        GS.fixNextProDeck = function (cards) {
            FS.Dominion.DeckBuilder.Persistent.prototype._proRandomMethod = function () {
                // Restore random deck generation
                FS.Dominion.DeckBuilder.Persistent._proRandomMethod = GS.gokoPRM;
                // But use the fixed deck this one time
                return cardsToNameIds(cards);
            };
        };
    };
}());
