/*jslint browser: true, devel: true, indent: 4, maxlen: 80, es5: true, vars:true */
/*global jQuery, $, WebSocket, Audio */

var loadAutomatchModule;

(function () {
    "use strict";

    console.log('Preparing to load Automatch module');

    var exists = function (obj) {
        return (typeof obj !== 'undefined' && obj !== null);
    };

    // Wait (non-blocking) until the required objects have been instantiated
    var dbWait = setInterval(function () {
        var gs, gso, conn;

        try {
            gs = window.GokoSalvager;
            gso = gs.get_option;
            conn = window.FS.Connection;
        } catch (e) {}

        if ([gso, conn].every(exists)) {
            console.log('Loading Automatch module');
            loadAutomatchModule(gs, conn);
            clearInterval(dbWait);
        }
    }, 100);
}());

// To be executed in Goko's namespace
loadAutomatchModule = function (gs, conn) {
    "use strict";   // JSLint mode

    var AM, debug, initAutomatch, automatchInitStarted, addAutomatchButton,
        fetchOwnRatings, updateAMButton, createTable,
        fetchOwnSets, handleDisconnect,
        connectToAutomatchServer, confirmReceipt, confirmSeek, offerMatch,
        rescindOffer, announceGame, unannounceGame, joinAutomatchGame,
        createAutomatchGame, enableButtonWhenAutomatchReady,
        handleLostAutomatchConnection,
        enableAutoAccept,
        disableAutoAccept,
        gameReady,
        attemptAutomatchInit, testPop;

    // Automatch global namespace
    AM = window.AM = (window.AM || {});

    // Configuration
    AM.log_debugging_messages = false;
    AM.log_server_messages = false;
    AM.wsMaxFails = 100;

    if (location.protocol === 'http:') {
        AM.server_url = 'ws://andrewiannaccone.com/automatch';
    } else if (location.protocol === 'https:') {
        AM.server_url = 'wss://andrewiannaccone.com/automatch';
    } else {
        alert(location.protocol);
        console.error('Unexpected protocol: ' + location.protocol);
    }

    // Initial state
    automatchInitStarted = false;
    AM.wsFailCount = 0;
    AM.state = {seek: null, offer: null, game: null};

    // Goko constants
    AM.ENTER_LOBBY = "gatewayConnect";              // Fired on lobby enter
    AM.GAME_START = "gameServerHello";              // Fired on game start
    AM.TABLE_STATE = "tableState";                  // Fired on table changes
    AM.CASUAL_SYS_ID = '4fd6356ce0f90b12ebb0ff3a';  // Goko casual rating system
    AM.PRO_SYS_ID = '501726b67af16c2af2fc9c54';     // Goko pro rating system

    // Intercept Goko server event notifications:
    conn.prototype.trigger_orig = conn.prototype.trigger;
    conn.prototype.trigger = function () {

        // Initialize automatch if possible
        if (!automatchInitStarted) { attemptAutomatchInit(); }

        // Optionally log the server event
        if (AM.log_server_messages) { console.log(arguments); }

        // Let Goko handle the event normally
        this.trigger_orig.apply(this, arguments);
    };

    // Check for the necessary Goko helpers before initializing Automatch
    attemptAutomatchInit = function () {
        var mtgRoom;
        if (typeof (mtgRoom = window.mtgRoom) !== 'undefined'
                && typeof mtgRoom.conn !== 'undefined'
                && typeof mtgRoom.getHelper('ZoneClassicHelper') !== 'undefined'
                && $('.room-section-btn-find-table').length === 1
                && $('.room-section-header-buttons').length === 1) {

            // Everything's ready
            automatchInitStarted = true;
            initAutomatch(mtgRoom, mtgRoom.conn,
                          mtgRoom.getHelper('ZoneClassicHelper'));
        }
    };

    initAutomatch = function (mtgRoom, gokoconn, zch) {
        debug('Initializing Automatch');

        // Goko helper objects
        AM.mtgRoom = mtgRoom;
        AM.gokoconn = gokoconn;
        AM.zch = zch;

        // Goko player info. Ratings and sets owned via asynchronous query.
        AM.player = {pname: AM.gokoconn.connInfo.playerName,
                     pid: AM.gokoconn.connInfo.playerId,
                     kind: AM.gokoconn.connInfo.kind,
                     rating: {},
                     sets_owned: null};
        fetchOwnRatings(updateAMButton);
        fetchOwnSets(updateAMButton);

        // Asynchronously connect to automatch server via WebSocket
        connectToAutomatchServer();

        // Create automatch popup dialogs
        AM.appendSeekPopup($('#viewport'));
        AM.appendOfferPopup($('#viewport'));
        AM.appendGamePopup($('#viewport'));

        // Replace the "Play Now" button with an Automatch button
        $('.room-section-btn-find-table').remove();
        $('.room-section-header-buttons').append(
            $('<button id="automatchButton" />')
                .addClass('fs-mtrm-text-border')
                .addClass('fs-mtrm-dominion-btn')
                .click(AM.showSeekPop)
        );

        // Disable the butomatch button until the async init calls finish
        updateAMButton();

        // Notify automatch when the player starts a game
        AM.gokoconn.bind(AM.GAME_START, AM.gameStarted);

        // Refresh player's rating info after games
        // TODO: no need to refresh on room changes.
        AM.gokoconn.bind(AM.ENTER_LOBBY, function () {
            fetchOwnRatings(updateAMButton);
        });
    };

    // Asynchronously request Goko casual and pro ratings
    fetchOwnRatings = function (frCallback) {
        AM.player.rating = {};

        if (AM.player.kind === 'guest') {
            // TODO: look up guest ratings correctly
            AM.player.rating.goko_casual_rating = 1000;
            AM.player.rating.goko_pro_rating = 1000;
            if (typeof frCallback !== undefined) {
                frCallback();
            }

        } else {
            // Asynchronously get casual rating
            AM.gokoconn.getRating({
                playerId: AM.player.pid,
                ratingSystemId: AM.CASUAL_SYS_ID
            }, function (resp) {
                AM.player.rating.goko_casual_rating = resp.data.rating;
                if (typeof frCallback !== undefined) {
                    frCallback();
                }
            });

            // Asynchronously get pro rating
            AM.gokoconn.getRating({
                playerId: AM.player.pid,
                ratingSystemId: AM.PRO_SYS_ID
            }, function (resp) {
                AM.player.rating.goko_pro_rating = resp.data.rating;
                if (typeof frCallback !== undefined) {
                    frCallback();
                }
            });

            // TODO: get Isotropish rating
        }
    };

    // Asynchronously request which card sets we own
    fetchOwnSets = function (fsCallback) {
        if (AM.player.kind === "guest") {
            // Guests only have Base. No need to check.
            AM.player.sets_owned = ['Base'];
            if (typeof fsCallback !== undefined) {
                fsCallback();
            }
        } else {
            var cardsToSets = {
                Cellar: 'Base',
                Coppersmith: 'Intrigue 1',
                Baron: 'Intrigue 2',
                Ambassador: 'Seaside 1',
                Explorer: 'Seaside 2',
                Apothecary: 'Alchemy',
                Hamlet: 'Cornucopia',
                Bishop: 'Prosperity 1',
                Mint: 'Prosperity 2',
                Baker: 'Guilds',
                Duchess: 'Hinterlands 1',
                Oasis: 'Hinterlands 2',
                Altar: 'Dark Ages 1',
                Beggar: 'Dark Ages 2',
                Counterfeit: 'Dark Ages 3'
            };

            // Get all Goko items I own, filter for cards only, and then
            // translate from cards to sets
            AM.gokoconn.getInventoryList({}, function (r) {
                var myInv = r.data.inventoryList.filter(function (x) {
                    return x.name === "Personal";
                })[0];
                AM.gokoconn.getInventory({
                    inventoryId: myInv.inventoryId,
                    tagFilter: "Dominion Card"
                }, function (r) {
                    AM.gokoconn.getObjects2({
                        objectIds: r.data.objectIds
                    }, function (r) {
                        var setsOwned = [];
                        r.data.objectList.map(function (c) {
                            var set = cardsToSets[c.name];
                            if (set && setsOwned.indexOf(set) < 0) {
                                setsOwned.push(set);
                            }
                        });
                        AM.player.sets_owned = setsOwned;
                        if (typeof fsCallback !== undefined) {
                            fsCallback();
                        }
                    });
                });
            });
        }
    };

    connectToAutomatchServer = function () {
        debug('Connecting to Automatch server at ' + AM.server_url);

        AM.ws = new WebSocket(AM.server_url + '?pname=' + AM.player.pname);
        AM.ws.lastMessageTime = new Date();

        AM.ws.onopen = function () {
            debug('Connected to Automatch server.');
            AM.wsFailCount = 0;
            updateAMButton();

            // Ping AM server every 5 sec. Timeout if no messages (including
            // pingbacks) received for 30 sec.
            if (typeof AM.pingLoop !== 'undefined') {
                clearInterval(AM.pingLoop);
            }
            AM.pingLoop = setInterval(function () {
                debug('Running ping loop');
                if (new Date() - AM.ws.lastMessageTime > 30000) {
                    debug('Automatch server timed out.');
                    clearInterval(AM.pingLoop);
                    handleDisconnect();
                } else {
                    debug('Sending ping');
                    AM.ping();
                }
            }, 5000);
        };

        AM.ws.onclose = function () {
            debug('Automatch server closed websocket.');
            handleDisconnect();
        };

        // Messages from server
        AM.ws.onmessage = function (evt) {
            var msg = JSON.parse(evt.data);
            debug('Got ' + msg.msgtype + ' message from Automatch server:');
            debug(msg.message);

            AM.ws.lastMessageTime = new Date();

            switch (msg.msgtype) {
            case 'CONFIRM_RECEIPT':
                confirmReceipt(msg.message);
                break;
            case 'CONFIRM_SEEK':
                confirmSeek(msg.message);
                break;
            case 'OFFER_MATCH':
                offerMatch(msg.message);
                break;
            case 'RESCIND_OFFER':
                rescindOffer(msg.message);
                break;
            case 'ANNOUNCE_GAME':
                announceGame(msg.message);
                break;
            case 'GAME_READY':
                gameReady(msg.message);
                break;
            case 'UNANNOUNCE_GAME':
                unannounceGame(msg.message);
                break;
            default:
                throw 'Received unknown message type: ' + msg.msgtype;
            }
        };

        // Convenience wrapper for websocket send() method
        AM.ws.sendMessage = function (msgtype, msg, smCallback) {
            var msgid, msgObj, msgStr;

            msgid = AM.player.pname + Date.now();
            msgObj = {msgtype: msgtype,
                      message: msg,
                      msgid: msgid};
            msgStr = JSON.stringify(msgObj);

            AM.ws.callbacks[msgid] = smCallback;
            AM.ws.send(msgStr);

            debug('Sent ' + msgtype + ' message to Automatch server:');
            debug(msgObj);
        };

        // Callbacks to be run when server confirms msgid received
        AM.ws.callbacks = {};
    };

    updateAMButton = function () {
        var connected, gotPlayerInfo, ready, buttonText;

        if (!AM.player.hasOwnProperty('sets_owned')
                || !AM.player.rating.hasOwnProperty('goko_casual_rating')
                || !AM.player.rating.hasOwnProperty('goko_pro_rating')) {
            ready = false;
            buttonText = 'Getting player info';
        } else if (typeof AM.ws === 'undefined') {
            ready = false;
            buttonText = 'Connecting Automatch...';
        } else if (AM.ws.readyState === WebSocket.CONNECTING) {
            ready = false;
            buttonText = 'Connecting Automatch...';
        } else if (AM.ws.readyState === WebSocket.CLOSED
                || AM.ws.readyState === WebSocket.CLOSING) {
            ready = false;
            buttonText = 'Lost Automatch connection';
        } else if (AM.ws.readyState === WebSocket.OPEN) {
            ready = true;
            buttonText = 'Automatch';
        }
        $('#automatchButton').prop('disabled', !ready)
                             .html(buttonText);
    };

    handleDisconnect = function () {
        // Update state
        AM.state = {seek: null, offer: null, game: null};
        AM.wsFailCount += 1;

        debug('Automatch failed: ' + AM.wsFailCount + '/' + AM.wsMaxFails);

        // Update UI
        AM.showSeekPop(false);
        AM.showOfferPop(false);
        AM.showGamePop(false);
        updateAMButton();

        // Stop trying to ping
        if (typeof AM.pingLoop !== 'undefined') {
            clearInterval(AM.pingLoop);
        }

        // Wait 5 seconds and attempt reconnect.
        if (AM.wsFailCount < AM.wsMaxFails) {
            setTimeout(function () {
                connectToAutomatchServer();
                updateAMButton();
            }, 5000);
        } else {
            debug('Too many Automatch failures. Giving up');
        }
    };

    /*
     * Handle messages from the Automatch server
     */

    // Invoke the callback registered to this message's id, if any.
    confirmReceipt = function (msg) {
        debug('Receipt of message confirmed: ' + msg.msgid);
        var crCallback = AM.ws.callbacks[msg.msgid];
        if (typeof crCallback !== 'undefined' && crCallback !== null) {
            debug(crCallback);
            crCallback();
        }
    };

    confirmSeek = function (msg) {
        AM.state.seek = msg.seek;
    };

    offerMatch = function (msg) {
        AM.state.seek = null;
        AM.state.offer = msg.offer;
        AM.showOfferPop(true);
        new Audio('sounds/startTurn.ogg').play();
    };

    rescindOffer = function (msg) {
        AM.state.offer = null;
        // TODO: handle this in a more UI-consistent way
        AM.showOfferPop(false);
        alert('Automatch offer was rescinded:\n' + msg.reason);
    };

    announceGame = function (msg) {
        AM.state.offer = null;
        AM.state.game = msg.game;
        AM.state.game.roomid = AM.mtgRoom.roomList
            .where({name: AM.state.game.roomname})[0].get('roomId');

        // Show game announcement dialog
        AM.showOfferPop(false);
        AM.showGamePop(true);

        // Host goes to room, creates game, notifies server
        if (AM.state.game.hostname === AM.player.pname) {
            var hostGame = function () {
                AM.gokoconn.unbind(AM.ENTER_LOBBY, hostGame);
                createAutomatchGame(function (tableindex) {
                    AM.state.game.tableindex = tableindex;
                    AM.gameCreated();
                });
            };
            AM.gokoconn.bind(AM.ENTER_LOBBY, hostGame);
            AM.zch.changeRoom(AM.state.game.roomid);
        }
    };

    gameReady = function (msg) {
        AM.state.offer = null;
        AM.state.game = msg.game;

        // Guests go to room and join host's game
        if (AM.state.game.hostname !== AM.player.pname) {
            var joinGame = function () {
                AM.gokoconn.unbind(AM.ENTER_LOBBY, joinGame);
                var table, seatindex, joinOpts;
                table = AM.mtgRoom.roomList
                    .where({roomId: AM.mtgRoom.currentRoomId})[0]
                    .get('tableList')
                    .where({number: AM.state.game.tableindex})[0];
                seatindex = AM.state.game.seeks.map(function (seek) {
                    return seek.player.pname;
                }).filter(function (pname) {
                    return pname !== AM.state.game.hostname;
                }).indexOf(AM.player.pname) + 1;

                joinOpts = {table: AM.state.game.tableindex,
                            seat: seatindex};
                debug('Joining table:');
                debug(joinOpts);
                AM.gokoconn.joinAndSit(joinOpts, function () {
                    joinOpts.ready = true;
                    AM.gokoconn.setReady(joinOpts);
                });
                debug('Joined game. Automatch finished.');
                AM.showGamePop(false);
            };
            AM.gokoconn.bind(AM.ENTER_LOBBY, joinGame);
            AM.zch.changeRoom(AM.state.game.roomid);
        }
    };

    // TODO: deal with possibility that unannounce arrives before announce
    unannounceGame = function (msg) {
        AM.state.game = null;
        AM.showGamePop(false);
        alert('Automatch game canceled. Reason:\n' + msg.reason);
    };

    /*
     * Handle messages to the automatch server
     */

    AM.ping = function () {
        AM.ws.sendMessage('PING', {});
    };

    AM.submitSeek = function (seek) {
        AM.state.seek = seek;
        AM.ws.sendMessage('SUBMIT_SEEK', {seek: AM.state.seek});
    };

    AM.cancelSeek = function (seek) {
        if (AM.state.seek !== null) {
            AM.state.seek.canceling = true;
            AM.ws.sendMessage('CANCEL_SEEK', {seekid: AM.state.seek.seekid},
                function () { AM.state.seek = null; });
        }
    };

    AM.acceptOffer = function (aoCallback) {
        var msg = {matchid: AM.state.offer.matchid};
        AM.ws.sendMessage('ACCEPT_OFFER', msg, aoCallback);
    };

    AM.unacceptOffer = function () {
        var msg = {matchid: AM.state.offer.matchid};
        AM.ws.sendMessage('UNACCEPT_OFFER', msg, function () {
            AM.state.offer = null;
        });
    };

    AM.declineOffer = function () {
        var msg = {matchid: AM.state.offer.matchid};
        AM.ws.sendMessage('DECLINE_OFFER', msg, function () {
            AM.state.offer = null;
        });
    };

    AM.gameCreated = function () {
        var msg = {game: AM.state.game};
        AM.ws.sendMessage('GAME_CREATED', msg);
    };

    AM.gameStarted = function () {
        var msg = {matchid: null};
        if (AM.state.game !== null) {
            msg = {matchid: AM.state.game.matchid};
        }
        AM.ws.sendMessage('GAME_STARTED', msg);
        AM.state = {seek: null, offer: null, game: null};
    };

    AM.abortGame = function () {
        if (AM.state.game.hasOwnProperty('matchid')) {
            AM.ws.sendMessage('CANCEL_GAME', {matchid: AM.state.game.matchid});
        }
    };

    /*
     * Automated hosting/joining using the Goko FS framework
     */

    createAutomatchGame = function (callback) {
        var oppnames, ratingSystem, listenJoin, listenCreate;

        oppnames = AM.state.game.seeks.map(function (seek) {
            return seek.player.pname;
        }).filter(function (pname) {
            return pname !== AM.player.pname;
        });
        ratingSystem = AM.state.game.rating_system;

        // Handle join requests automatically
        enableAutoAccept(oppnames);

        // !!! Hideous code follows !!!
        // TODO: clean up the flow of execution
        // TODO: do we really have to bind to all table changes in the room?

        // 3. Wait for all opponents to join
        listenJoin = function () {
            var tableModel = AM.zch.currentTable;
            if (tableModel !== null &&
                    tableModel.get('joined').length === oppnames.length + 1) {

                // Notify user when all opponents have joined
                AM.gokoconn.unbind(AM.TABLE_STATE, listenJoin);
                debug('All opponents have joined. Automatch complete.');
                disableAutoAccept();
                AM.showGamePop(false);
            }
        };

        // 2. Notify Automatch server; listen for joins
        listenCreate = function () {
            var tableModel = AM.zch.currentTable;
            if (tableModel !== null) {
                AM.gokoconn.unbind(AM.TABLE_STATE, listenCreate);
                AM.gokoconn.bind(AM.TABLE_STATE, listenJoin);
                callback(tableModel.get('number'));
            }
        };

        // 1. Create a new game table; listen for its creation
        AM.gokoconn.bind(AM.TABLE_STATE, listenCreate);
        createTable(oppnames, ratingSystem);
    };

    disableAutoAccept = function () {
        var reqView = AM.mtgRoom.views.ClassicRoomsPermit;
        if (typeof reqView.showByRequest_orig !== 'undefined') {
            reqView.showByRequest = reqView.showByRequest_orig;
        }
    };

    enableAutoAccept = function (oppnames) {
        var reqView = AM.mtgRoom.views.ClassicRoomsPermit;
        reqView.showByRequest_orig = reqView.showByRequest;
        reqView.showByRequest = function (request) {
            var joinerName, opts, isAutomatchOpp;

            joinerName = AM.mtgRoom.playerList
                        .findByAddress(request.data.playerAddress)
                        .get('playerName');
            isAutomatchOpp = oppnames.indexOf(joinerName) >= 0;

            if (isAutomatchOpp) {
                this.helper.allowPlayerToJoin({
                    tag: request,
                    playerAddress: request.data.playerAddress
                });
            } else {
                this.helper.denyPlayerToJoin({
                    tag: request,
                    playerAddress: request.data.playerAddress
                });
            }
        };
    };

    createTable = function (opps, ratingSystem) {
        var seatsState, tKingdom, tSettings, tOpts;
        seatsState = [1, 2, 3, 4, 5, 6].map(function (i) {
            return (i <= opps.length + 1);
        });
        // TODO: random kingdom cards for casual games
        tKingdom = ["gardens", "cellar", "smithy", "village", "councilRoom",
                       "bureaucrat", "chapel", "workshop", "festival", "moat"];
        tSettings = {name: 'For ' + opps.join(', '),
                        seatsState: seatsState,
                        gameData: {uid: ""},
                        kingdomCards: tKingdom,
                        platinumColony: false,
                        useShelters: false,
                        ratingType: ratingSystem};
        tOpts = {settings: JSON.stringify(tSettings),
                    isLock: false,
                    isRequestJoin: true,
                    isRequestSit: false,
                    tableIndex: null};
        AM.zch.createTable(tOpts);
    };

    // Print debugging messages to the JS console
    debug = function (str) {
        if (AM.log_debugging_messages) {
            console.log(str);
        }
    };

    debug('Automatch script loaded.');
};
