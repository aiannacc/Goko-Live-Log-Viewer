/*jslint vars:true, nomen:true, forin:true, regexp:true, browser:true, devel:true */
/*globals _, $, GS, FS, mtgRoom */

// TODO: Immediately send Turn 2 messages when opponents have all joined the game.

(function () {
    "use strict";

    var sum = function (a, b) { return a + b; };

    var vpinfo = [];
    vpinfo.push('The Goko Dominion Salvager extension includes a '
           + 'Victory Point counter (gokosalvager.com). It displays the '
           + 'current scores in chat whenever any player says "#vp?"');
    vpinfo.push('The counter may only be used if all players allow it. Say '
           + '#vpon to request it or #vpoff to disallow it. ');
    vpinfo.push('Salvager has options to send these commands automatically. '
           + 'The "Always Request" option (which is enabled by default), '
           + 'will automatically say #vpon at the start of your Turn 2.');
    vpinfo.push('The counter can be enabled or disabled any time before '
           + 'Turn 5, at which point it will become locked. Once locked, the '
           + 'counter can only be toggled if all players agree by saying '
           + '#vpx.');
    vpinfo.push('The counter will also be immediately locked if any player '
           + 'says #vpoff, or if all players have said #vpon, or if the host '
           + 'has announced it in advance by putting #vpon or #vpoff in the '
           + 'game title.');
    
    GS.VPToggle = function (always_request, always_refuse, gameTitle, myName, pnames, isBots) {
        this.always_request = always_request;
        this.always_refuse = always_refuse;
        this.gameTitle = gameTitle;
        this.myName = myName;
        this.players = {};
        this.beforeT5 = true;
        this.announced = false;
        var i;
        for (i = 0; i < pnames.length; i += 1) {
            this.players[pnames[i]] = {
                pname: pnames[i],
                vps: null,
                request: null,
                wantsChange: false,
                isBot: isBots[i],
                pclass: 'p' + i,
                joined: false
            };
        }
    };

    // Are there at least two human players?
    GS.VPToggle.prototype = {
        isMultiplayer: function () {
            return _.pluck(this.players, 'isBot').filter(function (x) {
                return !x;
            }).length > 1;
        },

        // Have all human players said "#vpon"?
        allWantOn: function () {
            return _.values(this.players).every(function (p) {
                return p.isBot || (p.request === true);
            });
        },

        // Have all human players said "#vpx"?
        allWantChange: function () {
            return _.values(this.players).every(function (p) {
                return p.isBot || (p.wantsChange === true);
            });
        },

        // How many players have said either "#vpon" or "#vpoff"?
        reqcount: function () {
            return _.values(this.players).map(function (p) {
                return (p.request !== null) ? 1 : 0;
            }).reduce(sum);
        },

        init: function () {
            this.alreadyResponded = false;
            
            if (this.isMultiplayer()) {
                if (GS.get_option('greeting').length > 0) {
                    GS.sendRoomChat(GS.get_option('greeting'));
                }
            }

            // Initialize toggle state and explain commands
            if (!this.isMultiplayer()) {
                // Always enabled and never locked in bot games
                this.vpon = true;
                this.locked = false;
                this.whyLocked = null;
                GS.showRoomChat('The VP Counter is ON because all the other '
                              + 'players are bots.');
                GS.showRoomChat('Say "#vphelp" for more info.');

            } else if (this.gameTitle.match(/#vpoff/i)) {
                // #vpoff in table name disables and locks
                this.vpon = false;
                this.locked = true;
                this.whyLocked = 'the table name contained "#vpoff"';
                GS.showRoomChat('The VP Counter is OFF and LOCKED because ' + this.whyLocked);
                GS.showRoomChat('Say "#vphelp" for more info.');

            } else if (this.gameTitle.match(/#vpon/i)) {
                this.vpon = true;
                this.locked = true;
                this.whyLocked = 'the table name contained "#vpon"';
                GS.showRoomChat('The VP Counter is ON and LOCKED because ' + this.whyLocked);
                GS.showRoomChat('Say "#vphelp" for more info.');

            } else if (this.always_request) {
                this.vpon = true;
                this.locked = false;
                this.whyLocked = null;
                GS.showRoomChat('The VP Counter is ON because your "VP Counter: '
                              + 'Always Request" option is enabled.');
                GS.showRoomChat('Say "#vphelp" for more info.');

            } else if (this.always_refuse) {
                this.vpon = false;
                this.locked = false;
                this.whyLocked = null;
                GS.showRoomChat('The VP Counter is OFF because your "VP Counter: '
                              + 'Always Refuse" option is enabled.');
                GS.showRoomChat('Say "#vphelp" for more info.');

            } else {
                this.vpon = false;
                this.locked = false;
                this.whyLocked = null;
                GS.showRoomChat('The VP Counter is available. Say "#vpon" to '
                              + 'enable it.');
                GS.showRoomChat('Say "#vphelp" for more info.');
            }
        },

        onMyChat: function (text) {
            switch (text) {
            case '#vpon':
                this.handleMyVPON();
                break;
            case '#vpoff':
                this.handleMyVPOFF(false);
                break;
            case '#vp?':
                if (this.vpon) {
                    GS.sendScores();
                } else {
                    GS.showRoomChat('Cannot show scores. Your VP counter is off.');
                }
                break;
            case '#vpx':
                if (!this.locked) {
                    GS.showRoomChat('Your VP counter is not locked. Say #vpon '
                                  + 'or #vpoff instead. Say #vphelp for more info.');
                } else {
                    this.players[this.myName].wantsChange = true;
                    if (this.allWantChange()) {
                        this.vpon = !this.vpon;
                        _.values(this.players).map(function (p) {
                            p.wantsChange = false;
                        });
                        this.whyLocked = 'all players said #vpx';
                        GS.sendRoomChat('My VP counter is now '
                                     + (this.vpon ? 'on' : 'off')
                                     + ' because ' + this.whyLocked);
                    } else {
                        GS.sendRoomChat('My VP counter is locked to '
                                     + (this.vpon ? 'on' : 'off')
                                     + ', but I\'d like to turn it '
                                     + (this.vpon ? 'off' : 'on')
                                     + '. To allow, please say "#vpx"');
                    }
                }
                break;
            case '#vphelp':
                vpinfo.map(GS.showRoomChat);
                break;
            }
        },

        handleMyVPON: function () {
            this.players[this.myName].request = true;
            if (!this.isMultiplayer()) {
                this.vpon = true;
            } else if (this.locked && !this.vpon) {
                GS.showRoomChat('Your VP counter is locked to OFF because '
                              + this.whyLocked + '. Say "#vpx" to'
                              + ' ask your opponent to let you change it.');
            } else if (this.allWantOn()) {
                this.vpon = true;
                this.locked = true;
                this.whyLocked = 'all players said #vpon';
                GS.showRoomChat('The VP counter is now locked to ON because ' + this.whyLocked);
            } else {
                this.vpon = true;
                // Wait for auto-responses before sending explanation
                var that = this;
                setTimeout(function () {
                    if (that.reqcount() === 1 && !that.announced) {
                        GS.sendRoomChat('I\'d like to use a VP counter '
                               + '(See gokosalvager.com). '
                               + 'You can say "#vpoff" before Turn 5 to disallow '
                               + 'it, or "#vp?" to see the score in chat. Say '
                               + '"#vphelp" for more info.');
                    }
                }, 2000);
            }
        },

        handleMyVPOFF: function () {
            this.players[this.myName].request = false;
            if (!this.isMultiplayer()) {
                this.vpon = false;
            } else if (this.locked && this.vpon) {
                GS.showRoomChat('Sorry. Your VP counter is locked to ON because '
                              + this.whyLocked + '. Say "#vpx" to'
                              + ' ask your opponent to let you change it.');
            } else {
                if (this.vpon || !this.locked) {
                    this.whyLocked = this.myName + ' said #vpoff';
                    GS.showRoomChat('Your VP counter is now locked to OFF.');
                } else {
                    GS.showRoomChat('Your VP counter is already off.');
                }
                this.vpon = false;
                this.locked = true;
            }
        },

        onOppChat: function (speaker, text) {
            switch (text) {
            case '#vpon':
                this.handleOppVPON(speaker);
                break;
            case '#vpoff':
                this.handleOppVPOFF(speaker);
                break;
            case '#vp?':
                if (this.vpon) {
                    GS.sendScores();
                } else {
                    GS.sendRoomChat('Cannot show scores. My VP counter is off.');
                }
                break;
            case '#vpx':
                this.players[speaker].wantsChange = true;
                if (this.allWantChange()) {
                    this.vpon = !this.vpon;
                    _.values(this.players).map(function (p) {
                        p.wantsChange = false;
                    });
                    this.whyLocked = 'all players said #vpx';
                    GS.sendRoomChat('My VP counter is now '
                                 + (this.vpon ? 'on' : 'off')
                                 + ' because ' + this.whyLocked);
                }
                break;
            case '#vphelp':
                vpinfo.map(GS.sendRoomChat);
                break;
            }
        },

        handleOppVPON: function (speaker) {
            this.players[speaker].request = true;
            if (this.locked && !this.vpon) {
                GS.sendRoomChat('Sorry. My VP counter is locked to OFF '
                              + 'because ' + this.whyLocked + '. ');
            } else {
                this.vpon = true;
                if (this.allWantOn() && !this.locked) {
                    this.locked = true;
                    this.whyLocked = 'all players said #vpon';
                    GS.showRoomChat('The VP counter is now locked to ON because ' + this.whyLocked);
                }
                if (this.players[this.myName].request === null
                        && !this.locked
                        && !this.alreadyResponded) {
                    // Only respond if we have something new to say
                    if (this.always_request || (this.vpon && this.locked)) {
                        this.vpon = true;
                        GS.sendRoomChat('#vpon');
                        this.alreadyResponded = true;
                    } else if (this.always_refuse) {
                        GS.sendRoomChat('#vpoff');
                        this.alreadyResponded = true;
                    }
                }
            }
        },

        handleOppVPOFF: function (speaker) {
            this.players[speaker].request = false;
            if (this.locked && this.vpon) {
                GS.sendRoomChat('Sorry. My VP counter is locked to ON '
                              + 'because ' + this.whyLocked + '. ');
            } else {
                if (this.vpon || !this.locked) {
                    GS.sendRoomChat('Ok, my VP counter is off and locked.');
                    this.whyLocked = speaker + ' said #vpoff';
                } else {
                    GS.sendRoomChat('My VP counter is already off and locked.');
                }
                this.vpon = false;
                this.locked = true;
            }
        },

        onTurn: function (playerName, turnNumber) {

            // Announce VP counter at the start of our Turn 2.
            if (turnNumber === 2 && playerName === this.myName
                    && this.isMultiplayer() && this.reqcount() === 0) {
                if (this.always_request && !this.locked) {
                    GS.sendRoomChat('#vpon');
                } else if (this.vpon && this.locked) {
                    this.announced = true;
                    GS.sendRoomChat('I am using a VP counter (gokosalvager.com). '
                                  + 'Say #vp? to see the score in chat or '
                                  + '#vphelp for more info.');
                    GS.sendRoomChat('#vpon');
                }
            }

            // Lock on Turn 5
            if (turnNumber === 5 && this.beforeT5) {
                if (!this.locked && this.isMultiplayer()) {
                    this.locked = true;
                    this.whyLocked = 'it is after Turn 5';
                }
                this.beforeT5 = false;
            }
        },

        isChatCommand: function (chat) {
            switch (chat) {
            case '#vpon':
            case '#vpoff':
            case '#vp?':
            case '#vpx':
            case '#vphelp':
                return true;
            default:
                return false;
            }
        },

        handleChatCommand: function (chat) {
            switch (chat) {
            case '#vpon':
            case '#vpoff':
            case '#vp?':
            case '#vpx':
                GS.sendRoomChat(chat, true);
                break;
            case '#vphelp':
                vpinfo.map(GS.showRoomChat);
                break;
            default:
                throw 'Unreachable condition';
            }
        }
    };

    // Initial blank value -- to not confuse angularjs before any game starts
    GS.vp.toggle = new GS.VPToggle(false, false, 'My Table', '', [], []);

    GS.modules.vptoggle = new GS.Module('VP Toggle');
    GS.modules.vptoggle.dependencies = [
        'DominionClient',
        'mtgRoom.conn',
        '#vptable'
    ];
    GS.modules.vptoggle.load = function () {

        var onGameSetup, onRoomChat, onAddLog, checkGameOver;

        // Update each player's VP total and tell angular to redraw
        var updateTable = function () {
            _.values(GS.vp.toggle.players).map(function (p) {
                p.vps = GS.vp.getVPTotal(p.pname);
            });
            $('#vptable').scope().$digest();
            GS.resizeSidebar();
        };

        onGameSetup = function (gameData, domClient) {
            GS.vp.toggle = new GS.VPToggle(
                GS.get_option('vp_request'),
                GS.get_option('vp_refuse'),
                GS.getTableName(),
                GS.getMyName(),
                _.pluck(gameData.playerInfos, 'name'),
                gameData.playerInfos.map(function (pinfo) {
                    return pinfo.hasOwnProperty('bot') && pinfo.bot;
                })
            );
            GS.vp.toggle.init();
            updateTable();
        };

        onAddLog = function (data) {
            if (typeof data.text === 'undefined') { return; }

            var m = data.text.match(/^-+ (.*): turn ([0-9]*)/);
            if (m !== null) {
                var pname = m[1];
                var turnNumber = parseInt(m[2], 10);
                GS.vp.toggle.onTurn(pname, turnNumber);
            }
            updateTable();
        };

        onRoomChat = function (data) {
            var speaker = mtgRoom.playerList
                                 .findByAddress(data.data.playerAddress)
                                 .get('playerName');
            if (speaker === GS.getMyName()) {
                GS.vp.toggle.onMyChat(data.data.text);
            } else {
                GS.vp.toggle.onOppChat(speaker, data.data.text);
            }
            updateTable();
        };

        // Listen to VP toggle events in room chat and when the game starts
        mtgRoom.conn.bind('roomChat', onRoomChat);
        mtgRoom.conn.bind('gameServerHello', function (msg) {
            GS.getGameClient().bind('incomingMessage:gameSetup', onGameSetup);
            GS.getGameClient().bind('incomingMessage:addLog', onAddLog);
            GS.getGameClient().bind('incomingMessage', checkGameOver);
        });

        // Stop listening at the end of the game
        checkGameOver = function (msg) {
            if (msg !== 'gameOver') { return; }
            GS.getGameClient().unbind('incomingMessage:gameSetup', onGameSetup);
            GS.getGameClient().unbind('incomingMessage:addLog', onAddLog);
            GS.getGameClient().unbind('incomingMessage', checkGameOver);
            $('#vptable').scope().$digest();

            // Also clean up goko's leftovers
            GS.getGameClient().unbindAll('incomingMessage');
        };
    };
}());
