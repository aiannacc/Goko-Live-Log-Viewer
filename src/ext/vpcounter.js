/*jslint browser:true, devel:true, nomen:true, forin:true, vars:true, regexp:true, white:true */
/*globals $, _, angular */

(function () {
    "use strict";

    // Helper functions for Array.reduce()
    var sum = function (a, b) { return a + b; };
    var or = function (a, b) { return a || b; };
    var and = function (a, b) { return a && b; };

    var buildUI = function (gs) {

        // Build UI using jQuery
        $('#vptable').attr('ng-app', 'vpApp')
                     .attr('ng-controller', 'vpController')
                     .attr('id', 'vptable')
                     .addClass('vptable')
                     .attr('ng-show', 'vp.vpon')
            .append($('<tbody>')
                .append($('<tr>').attr('ng-repeat',
                                       'player in vp.players | orderBy:"vps":true')
                    .addClass('{{player.pclass}}')
                    .append($('<td>').text('{{player.pname}}'))
                    .append($('<td>').attr('ng-show', 'debugMode')
                                     .text('{{player.request}}'))
                    .append($('<td>').attr('ng-show', 'debugMode')
                                     .text('{{player.wantsChange}}'))
                    .append($('<td>').text('{{player.vps}}')))
                .append($('<tr>').attr('ng-show', 'debugMode')
                    .append($('<td>').text('{{vp.locked}}'))));

        // Bind UI to model using AngularJS
        window.vpController = function ($scope) {
            $scope.vp = gs.vp;
            $scope.debug = gs.debugMode;
        };
        angular.bootstrap($('#vptable'));
    };

    // Calculate VPs from info provided by decktracker.js
    var loadVPCalculator = function (gs, cdbc) {

        // A single card's VP, given the final deck
        var cardVPValue = function (card, deck) {

            // goko's data on this card
            var cardData = cdbc.filter(function (c) {
                return c.name[0] === card;
            })[0];

            var c, d = deck;
            switch (card) {
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
                    if (cardData.type.match(/victory/)) {
                        vpCardCount += d[c];
                    }
                }
                return Math.floor(vpCardCount / 4);
            case 'Vineyard':
                var actionCardCount = 0;
                for (c in d) {
                    if (cardData.type.match(/action/)) {
                        actionCardCount += d[c];
                    }
                }
                return Math.floor(actionCardCount / 3);
            case 'Farmland':
            case 'Tunnel':
            case 'Dame Josephine':
                return 2;
            default:
                // Use goko's data except for Farmland, Tunnel, and Dame J., 
                // which they have wrong in Dominion.CardDuilder.Data.cards
                return cardData.vp;
            }
        };

        // Sum of card VP values and vp tokens
        gs.getVPTotal = function (pname) {
            var deck = gs.cardCounts[pname];
            if (typeof deck === 'undefined') { return 0; }
            return _.keys(deck).map(function (card) {
                return cardVPValue(card, deck) * deck[card];
            }).reduce(sum) + gs.vptokens[pname];
        };
    };

    var loadVPToggle = function (gs, dc, mroom) {
        var initialize,
            onTurnStart,
            onToggleChatRequest,
            onMyToggleChatRequest,
            onOppToggleChatRequest;

        var salvagerURL = 'github.com/aiannacc/Goko-Salvager';
        var chatConn, myname;

        var sendChat = function (message) {
            chatConn.send('sendChat', {text: message});
        };

        // Show a message in my chat box without sending
        var showChat = function (message) {
            chatConn.trigger("addChat", {
                playerName: '***',
                text: message
            });
        };

        // Are there at least two human players?
        var isMultiplayer = function () {
            return _.pluck(gs.vp.players, 'isBot').filter(function (x) {
                return !x;
            }).length > 1;
        };

        var allWantOn = function () {
            return _.values(gs.vp.players).every(function (p) {
                return p.isBot || (p.request === true);
            });
        };

        var allWantChange = function () {
            return _.values(gs.vp.players).every(function (p) {
                return p.isBot || (p.wantsChange === true);
            });
        };

        var reqcount = function () {
            return _.values(gs.vp.players).map(function (p) {
                return (p.request !== null) ? 1 : 0;
            }).reduce(sum);
        };

        // Handle VP toggle events from Goko server
        gs.alsoDo(dc, 'onIncomingMessage', null, function (msgType, msgData) {
            if (msgType === 'gameSetup') {
                // Gather game and player info; set initial VP counter state
                initialize(msgData, this);
                
            } else if (msgType === 'addLog') {
                if (!msgData.hasOwnProperty('text')) { return; }
                var m = msgData.text.match(/^-+ (.*): turn ([0-9]*)/);
                if (m !== null) {
                    onTurnStart(m[1], parseInt(m[2], 10));
                }

                // Update VP totals
                var pname;
                for (pname in gs.vp.players) {
                    gs.vp.players[pname].vps = gs.getVPTotal(pname);
                }

            } else if (msgType === 'RoomChat') {
                var speaker = mroom.playerList.findByAddress(msgData.playerAddress)
                                              .get('playerName');

                if (msgData.text.match(/^#vpon$/i)) {
                    if (speaker === myname) {
                        onMyToggleChatRequest(true);
                    } else {
                        onOppToggleChatRequest(speaker, true);
                    }

                } else if (msgData.text.match(/^#vpoff$/i)) {
                    if (speaker === myname) {
                        onMyToggleChatRequest(false);
                    } else {
                        onOppToggleChatRequest(speaker, false);
                    }

                } else if (msgData.text.match(/^#vp\?$/i)) {
                    if (gs.vp.vpon) {
                        var vpMessage = _.values(gs.vp.players).map(function (p) {
                            sendChat(p.pname + ': ' + p.vps);
                        });
                    } else if (speaker !== myname) {
                        sendChat('Sorry, my VP counter is off');
                    }

                } else if (msgData.text.match(/^#vpx$/i)) {
                    if (!gs.vp.locked) {
                        if (speaker === myname) {
                            showChat('Your VP counter is not locked. Use '
                                   + '"#vpon" or "#vpoff" instead.');
                        }
                    } else {
                        // Override lock only if all players request it.
                        gs.vp.players[speaker].wantsChange = true;
                        if (allWantChange()) {
                            gs.vp.vpon = !gs.vp.vpon;
                            sendChat('My VP counter is now ' + (gs.vp.vpon ? 'on' : 'off'));
                            _.values(gs.vp.players).map(function (p) {
                                p.wantsChange = false;
                            });
                        } else if (speaker === myname) {
                            sendChat('My VP counter is locked to ' + (gs.vp.vpon ? 'on' : 'off')
                                   + ', but I\'d like to turn it ' + (gs.vp.vpon ? 'off' : 'on')
                                   + ' anyway. To allow, please say "#vpx"');
                        }
                    }
                }
            }

            // Tell AngularJS that the vptable's model may have changed
            $('#vptable').scope().$digest();
        });

        initialize = function (gameData, domClient) {
            // Game info
            chatConn = domClient.clientConnection;
            myname = mroom.localPlayer.get('playerName');

            // Player info
            gs.vp.players = {};
            gameData.playerInfos.map(function (pinfo) {
                var pindex = pinfo.playerIndex - gameData.playerToMove;
                pindex = (pindex + gameData.numPlayers) % gameData.numPlayers + 1;
                gs.vp.players[pinfo.name] = {
                    pname: pinfo.name,
                    vps: null,
                    request: null,
                    wantsChange: false,
                    isBot: pinfo.hasOwnProperty('bot') && pinfo.bot,
                    pclass: 'p' + pindex
                };
            });

            // Initial toggle state
            gs.vp.locked = false;
            if (isMultiplayer()) {
                // Default from user settings
                gs.vp.vpon = gs.get_option('vp_request');

                // Tablename trumps user settings
                try {
                    var tablename = JSON.parse(mroom.getCurrentTable().get('settings')).name;
                    if (tablename.match(/#vpon/i)) {
                        gs.vp.vpon = true;
                        gs.vp.locked = true;
                    } else if (tablename.match(/#vpoff/i)) {
                        gs.vp.vpon = false;
                        gs.vp.locked = true;
                    }
                } catch (e) {
                    // Bot and adventure games don't have table names
                }
            } else {
                // Always enabled in bot games
                gs.vp.vpon = true;
            }
        };

        onTurnStart = function (pname, turnNumber) {

            // Option "vp_request" automatcially chats "#vpon" on my Turn 2.
            // We wait until T2 to be sure that all players have arrived.
            if (turnNumber === 2 && pname === myname
                    && gs.get_option('vp_request')
                    && isMultiplayer()
                    && reqcount() === 0
                    && !gs.vp.locked) {
                sendChat('#vpon');
            }

            // Lock on Turn 5
            if (turnNumber === 5) {
                gs.vp.locked = true;
            }
        };

        onMyToggleChatRequest = function (vpon) {
            gs.vp.players[myname].request = vpon;

            if (!isMultiplayer()) {
                gs.vp.vpon = vpon;

            } else if (gs.vp.locked) {
                // Explain how to override lock
                if (vpon !== gs.vp.vpon) {
                    showChat('Your VP counter is locked. Say "#vpx" to'
                           + ' ask your opponent to let you change it.');
                }

            } else if (vpon) {
                // Turn on counter. Lock if all have said #vpon or explain the
                // counter if no opponent has said #vpon/#vpoff yet.
                gs.vp.vpon = true;

                if (allWantOn()) {
                    gs.vp.locked = true;
                } else {
                    // Wait for auto-responses before sending explanation
                    setTimeout(function () {
                        if (reqcount() === 1) {
                            sendChat('I\'d like to use a VP counter '
                                   + '(See ' + salvagerURL + '). '
                                   + 'You can say "#vpoff" before Turn 5 to disallow '
                                   + 'it, or say "#vp?" to see the score in chat.');
                        }
                    }, 2000);
                }

            } else {
                gs.vp.vpon = false;
                gs.vp.locked = true;
            }
        };

        onOppToggleChatRequest = function (oppname, vpon) {
            gs.vp.players[oppname].request = vpon;
            if (gs.vp.locked) {
                if (vpon !== gs.vp.vpon) {
                    sendChat('Sorry. My VP counter is locked to '
                           + (gs.vp.vpon ? 'on.' : 'off.'));
                }
            } else if (vpon) {
                // Auto-reply to opponent's request
                if (gs.vp.players[myname].request === null) {
                    if (gs.get_option('vp_refuse')) {
                        sendChat('#vpoff');
                    } else if (gs.get_option('vp_request')) {
                        sendChat('#vpon');
                    }
                }
                gs.vp.locked = gs.vp.locked || (allWantOn() === true);
            } else {
                sendChat('Ok, my VP counter is off.');
                gs.vp.vpon = false;
                gs.vp.locked = true;
            }
        };
    };

    // Initialize
    window.GokoSalvager.vp = {
        players: {},
        vpon: false,
        locked: false
    };
    window.GokoSalvager.depWait(
        ['GokoSalvager'], // TODO: also wait for $('#sidebar') element
        100, buildUI, this, 'VP Table'
    );
    window.GokoSalvager.depWait(
        ['GokoSalvager', 'DominionClient', 'mtgRoom'],
        100, loadVPToggle, this, 'VP Toggle'
    );
    window.GokoSalvager.depWait(
        ['GokoSalvager', 'FS.Dominion.CardBuilder.Data.cards'],
        100, loadVPCalculator, this, 'VP Calculator'
    );
}());
