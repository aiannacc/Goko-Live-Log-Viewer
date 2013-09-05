/*jslint browser: true, devel: true, indent: 4, es5: true, vars: true, nomen: true, regexp: true, forin: true, white:true */
/*global jQuery, _, $, Audio  */

var loadLogviewerModule, createLogviewer, resizeLogviewer;

/*
 * Log viewer module
 */
loadLogviewerModule = function (gs, cdbc, lm, dw) {
    "use strict";   // JSLint setting

    var parseLogLine, logAppendCards, logAppend, logAppendPlayer;

    // Map from player name to turn order
    var pname2pindex;

    // Current player/phase
    var gamePhase, logPhase, possessed, gameStarted, gameOver;

    // "Listen" to game phase changes. These always precede the log messages
    // of the new phase.
    gs.alsoDo(dw, '_updateState', function (opt) {
        gamePhase = opt.dominionPhase || gamePhase;
    });

    // "Listen" to log additions
    gs.alsoDo(lm, 'addLog', function (opt) {
        if (opt.logUrl) {
            // Link to retrobox prettified log instead of Goko
            opt.logUrl = 'http://dom.retrobox.eu/?' + opt.logUrl.substr(29);
        }
        if (opt.text) {
            parseLogLine(opt.text);
            $('#prettylog').scrollTop($('#prettylog').height());
        }
    });

    // Goko's map from card name to card type (e.g. 'Copper' --> 'treasure')
    var cardTypes = {};
    cdbc.map(function (card) {
        cardTypes[card.name[0]] = card.type;
    });

    // Regex pattern to identify all cards
    var cardPatt = new RegExp(cdbc.map(function (card) {
        return card.name[0];
    }).sort(function (a, b) {
        return b.length - a.length;
    }).join('|'), 'g');

    // Append a list of formatted cards to the log
    // Ex: ['Copper', 'Estate'] appends <span class="treasure">Copper</span>, <span class="victory">Estate</span>
    logAppendCards = function (cardList) {
        var i, card, cardTitle;
        for (i = 0; i < cardList.length; i += 1) {
            card = cardList[i];
            cardTitle = (card === 'JackOfAllTrades' ? 'Jack of All Trades' : card);
            $('<span/>').addClass('card')
                        .addClass(cardTypes[card])
                        .text(cardTitle)
                        .appendTo($("#prettylog"));
            if (i < cardList.length - 1) {
                logAppend(', ');
            }
        }
    };

    logAppendPlayer = function (pname, pindex) {
        logAppend('<span class="p' + pindex + '">' + pname + '</span>');
    };

    logAppend = function (text) {
        $('#prettylog').append(text);
    };

    var setupPatt = new RegExp(/^-+ Game Setup -+$/);
    var supplyPatt = new RegExp(/^Supply cards: (.*)/);
    var startingCardsPatt = new RegExp(/^(.*) - starting cards: (.*)/);
    var turnPatt = new RegExp(/^-+ ((.*): turn (\d+)( \[possessed\])?) -+$/);
    var actPatt = new RegExp(/^(.*) - (([a-z]*:?) ?(.*)?)$/);
    var gameOverPatt = new RegExp(/^-+ Game Over -+$/);

    parseLogLine = function (line) {
        var m, pname, pindex;

        if (line.match(setupPatt)) {
            $('#prettylog').empty();
            pname2pindex = {};
            logAppend($('<h1/>').addClass('gameheader').text('Game Setup'));
            gameStarted = false;

        } else if ((m = line.match(supplyPatt)) !== null) {
            logAppend('Supply Cards: ');
            logAppendCards(m[1].split(', '));
            logAppend('<br>');

        } else if ((m = line.match(startingCardsPatt)) !== null) {
            pname = m[1];
            pindex = _.size(pname2pindex) + 1;
            pname2pindex[pname] = pindex;

            var startingCards = m[2];
            logAppendPlayer(pname, pindex);
            logAppend(' starting cards: ');
            logAppendCards(m[2].split(', '));
            logAppend('<br>');

        } else if ((m = line.match(turnPatt)) !== null) {
            pname = m[2];
            pindex = pname2pindex[pname];
            logAppend($('<h1/>').addClass('turnheader')
                                .addClass('p' + pindex)
                                .text(m[1]));
            gameStarted = true;

        } else if ((m = line.match(actPatt)) !== null) {
            // Parse the log line
            pname = m[1];
            pindex = pname2pindex[pname];
            var action = m[3];
            var rest = m[4] || '';

            // Determine whether this is the start of a new phase
            var newPhase = logPhase !== gamePhase;
            logPhase = gameOver ? 'gameOver' : gamePhase;
            var phaseInitial = (!newPhase || !gameStarted || gameOver) ?
                                '&nbsp;' : logPhase.charAt(0).toUpperCase();

            // Print new phase's initial or just indent
            logAppend($('<span/>').addClass('phase')
                                  .addClass(logPhase + 'Phase')
                                  .html(phaseInitial));
            logAppend(' ');
            logAppendPlayer(pname, pindex);
            logAppend(' ' + action + ' ');

            // Parse out and format card names, vp tokens, coin tokens
            var cards = [];
            var nonCardText = rest.replace(cardPatt, function (match) {
                cards.push(match);
                return '--XXX--';
            }).split('--XXX--');
            var i, nctext;
            for (i = 0; i < nonCardText.length; i += 1) {
                logAppend(' ' + nonCardText[i] + ' ');
                if (i < cards.length) {
                    logAppendCards([cards[i]]);
                }
            }
            logAppend('<br>');

        } else if (line.match(gameOverPatt)) {
            logAppend($('<h1/>').addClass('gameheader').text('Game Over'));
            gameOver = true;

        } else {
            logAppend(line);
            logAppend('<br>');
        }
    };
};

window.GokoSalvager.depWait(
    ['GokoSalvager',
     'FS.Dominion.CardBuilder.Data.cards',
     'Dom.LogManager',
     'Dom.DominionWindow'],
    100, loadLogviewerModule, this, 'Logviewer Module'
);
