/*jslint browser:true, devel:true, nomen:true, forin:true, vars:true, regexp:true, white:true */
/*globals $, _, angular, GS, FS, DominionClient, mtgRoom */

(function () {
    "use strict";

    // Helper functions for Array.reduce()
    var sum = function (a, b) { return a + b; };
    var or = function (a, b) { return a || b; };
    var and = function (a, b) { return a && b; };

    GS.modules.vpcounterui = new GS.Module('VP Counter');
    GS.modules.vpcounterui.dependencies = ['$', '#sidebar', 'angular'];

    GS.modules.vptoggle = new GS.Module('VP Toggle');
    GS.modules.vptoggle.dependencies = ['DominionClient', 'mtgRoom'];

    GS.modules.vpcalculator = new GS.Module('VP Calculator');
    GS.modules.vpcalculator.dependencies = ['FS.Dominion.CardBuilder.Data.cards'];

    GS.modules.vpcounterui.load = function () {
        // Build UI using jQuery
        $('#vptable').attr('ng-app', 'vpApp')
                     .attr('ng-controller', 'vpController')
                     .attr('id', 'vptable')
                     .addClass('vptable')
                     .attr('ng-show', 'vp.vpon')
            .append($('<tbody>')
                .append($('<tr>').attr('ng-repeat',
                                       'player in playerList | orderBy:"vps":true')
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
            $scope.vp = GS.vp;
            $scope.playerList = _.values(GS.vp.players);
            $scope.debug = GS.debugMode;
            $scope.$watch(function () {
                return GS.vp.players;
            }, function () {
                $scope.playerList = _.values(GS.vp.players);
            }, true);
        };
        angular.bootstrap($('#vptable'));
    };

    // Calculate VPs from info provided by decktracker.js
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
        GS.getVPTotal = function (pname) {
            var deck = GS.cardCounts[pname];
            if (typeof deck === 'undefined') { return 0; }
            return _.keys(deck).map(function (card) {
                return cardVPValue(card, deck) * deck[card];
            }).reduce(sum) + GS.vptokens[pname];
        };
    };

    GS.modules.vptoggle.load = function () {
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
            return _.pluck(GS.vp.players, 'isBot').filter(function (x) {
                return !x;
            }).length > 1;
        };

        var allWantOn = function () {
            return _.values(GS.vp.players).every(function (p) {
                return p.isBot || (p.request === true);
            });
        };

        var allWantChange = function () {
            return _.values(GS.vp.players).every(function (p) {
                return p.isBot || (p.wantsChange === true);
            });
        };

        var reqcount = function () {
            return _.values(GS.vp.players).map(function (p) {
                return (p.request !== null) ? 1 : 0;
            }).reduce(sum);
        };

        // Handle VP toggle events from Goko server
        GS.alsoDo(DominionClient, 'onIncomingMessage', null, function (msgType, msgData) {
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
                for (pname in GS.vp.players) {
                    GS.vp.players[pname].vps = GS.getVPTotal(pname);
                }

            } else if (msgType === 'RoomChat') {
                var speaker = mtgRoom.playerList.findByAddress(msgData.playerAddress)
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
                    if (GS.vp.vpon) {
                        var vpMessage = _.values(GS.vp.players).map(function (p) {
                            sendChat(p.pname + ': ' + p.vps);
                        });
                    } else if (speaker !== myname) {
                        sendChat('Sorry, my VP counter is off');
                    }

                } else if (msgData.text.match(/^#vpx$/i)) {
                    if (!GS.vp.locked) {
                        if (speaker === myname) {
                            showChat('Your VP counter is not locked. Use '
                                   + '"#vpon" or "#vpoff" instead.');
                        }
                    } else {
                        // Override lock only if all players request it.
                        GS.vp.players[speaker].wantsChange = true;
                        if (allWantChange()) {
                            GS.vp.vpon = !GS.vp.vpon;
                            sendChat('My VP counter is now ' + (GS.vp.vpon ? 'on' : 'off'));
                            _.values(GS.vp.players).map(function (p) {
                                p.wantsChange = false;
                            });
                        } else if (speaker === myname) {
                            sendChat('My VP counter is locked to ' + (GS.vp.vpon ? 'on' : 'off')
                                   + ', but I\'d like to turn it ' + (GS.vp.vpon ? 'off' : 'on')
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
            myname = mtgRoom.localPlayer.get('playerName');

            // Player info
            GS.vp.players = {};
            gameData.playerInfos.map(function (pinfo) {
                //var pindex = pinfo.playerIndex - gameData.playerToMove;
                //pindex = (pindex + gameData.numPlayers) % gameData.numPlayers + 1;
                GS.vp.players[pinfo.name] = {
                    pname: pinfo.name,
                    vps: null,
                    request: null,
                    wantsChange: false,
                    isBot: pinfo.hasOwnProperty('bot') && pinfo.bot,
                    pclass: 'p' + pinfo.playerIndex
                };
            });

            // Initial toggle state
            GS.vp.locked = false;
            if (isMultiplayer()) {
                // Default from user settings
                GS.vp.vpon = GS.get_option('vp_request');

                // Tablename trumps user settings
                try {
                    var tablename = JSON.parse(mtgRoom.getCurrentTable().get('settings')).name;
                    if (tablename.match(/#vpon/i)) {
                        GS.vp.vpon = true;
                        GS.vp.locked = true;
                    } else if (tablename.match(/#vpoff/i)) {
                        GS.vp.vpon = false;
                        GS.vp.locked = true;
                    }
                } catch (e) {
                    // Bot and adventure games don't have table names
                }
            } else {
                // Always enabled in bot games
                GS.vp.vpon = true;
            }
        };

        onTurnStart = function (pname, turnNumber) {

            // Option "vp_request" automatcially chats "#vpon" on my Turn 2.
            // We wait until T2 to be sure that all players have arrived.
            if (turnNumber === 2 && pname === myname
                    && GS.get_option('vp_request')
                    && isMultiplayer()
                    && reqcount() === 0
                    && !GS.vp.locked) {
                sendChat('#vpon');
            }

            // Lock on Turn 5
            if (turnNumber === 5) {
                GS.vp.locked = true;
            }
        };

        onMyToggleChatRequest = function (vpon) {
            GS.vp.players[myname].request = vpon;

            if (!isMultiplayer()) {
                GS.vp.vpon = vpon;

            } else if (GS.vp.locked) {
                // Explain how to override lock
                if (vpon !== GS.vp.vpon) {
                    showChat('Your VP counter is locked. Say "#vpx" to'
                           + ' ask your opponent to let you change it.');
                }

            } else if (vpon) {
                // Turn on counter. Lock if all have said #vpon or explain the
                // counter if no opponent has said #vpon/#vpoff yet.
                GS.vp.vpon = true;

                if (allWantOn()) {
                    GS.vp.locked = true;
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
                GS.vp.vpon = false;
                GS.vp.locked = true;
            }
        };

        onOppToggleChatRequest = function (oppname, vpon) {
            GS.vp.players[oppname].request = vpon;
            if (GS.vp.locked) {
                if (vpon !== GS.vp.vpon) {
                    sendChat('Sorry. My VP counter is locked to '
                           + (GS.vp.vpon ? 'on.' : 'off.'));
                }
            } else if (vpon) {
                // Auto-reply to opponent's request
                if (GS.vp.players[myname].request === null) {
                    if (GS.get_option('vp_refuse')) {
                        sendChat('#vpoff');
                    } else if (GS.get_option('vp_request')) {
                        sendChat('#vpon');
                    }
                }
                GS.vp.locked = GS.vp.locked || (allWantOn() === true);
            } else {
                sendChat('Ok, my VP counter is off.');
                GS.vp.vpon = false;
                GS.vp.locked = true;
            }
        };
    };

    // Initialize
    window.GS.vp = {
        players: {},
        vpon: false,
        locked: false
    };
}());
