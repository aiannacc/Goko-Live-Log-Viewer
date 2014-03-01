/*jslint vars:true, forin:true, browser:true, devel:true, nomen:true */
/*globals FS, GS, _ */

(function () {
    'use strict';

    console.log('Loading kingdom generator II');

    var mod = GS.modules.kingdomGenerator2 = new GS.Module('kingdomGenerator2');
    mod.dependencies = ['GS.kingdomParser'];
    mod.load = function () {

        // The parser needs a data structure that indicates which cards belong
        // to which set.  A "set" is one of the terms that can be used in the
        // kingdom generator formula.  It can be the name of an expansion set,
        // set, but it can also be "action" or "cost2" or "all" or "feodum".
        //
        // The final data structure needs to have entries like this:
        //   sets.base.moat = 1
        //   sets.action.moat = 1
        //   sets.reaction.moat = 1
        //   sets.cost2.moat = 1
        //   sets.all.moat = 1
        //   sets.moat = 1
        //
        // That is, in each set to which 'Moat' belongs, there is a child
        // element whose value is 1.
        //
        // We can mostly pull the necessary data out of the Goko framework, but
        // we have to supplement their data with the potion-cost cards and with
        // which cards are ineligible to be kingdom cards.
        //
        // The data structure is also known to have a few errors in the VP
        // entries.  While VP data isn't necessary here, those errors suggest
        // that the data structure may have some other errors too.  So look
        // there first if/when card-specific bugs crop up.

        // NOTE: kingdomParser.js expects "sets" and "canonizeName" to be
        //       global.  It is a Bad Thing to pollute the JS namespace like
        //       this, but the kingdomParser.js code is machine-generated and
        //       I don't want to try to edit it.

        window.sets = {};
        var addToSet = function (setName, cardName) {
            if (!window.sets.hasOwnProperty(setName)) {
                window.sets[setName] = {};
            }
            window.sets[setName][cardName] = 1;
        };
        window.canonizeName = function (n) {
            return n.toLowerCase().replace(/\W+/g, '');
        };

        // Use Gokos card data to populate the "sets" data structure
        var coreVP = ['curse', 'estate', 'duchy', 'province', 'colony'];
        var coreTreasure = ['copper', 'silver', 'gold', 'platinum'];
        FS.Dominion.CardBuilder.Data.cards.map(function (card) {
            var lcName = card.nameId.toLowerCase();
            var types = card.type.toLowerCase().split('-');
            var expansion = card.set.toLowerCase().split('-')[0];
            var goldCost = card.cost;
            var costsPotion = expansion === 'alchemy'
                           && card.nameID !== 'herbalist'
                           && card.nameID !== 'potion'
                           && card.nameID !== 'apprentice';

            var isKingdom = !_.contains(types, 'knight')
                         && !_.contains(types, 'ruins')
                         && !_.contains(types, 'shelter')
                         && !_.contains(coreVP, lcName)
                         && !_.contains(coreTreasure, lcName)
                         && goldCost.indexOf('*') === -1;

            if (isKingdom) {
                addToSet(lcName, lcName);
                addToSet('all', lcName);
                addToSet(expansion, lcName);
                addToSet('cost' + goldCost, lcName);
                if (costsPotion) { addToSet('costspotion', lcName); }
                types.map(function (type) { addToSet(type, lcName); });
            }
        });

        // Knights have to be handled specially
        addToSet('all', 'knights');
        addToSet('darkages', 'knights');
        addToSet('action', 'knights');
        addToSet('attack', 'knights');
        addToSet('cost5', 'knights');   // Not quite accurate, but close enough

        // Given a set like { card1:weight1, ... }, choose a random card. The
        // probability of choosing each card should be proportional to its
        // weight.
        var chooseCard = function (weights) {
            var sum = 0, card;
            for (card in weights) {
                sum += weights[card];
            }
            if (sum === 0) {
                return null;
            }

            var r = sum * Math.random();

            sum = 0;
            for (card in weights) {
                sum += weights[card];
                if (sum > r) { return card; }
            }
            throw 'Impossible to reach this code.  Implies ' + r + ' > ' + sum;
        };

        // TODO: This function assumes that you own all the card sets.  Alter
        //       it to check which sets we own, using the sets-owned lookup
        //       code from the Automatch module.
        GS.generateKingdom = function (formula, numCards, includeBane) {
            
            // The formula should be a comma-separated list of set criteria,
            // one for each requested card.  If the formula is too short, pad
            // it out with extra "all" elements.
            while (formula.split(',').length < numCards) {
                formula = [formula, 'all'].join(',');
            }

            // Generate a weighted set of possible cards from which to choose
            // each kingdom card.
            var wsList = GS.kingdomParser.parse(formula);
            var cards = wsList.map(chooseCard);

            return cards;
        };
    };
}());
