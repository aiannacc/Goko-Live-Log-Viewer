/*jslint browser:true, devel:true, nomen:true, forin:true, vars:true, regexp:true, white:true */
/*globals $, _ */

var loadVPCounterModule = function (gs, dc, cdbc, mroom) {
    "use strict";

    // Namespace for VP Counter
    gs.vp = {};

    // TODO: put somewhere more sensible
    gs.salvagerURL = 'github.com/aiannacc/Goko-Salvager';

    var tablename, handleChat, handleLog, announceLock, isMyT2, sendChat, getScore,
        formatForChat, deckVPValue, cardVPValue, cardTypes, sum, createVPCounter,
        updateVPCounter;
 
    // TODO: synchronize <I'm not sure what I meant when I wrote this...>

    getScore = function (pname) {
        var deck = gs.cardCounts[pname];
        if (typeof deck === 'undefined') { return 0; }
        return _.keys(deck).map(function (card) {
            return cardVPValue(card, deck) * deck[card];
        }).reduce(sum) + gs.vptokens[pname];
    };

    formatForChat = function () {
        return _.keys(gs.cardCounts).map(function (pname) {
            return pname + ': ' + getScore(pname);
        }).join(', ');
    };

    cardTypes = {};
    cdbc.map(function (card) {
        cardTypes[card.name[0]] = card.type;
    });

    sum = function (a, b) { return a + b; };
    cardVPValue = function (card, cardCounts) {
        var c, d = cardCounts;
        switch (card) {
        case 'Dame Josephine':
            return 2; // Not in CardBuilder (Goko bug)
        case 'Duke':
            return d.Duchy || 0;
        case 'Fairgrounds':
            return 2 * Math.floor(_.size(d) / 5);
        case 'Feodum':
            return Math.floor((d.Silver || 0) / 3);
        case 'Gardens':
            return Math.floor(_.values(d).reduce(sum) / 10);
        case 'Silk Road':
            var vpCardCount = 0;
            for (c in d) {
                if (cardTypes[c].match(/victory/)) {
                    vpCardCount += d[c];
                }
            }
            return Math.floor(vpCardCount / 4);
        case 'Vineyard':
            var actionCardCount = 0;
            for (c in d) {
                if (cardTypes[c].match(/action/)) {
                    actionCardCount += d[c];
                }
            }
            return Math.floor(actionCardCount / 3);
        default:
            // Get VP from Goko's CardBuilder data.
            return cdbc.filter(function (c) {
                return c.name[0] === card;
            })[0].vp;
        }
    };

    updateVPCounter = function () {
        $('#vptable').empty();
        if (!gs.vp.vpon) { return; }

        var i, pname, vps;
        for (i = 0; i < gs.vp.pnames.length; i += 1) {
            pname = gs.vp.pnames[i];
            vps = getScore(pname);
            $('<tr>').addClass('p' + (i+1))
                      .append($('<td>').addClass('vptable').text(pname))
                      .append($('<td>').addClass('vptable').text(vps))
                      .appendTo($('#vptable'));
        }
    };

    // Listen to log and chat messages
    gs.alsoDo(dc, 'onIncomingMessage', null, function (messageName, messageData, message) {
        // TODO: cache this somewhere more sensible
        gs.clientConnection = gs.clientConnection || this.clientConnection;

        // TODO: figure out which messages actually contain the table name,
        //       rather than just being overcautious like this
        var tsettings = this.table.get("settings");
        if (typeof tsettings !== 'undefined' && tsettings !== null) {
            var tname = JSON.parse(this.table.get("settings")).name;
            tablename = tname || tablename;
        }

        if (messageName === 'addLog') {
            if (messageData.hasOwnProperty('text')) {
                handleLog(messageData.text);
                updateVPCounter();
            }
        } else if (messageName === 'RoomChat') {
            var speaker = mroom.playerList.findByAddress(
                messageData.playerAddress
            ).get('playerName');
            handleChat(speaker, messageData.text);
            updateVPCounter();
        }
    });

    isMyT2 = function (logText) {
        var m = logText.match(/^-+ (.*): turn 2 -+$/);
        return (m !== null) && (m[1] === mroom.localPlayer.get('playerName'));
    };

    handleLog = function (text) {
        //console.log(text);

        if (text.match(/^-+ Game Setup -+$/)) {
            // Initialize
            gs.vp.humanCount = 0;
            gs.vp.pnamesVPON = [];
            gs.vp.pnames = [];
            gs.vp.vpon = false;
            gs.vp.lock = false;

            // Handle table name #vpon/#vpoff commands
            if (typeof tablename !== 'undefined') {
                if (tablename.match(/#vpon/i)) {
                    gs.vp.vpon = true;
                    gs.vp.lock = true;
                    announceLock(true);
                } else if (tablename.match(/#vpoff/i)) {
                    gs.vp.vpon = false;
                    gs.vp.lock = true;
                    announceLock(true);
                }
            }

        } else if (text.match(/(.*) - starting cards/)) {
            // Collect the player names
            var m = text.match(/(.*) - starting cards/);
            var pname = m[1];
            gs.vp.pnames.push(pname);
            if (!pname.match(/(Bottington| Bot)( [VI]+)?$/)) {
                gs.vp.humanCount += 1;
            }

        } else if (isMyT2(text) && !gs.vp.lock) {
            if (gs.get_option('vp_request')) {
                sendChat('#vpon');
            }

        } else if (text.match(/^-+ (.*): turn 5 -+$/)) {
            // Lock counter on the first player's T5
            gs.vp.vpon = gs.vp.vpon || false;
            if (!gs.vp.lock && gs.vp.announced) {
                announceLock(false);
            }
            gs.vp.lock = true;
        }
    };

    handleChat = function (speaker, text) {
        console.log('Chat from ' + speaker + ': ' + text);
        if (text.match(/^#vpon$/i)) {

            if (gs.vp.lock) {
                // Do nothing if already locked
                if (!gs.vp.vpon) {
                    sendChat('Sorry, my VP counter is already locked to OFF.');
                }

            } else if (gs.get_option('vp_disallow')
                    && gs.vp.hasOwnProperty('humanCount')
                    && gs.vp.humanCount > 1) {
                // Automatically refuse if using vp_disallow option
                sendChat('#vpoff');

            } else {
                // Otherwise enable without locking
                gs.vp.vpon = true;

                // If it's my own #vpon chat, explain it
                if (speaker === mroom.localPlayer.get('playerName')
                        && gs.vp.humanCount > 1) {
                    sendChat('I would like to use a VP Counter (' + gs.salvagerURL + '). '
                           + 'Say "#vpoff" before turn 5 to disallow it or '
                           + '"#vp?" any time to see the score in chat.');
                    gs.vp.announced = true;
                }

                // Lock ON if all human players have requested #vpon
                if (gs.vp.pnamesVPON.indexOf(speaker) === -1) {
                    gs.vp.pnamesVPON.push(speaker);
                    gs.vp.vpon = true;
                    if (gs.vp.pnamesVPON.length === gs.vp.humanCount) {
                        gs.vp.lock = true;
                        announceLock(false);
                    }
                }
            }

        } else if (text.match(/^#vpoff$/i)) {
            if (gs.vp.lock) {
                // Do nothing if already locked
                if (!gs.vp.vpoff) {
                    sendChat('Sorry, my VP counter is already locked to ON.');
                }
            } else {
                gs.vp.vpon = false;
                gs.vp.lock = true;
                announceLock(false);
            }

        } else if (text.match(/^#vp\?$/i)) {
            if (gs.vp.vpon) {
                sendChat(formatForChat());
            } else {
                sendChat('Sorry, my VP counter is off.');
            }
        }
    };

    announceLock = function (includeURL) {
        var msg = 'My VP counter is now ' + (gs.vp.vpon ? 'on' : 'disabled') + ' and locked.';
        if (includeURL) { msg += ' See ' + gs.salvagerURL; }
        sendChat(msg);
    };

    sendChat = function (message) {
        gs.clientConnection.send('sendChat', {text: message});
    };
};

window.GokoSalvager.depWait(
    ['GokoSalvager', 'DominionClient', 'FS.Dominion.CardBuilder.Data.cards', 'mtgRoom'],
    100, loadVPCounterModule, this, 'VP Counter Module'
);
