/*jslint browser: true, devel: true, indent: 4, es5: true, vars: true, nomen: true, regexp: true, forin: true, white:true */
/*global _, $, Audio, GS, FS, Dom, DominionClient */

(function () {
    "use strict";   // JSLint setting

    var mod = GS.modules.logviewer = new GS.Module('Prettified Log Viewer');
    mod.dependencies = [
        'FS.Dominion.CardBuilder.Data.cards',
        'Dom.LogManager',
        'Dom.DominionWindow',
        'DominionClient'
    ];
    mod.load = function () {
        var parseLogLine, logAppendCards, logAppend, logAppendPlayer, logNewline;

        // Map from player name to class
        var pname2pclass;

        // Current player/phase
        var gamePhase, logPhase, possessed, gameStarted, gameOver;

        // "Listen" to game phase changes. These always precede the log messages
        // of the new phase.
        GS.alsoDo(Dom.DominionWindow, '_updateState', function (opt) {
            gamePhase = opt.dominionPhase || gamePhase;
        });

        GS.alsoDo(DominionClient, 'onIncomingMessage', null, function (msgType, msgData) {
            if (msgType === 'gameSetup') {
                pname2pclass = {};
                msgData.playerInfos.map(function (pinfo) {
                    pname2pclass[pinfo.name] = 'p' + pinfo.playerIndex;
                });
            }
        });

        // "Listen" to log additions
        GS.alsoDo(Dom.LogManager, 'addLog', function (opt) {
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
        FS.Dominion.CardBuilder.Data.cards.map(function (card) {
            cardTypes[card.name[0]] = card.type;
        });

        // Regex pattern to identify all cards
        var cardPatt = new RegExp(FS.Dominion.CardBuilder.Data.cards.map(function (card) {
            return card.name[0];
        }).sort(function (a, b) {
            return b.length - a.length;
        }).join('|'), 'g');

        // Append a list of formatted cards to the log
        // Ex: ['Copper', 'Estate'] appends 
        // <span class="treasure">Copper</span>, <span class="victory">Estate</span>
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

        logAppendPlayer = function (pname) {
            $('#prettylog').append($('<span>').addClass(pname2pclass[pname])
                                              .text(pname));
        };

        logAppend = function (text) {
            $('#prettylog').append($('<span>').text(text));
        };

        logNewline = function () {
            $('#prettylog').append($('<br>'));
        };

        var setupPatt = new RegExp(/^-+ Game Setup -+$/);
        var supplyPatt = new RegExp(/^Supply cards: (.*)/);
        var startingCardsPatt = new RegExp(/^(.*) - starting cards: (.*)/);
        var turnPatt = new RegExp(/^-+ ((.*): turn (\d+)( \[possessed\])?) -+$/);
        var actPatt = new RegExp(/^(.*) - (([a-z]*:?) ?(.*)?)$/);
        var gameOverPatt = new RegExp(/^-+ Game Over -+$/);

        parseLogLine = function (line) {
            var m, pname, pclass;

            if (line.match(setupPatt)) {
                $('#prettylog').empty();
                logAppend($('<h1/>').addClass('gameheader').text('Game Setup'));
                gameStarted = false;

            } else if ((m = line.match(supplyPatt)) !== null) {
                logAppend('Supply Cards: ');
                logAppendCards(m[1].split(', '));
                logNewline();

            } else if ((m = line.match(turnPatt)) !== null) {
                pname = m[2];
                pclass = pname2pclass[pname];
                $('#prettylog').append($('<h1>').addClass('turnheader')
                                                .addClass(pclass)
                                                .text(m[1]));
                gameStarted = true;

            } else if ((m = line.match(startingCardsPatt)) !== null) {
                pname = m[1];
                var startingCards = m[2];
                logAppendPlayer(pname);
                logAppend(' starting cards: ');
                logAppendCards(m[2].split(', '));
                logNewline();

            } else if ((m = line.match(actPatt)) !== null) {
                // Parse the log line
                pname = m[1];
                pclass = pname2pclass[pname];
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
                                      .text(phaseInitial));
                logAppend(' ');
                logAppendPlayer(pname);
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
                logNewline();

            } else if (line.match(gameOverPatt)) {
                logAppend($('<h1/>').addClass('gameheader').text('Game Over'));
                gameOver = true;

            } else {
                logAppend(line);
                logNewline();
            }
        };
    };
}());
