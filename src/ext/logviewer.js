/*jslint browser: true, devel: true, indent: 4, es5: true, vars: true, nomen: true, regexp: true, forin: true */
/*global jQuery, _, $, Audio */

var loadLogViewerModule;
(function () {
    "use strict";  // JSLint setting

    console.log('Preparing to load Log Viewer module');

    var exists = function (obj) {
        return (typeof obj !== 'undefined' && obj !== null);
    };

    // Wait (non-blocking) until the required objects have been instantiated
    var waitLoop = setInterval(function () {
        try {
            var gs = window.GokoSalvager;
            var gso = gs.get_option;
            var cdbc = window.FS.Dominion.CardBuilder.Data.cards;
            var lm = window.Dom.LogManager;
            var dw = window.Dom.DominionWindow;
            var dc = window.DominionClient;

            if ([gs, gso, cdbc, lm, dw, dc].every(exists)) {
                console.log('Loading Log Viewer module');
                loadLogViewerModule(gs, cdbc, lm, dw, dc);
                clearInterval(waitLoop);
            }
        } catch (e) {}
    }, 100);
}());

/*
 * Log viewer module
 */
var loadLogViewerModule = function (gs, cdbc, lm, dw, dc) {
    "use strict";   // JSLint setting

    var updateDeck, colorize, newLogRefresh, style, canonizeName, vp_div, vpLocked, vpOn;

    var newLog = document.createElement('div');
    newLog.setAttribute("class", "newlog");
    document.getElementById("goko-game").appendChild(newLog);

    var newLogText = '';
    var newLogMode = -1;
    var newLogPlayers = 0;
    var newLogNames = {};
    var newPhase = 'init';
    var newPrevPhase = 'init';
    var playerDecks = [];
    var vpchips = [];
    var playervp = [];
    var possessed;
    var newLogHide = true;

    dw.prototype._old_updateState = dw.prototype._updateState;
    dw.prototype._updateState = function (opt) {
        if (opt.dominionPhase) {
            newPhase = opt.dominionPhase;
        }
        this._old_updateState(opt);
    };

    lm.prototype.old_addLog = lm.prototype.addLog;
    lm.prototype.addLog = function (opt) {
        if (opt.logUrl) {
            opt.logUrl = 'http://dom.retrobox.eu/?' + opt.logUrl.substr(29);
        }
        if (opt.text) {
            var h = opt.text.match(/^-+ (.*) -+$/);
            if (h) {
                var j = h[1].match(/^(.*): turn (\d+)( \[possessed\])?$/);
                if (j) {
                    possessed = j[3] !== undefined;
                    newLogMode = newLogNames[j[1]];
                    if (parseInt(j[2], 10) > 4) {
                        // Stop VP tracker settings at start of turn 5
                        vpLocked = true;
                    }
                    newLogText += '<h1 class="p' + newLogMode + '">' + h[1] + '</h1>';
                } else {
                    if (h[1] === 'Game Setup') {
                        newLogText = '';
                        newLogMode = 0;
                        newLogPlayers = 0;
                        newLogNames = {};
                        playerDecks = [];
                        vpchips = [];
                        playervp = [];
                    } else {
                        newLogMode = -1;
                    }
                    newLogText += '<h1>' + h[1] + '</h1>';
                }
            } else {
                if (newLogMode === 0) {
                    h = opt.text.match(/^(.*) - (starting cards: .*)/);
                    if (h) {
                        newLogPlayers += 1;
                        newLogNames[h[1]] = newLogPlayers;
                        playerDecks[newLogNames[h[1]]] = {};
                        vpchips[newLogNames[h[1]]] = 0;
                        updateDeck(newLogNames[h[1]], h[2]);
                    }
                }
                if ((h = opt.text.match(/^(.*) - (([a-z]*).*)$/)) !== null) {
                    var indent = false;
                    if (newLogMode > 0) {
                        var initial = newPhase.substr(0, 1).toUpperCase();
                        indent = h[3] !== 'plays' && h[3] !== 'buys' && newPrevPhase === newPhase;
                        if (newPrevPhase === newPhase) {
                            initial = '&nbsp;';
                        }
                        newPrevPhase = newPhase;
                        newLogText += '<span class="phase ' + newPhase + 'Phase">' + initial + '</span> ';
                        updateDeck(newLogNames[h[1]], h[2]);
                    }
                    newLogText += indent ? '<span class="indent">' : '<span>';
                    if (newLogNames[h[1]] !== newLogMode) {
                        newLogText += '<span class="player p' + newLogNames[h[1]] + '">' + h[1] + '</span> ';
                    }
                    newLogText += colorize(h[2]) + '</span><br>';
                } else if (newLogMode === 0 && ((h = opt.text.match(/^(Supply cards:)(.*)/)) !== null)) {
                    newLogText += h[1] + colorize(h[2]) + '<br>';
                } else {
                    newLogText += opt.text + '<br>';
                }
            }
            newLogHide = false;
            newLogRefresh();
            var newLogContainer = document.getElementById("newlogcontainer");
            newLogContainer.scrollTop = newLogContainer.scrollHeight;
        }
        this.old_addLog(opt);
    };

    // Resize and reposition the log to match the new window size
    newLogRefresh = function () {
        var goko_game = document.getElementById("goko-game");
        var goko_canvas = document.getElementById("myCanvas");
        if (newLogHide || goko_game.style.display === 'none') {
            return;
        }
        goko_game.setAttribute("style", 'margin-left:' + Math.floor(-window.innerWidth / 2) + 'px !important');
        var goko_w = goko_canvas.offsetWidth;
        var goko_h = goko_canvas.offsetHeight;
        var w = window.innerWidth - goko_w;
        var t = goko_canvas.style.marginTop;
        newLog.setAttribute("style", "position:absolute; overflow:auto; left:" + goko_w + "px; width:" + w + "px; margin-top:" + t + "; height:" + goko_h + "px; background-color: white; z-index: -1");
        newLog.innerHTML = vp_div() + '<div id="newlogcontainer" style="overflow:auto;height:' + (goko_h - 200) + 'px;width:' + (w - 10) + 'px;padding:195px 5px 5px 5px">' + newLogText + "</div>";
    };

    window.addEventListener('resize', function () {
        setTimeout(newLogRefresh, 100);
    }, false);

    var singletypes = {
        action: 'rgb(240,240,240)',
        'action-attack': 'rgb(240,240,240)',
        treasure: 'rgb(253,225,100)',
        'action-reaction': 'rgb(64,168,227)',
        'action-duration': 'rgb(254,143,78)',
        victory: 'rgb(146,193,125)',
        curse: 'rgb(215,138,219)',
        'action-ruins': 'rgb(150,104,51)',
        shelter: 'rgb(230,108,104)'
    };
    var i;
    for (i in singletypes) {
        style += i + "{ background-color:" + singletypes[i] + "; border-radius: 4px; padding: 0px 3px;}";
    }

    var doubletypes = {
        'treasure-victory': 'rgb(253,225,100), rgb(146,193,125)',
        'treasure-reaction': 'rgb(253,225,100), rgb(64,168,227)',
        'victory-reaction': 'rgb(146,193,125), rgb(64,168,227)',
        'shelter-reaction': 'rgb(230,108,104), rgb(64,168,227)',
        'action-shelter': 'rgb(240,240,240), rgb(230,108,104)',
        'shelter-victory': 'rgb(230,108,104), rgb(146,193,125)',
        'action-victory': 'rgb(240,240,240), rgb(146,193,125)',
    };

    for (i in doubletypes) {
        style += i + "\
        { background: -moz-linear-gradient(top, " + doubletypes[i] + ");\
            background: -webkit-linear-gradient(top, " + doubletypes[i] + ");\
                background: -o-linear-gradient(top, " + doubletypes[i] + ");\
                background: -ms-linear-gradient(top, " + doubletypes[i] + ");\
                background: linear-gradient(top, " + doubletypes[i] + ");\
                border-radius: 6px; padding: 0px 3px;\
        }";
    }

    var types = {};
    cdbc.map(function (card) {
        types[card.name[0]] = card.type;
    });

    var fixnames = { 'JackOfAllTrades': 'Jack of All Trades' };
    function fixname(n) { return fixnames[n] || n; }

    var cards = Object.keys(types);
    var reg = new RegExp(cards.sort(function (a, b) {
        return b.length - a.length;
    }).join('|'), 'g');
    colorize = function (x) {
        return x.replace(reg, function (m) {
            var t = types[m];
            return "<" + t + ">" + fixname(m) + "</" + t + ">";
        });
    };

    var vpoint = {
        'Estate': function () {return 1; },
        'Colony': function () {return 10; },
        'Duchy': function () {return 3; },
        'Duke': function (d) {return d.Duchy || 0; },
        'Fairgrounds': function (d) {
            var c, s = 0;
            for (c in d) {
                s += 1;
            }
            return 2 * Math.floor(s / 5);
        },
        'Farmland': function () {return 2; },
        'Feodum': function (d) {return Math.floor((d.Silver || 0) / 3); },
        'Gardens': function (d) {
            var c, s = 0;
            for (c in d) {
                s += d[c];
            }
            return Math.floor(s / 10);
        },
        'Province': function () {return 6; },
        'Silk Road': function (d) {
            var c, s = 0;
            for (c in d) {
                if (types[c].match(/victory/)) {
                    s += d[c];
                }
            }
            return Math.floor(s / 4);
        },
        'Vineyard': function (d) {
            var c, s = 0;
            for (c in d) {
                if (types[c].match(/\baction/)) {
                    s += d[c];
                }
            }
            return Math.floor(s / 3);
        },
        //'Overgrown Estate': function () {return 0},
        'Dame Josephine': function () {return 2; },
        'Great Hall': function () {return 1; },
        'Nobles': function () {return 2; },
        'Island': function () {return 2; },
        'Harem': function () {return 2; },
        'Tunnel': function () {return 2; },
        'Curse': function () {return -1; },
    };

    function vp_in_deck(deck) {
        var card, points = 0;
        for (card in deck) {
            if (vpoint[card]) {
                points += deck[card] * vpoint[card](deck);
            }
        }
        return points;
    }

    function updateCards(player, cards, v) {
        var i;
        for (i = 0; i < cards.length; i += 1) {
            playerDecks[player][cards[i]] = playerDecks[player][cards[i]] ?
                    playerDecks[player][cards[i]] + v : v;
            if (playerDecks[player][cards[i]] <= 0) {
                delete playerDecks[player][cards[i]];
            }
        }
        playervp[player] = vpchips[player] + vp_in_deck(playerDecks[player]);
    }
    updateDeck = function (player, action) {
        var h;
        if ((h = action.match(/^returns (.*) to the Supply$/)) !== null) {
            updateCards(player, [h[1]], -1);
        } else if ((h = action.match(/^gains (.*)/)) !== null) {
            updateCards(player, [h[1]], 1);
        } else if ((h = action.match(/^trashes (.*)/)) !== null) {
            if (possessed && player === newLogMode) {
                return;
            }
            updateCards(player, h[1].split(', ').filter(function (c) {
                return c !== "Fortress";
            }), -1);
        } else if ((h = action.match(/^starting cards: (.*)/)) !== null) {
            updateCards(player, h[1].split(', '), 1);
            /* live log does not have passed card names
               } else if (h = action.match(/^passes (.*)/)) {
               updateCards(player, [h[1]], -1);
               updateCards(player === newLogPlayers ? 1 : player + 1, [h[1]], 1);
               */
        } else if ((h = action.match(/^receives ([0-9]*) victory point chips$/)) !== null) {
            vpchips[player] += parseInt(h[1], 10);
            updateCards(player, []);
        } else if ((h = action.match(/^plays Bishop$/)) !== null) {
            vpchips[player] += 1;
            updateCards(player, []);
        } else if ((h = action.match(/^plays (Spoils|Madman)$/)) !== null) {
            updateCards(player, [h[1]], -1);
        }
    };

    var updateDeckMasq = function (src_player, dst_player, card) {
        if (!card || !src_player || !dst_player) {
            return;
        }
        console.log('passed: ' + card + ' from ' + src_player + ' to ' + dst_player);
        updateCards(src_player, [card], -1);
        updateCards(dst_player, [card], 1);
    };

    canonizeName = function (n) {
        return n.toLowerCase().replace(/\W+/g, '');
    };

    function decodeCard(name) {
        var i;
        var n = name.toLowerCase().replace(/\.\d+$/, '');
        for (i in types) {
            if (canonizeName(i) === n) {
                return i;
            }
        }
        return undefined;
    }

    vpOn = false;
    vpLocked = false;
    vp_div = function () {
        if (!vpOn) {
            return '';
        }
        var ret = '<div style="position:absolute;padding:2px;background-color:gray"><table>';
        var p = Object.keys(newLogNames);
        p.sort(function (a, b) {
            var pa = newLogNames[a];
            var pb = newLogNames[b];
            if (playervp[pa] !== playervp[pb]) {
                return playervp[pb] - playervp[pa];
            }
            return pb - pa;
        });
        var i;
        for (i = 0; i < p.length; i += 1) {
            var pn = newLogNames[p[i]];
            ret += '<tr class="p' + pn + '"><td>' + p[i] + '</td><td>' + playervp[pn] + '</td></tr>';
        }
        ret += '</table></div>';
        return ret;
    };

    dw.prototype._old_moveCards = dw.prototype._moveCards;
    dw.prototype._moveCards = function (options, callback) {
        var m = options.moves;
        try {
            for (i = 0; i < m.length; i += 1) {
                if (m[i].source.area.name === 'reveal'
                        && m[i].destination.area.name === 'hand'
                        && m[i].source.area.playerIndex !== m[i].destination.area.playerIndex) {
                    updateDeckMasq(m[i].source.area.playerIndex + 1, m[i].destination.area.playerIndex + 1,
                                    decodeCard(m[i].sourceCard));
                }
            }
        } catch (e) { console.log('exception: ' + e); }
        this._old_moveCards(options, callback);
    };

    function vp_txt() {
        var i, ret = [];
        var p = Object.keys(newLogNames);
        for (i = 0; i < p.length; i += 1) {
            ret.push(p[i] + ': ' + playervp[newLogNames[p[i]]]);
        }
        return ret.sort().join(', ');
    }

    var old_onIncomingMessage = dc.prototype.onIncomingMessage;
    dc.prototype.onIncomingMessage = function (messageName, messageData, message) {
        var msgSend = "", sendVpOn = false, sendVpOff = false, tablename = "";

        try {

            if (this.table.get("settings")) {
                tablename = JSON.parse(this.table.get("settings")).name;
            }

            if (messageName === 'RoomChat') {
                console.log(messageData.text);

                if (messageData.text === "Dominion Online User Extension enabled (see goo.gl/4muRB)\nType \"#vpon\" before turn 5 to turn on point tracker.\nType \"#vpoff\" before turn 5 to disallow the point tracker.\n"
                        && gs.get_option('vp_always_off')
                        && tablename.toUpperCase().indexOf("#VPON") === -1) {
                    sendVpOff = true;
                }

                if (gs.get_option('vp_enabled') && messageData.text.toUpperCase() === '#VPOFF' && (vpOn || vpLocked)) {
                    if (vpLocked) {
                        msgSend += 'Victory Point tracker setting locked\n';
                    } else {
                        msgSend += 'Victory Point tracker disallowed\n';
                        vpOn = false;
                        vpLocked = true;
                    }
                } else if (gs.get_option('vp_enabled') && messageData.text.toUpperCase() === '#VPON' && !vpOn) {
                    if (vpLocked) {
                        msgSend += 'Victory Point tracker setting locked\n';
                    } else {
                        msgSend += 'Victory Point tracker enabled (see http://dom.retrobox.eu/vp.html)\n';
                        msgSend += 'Type "#vp?" at any time to display the score in the chat\n';
                        msgSend += 'Type "#vpoff" before turn 5 to disallow the point tracker.\n';
                        vpOn = true;
                    }
                } else if (gs.get_option('vp_enabled') && messageData.text.toUpperCase() === '#VP?' && vpOn) {
                    msgSend += 'Current points: ' + vp_txt() + '\n';
                }
            } else if (messageName === 'gameEvent2' && messageData.code === 'system.startGame') {
                vpOn = false;
                vpLocked = false;
                if (tablename) {
                    tablename = tablename.toUpperCase();
                    msgSend += 'Dominion Online User Extension enabled (see goo.gl/4muRB)\n';
                    if (gs.get_option('vp_enabled') && tablename.indexOf("#VPON") !== -1) {
                        msgSend += 'Victory Point tracker enabled and locked (see http://dom.retrobox.eu/vp.html)\n';
                        msgSend += 'Type "#vp?" at any time to display the score in the chat\n';

                        vpOn = true;
                        vpLocked = true;
                    } else if (gs.get_option('vp_enabled') && tablename.indexOf("#VPOFF") !== -1) {
                        msgSend += 'Victory Point tracker disallowed and locked (see http://dom.retrobox.eu/vp.html)\n';

                        vpOn = false;
                        vpLocked = true;
                    } else if (gs.get_option('vp_enabled') && gs.get_option('vp_always_on')) {
                        sendVpOn = true;
                    } else if (gs.get_option('vp_enabled')) {
                        msgSend += 'Type "#vpon" before turn 5 to turn on point tracker.\n';
                        msgSend += 'Type "#vpoff" before turn 5 to disallow the point tracker.\n';
                    }
                }
            } else if (messageName === 'addLog' && messageData.text === 'Rating system: adventure' && gs.get_option('adventurevp')) {
                vpOn = true;
            }
        } catch (e) {
            console.log('exception :' + e);
        }

        if (msgSend.length > 0) {
            this.clientConnection.send('sendChat', {text: msgSend});
        }

        if (sendVpOn) {
            this.clientConnection.send('sendChat', {text: "#vpon"});
        } else if (sendVpOff) {
            this.clientConnection.send('sendChat', {text: "#vpoff"});
        }

        old_onIncomingMessage.call(this, messageName, messageData, message);
    };
};
