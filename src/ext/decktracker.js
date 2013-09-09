/*jslint browser: true, devel: true, indent: 4, es5: true, vars: true, nomen: true, regexp: true, forin: true, white:true */
/*global jQuery, _, $, Audio */

var loadDecktracker = function (gs, domWindow, logManager, cdbc) {
    "use strict";

    var alterCardCount, parseLogLine, pnames, getHumanCardName;

    // "Listen" to live log messages
    gs.alsoDo(logManager, 'addLog', function (opt) {
        if (opt.text) {
            parseLogLine(opt.text);
        }
    });

    getHumanCardName = function (codedCardName) {
        // Strip the numbers
        codedCardName = codedCardName.replace(/\.\d+$/, '');
        gs.debug(codedCardName);
        // Translate "foolsGold" into "Fool's Gold"
        var c = cdbc.filter(function (card) {
            return card.nameId === codedCardName;
        })[0];
        gs.debug(c);
        return c.name[0];
    };

    // "Listen" to card moves that may be Masquerade passes
    // (Masquerade passes do not appear in the live log)
    gs.alsoDo(domWindow, '_moveCards', function (options, callback) {
        var i;
        for (i = 0; i < options.moves.length; i += 1) {
            var move = options.moves[i];
            var srcArea = move.source.area;
            var dstArea = move.destination.area;
            if (srcArea.name === 'reveal' && dstArea.name === 'hand'
                    && srcArea.playerIndex !== dstArea.playerIndex) {

                // This is a name like 'grandMarket.3'; translate it
                var passedCard = move.sourceCard;
                gs.debug('Passed: ' + passedCard);
                passedCard = getHumanCardName(passedCard);

                gs.debug('Translated: ' + passedCard);
                gs.debug(pnames);
                gs.debug(srcArea.playerIndex);
                gs.debug(dstArea.playerIndex);

                // Decrement the passer's count, increment the recipient's
                alterCardCount(pnames[srcArea.playerIndex], passedCard, -1);
                alterCardCount(pnames[dstArea.playerIndex], passedCard, 1);
            }
        }
    });

    var startPatt = new RegExp(/^-+ Game Setup -+$/);
    var turnPatt = new RegExp(/^-+ (.*): turn \d+( \[possessed\])? -+$/);
    var returnPatt = new RegExp(/(.*) - returns (.*) to the Supply/);
    var gainPatt = new RegExp(/(.*) - gains (.*)/);
    var trashPatt = new RegExp(/(.*) - trashes (.*)/);
    var startingCardsPatt = new RegExp(/^(.*) - starting cards: (.*)/);
    var vptokenPatt = new RegExp(/(.*) - receives ([0-9]*) victory point chips/);
    var spoilsPatt = new RegExp(/(.*) - plays Spoils/);
    var madmanPatt = new RegExp(/(.*) - plays Madman/);
    // TODO: Are Monument or Goons bugged too?
    var bishopPatt = new RegExp(/(.*) - plays Bishop/);

    var turnPlayerName, possessed;
    parseLogLine = function (line) {
        var m, actorName, card;
        if (line.match(startPatt)) {
            gs.cardCounts = {};
            gs.vptokens = {};
            pnames = [];

        } else if ((m = line.match(startingCardsPatt)) !== null) {

            // Initialize players' card/vptoken counts
            actorName = m[1];
            gs.cardCounts[actorName] = {};
            gs.vptokens[actorName] = 0;
            pnames.push(actorName);

            // Add starting cards
            m[2].split(', ').map(function (card) {
                alterCardCount(actorName, card, 1);
            });

        } else if ((m = line.match(turnPatt)) !== null) {
            // Keep track of whose turn it is
            turnPlayerName = m[1];
            possessed = m[2] === ' [possessed]';

        } else if ((m = line.match(gainPatt)) !== null) {
            alterCardCount(m[1], m[2], 1);

        } else if ((m = line.match(returnPatt)) !== null) {
            alterCardCount(m[1], m[2], -1);

        } else if ((m = line.match(trashPatt)) !== null) {
            actorName = m[1];
            m[2].split(', ').map(function (card) {
                gs.debug(m[2]);
                gs.debug('trashed card: [' + card + ']');
                if (possessed) {
                    if (actorName !== turnPlayerName) {
                        alterCardCount(actorName, card, -1);
                    }
                } else if (card !== 'Fortress') {
                    // TODO: Does this handle Band of Misfits as Fortress correctly?
                    alterCardCount(actorName, card, -1);
                }
            });

        } else if ((m = line.match(bishopPatt)) !== null) {
            // Bishop's +1 VP doesn't show up in the live log
            gs.vptokens[m[1]] += 1;

        } else if ((m = line.match(vptokenPatt)) !== null) {
            gs.vptokens[m[1]] += parseInt(m[2], 10);

        } else if ((m = line.match(spoilsPatt)) !== null) {
            alterCardCount(m[1], 'Spoils', -1);

        } else if ((m = line.match(madmanPatt)) !== null) {
            alterCardCount(m[1], 'Madman', -1);
        }
    };

    alterCardCount = function (pname, card, n) {
        if (card === 'JackOfAllTrades') {
            card = 'Jack of All Trades';
        }
        gs.cardCounts[pname][card] = gs.cardCounts[pname][card] || 0;
        gs.cardCounts[pname][card] += n;
        if (gs.cardCounts[pname][card] === 0) {
            delete gs.cardCounts[pname][card];
        }
    };
};

window.GokoSalvager.depWait(
    ['GokoSalvager',
     'Dom.DominionWindow',
     'Dom.LogManager',
     'FS.Dominion.CardBuilder.Data.cards'],
    100, loadDecktracker, this, 'Decktracker Module'
);
