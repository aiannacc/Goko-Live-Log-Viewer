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
        var gs, gso, gokoconn, connInfo, mr, zch;
        console.log('Checking for Automatch dependencies');
        try {
            gs = window.GokoSalvager;
            gso = gs.get_option;
            gokoconn = window.conn;
            connInfo = gokoconn.connInfo;
            mr = window.mtgRoom;
            zch = mr.helpers.ZoneClassicHelper;
            //db = window.FS.Dominion.DeckBuilder;
            //dbp = window.FS.Dominion.DeckBuilder.persistent;
        } catch (e) {}

        if ([gso, gokoconn, connInfo, mr, zch].every(exists)) {
            console.log('Loading Automatch module');
            loadAutomatchModule(gs, gokoconn, mr, zch);
            clearInterval(dbWait);
        }
    }, 500);
}());

// To be executed in Goko's namespace
loadAutomatchModule = function (gs, conn, mtgRoom, zch) {
    "use strict";   // JSLint mode

    var debug, initAutomatch, automatchInitStarted, addAutomatchButton,
        fetchOwnRatings, updateAMButton, createTable,
        fetchOwnSets, handleDisconnect,
        connectToAutomatchServer, confirmReceipt, confirmSeek, offerMatch,
        rescindOffer, announceGame, unannounceGame, joinAutomatchGame,
        createAutomatchGame, enableButtonWhenAutomatchReady,
        handleLostAutomatchConnection, enableAutoAccept, disableAutoAccept,
        gameReady, attemptAutomatchInit, testPop, sendAutoAutomatchSeekRequest;

    // Configuration
    gs.AM = gs.AM || {};
    gs.AM.log_debugging_messages = true;
    gs.AM.wsMaxFails = 100;

    // Use secure websockets
    gs.AM.server_url = 'wss://andrewiannaccone.com/automatch';

    // Initial state
    automatchInitStarted = false;
    gs.AM.tableSettings = null;
    gs.AM.wsFailCount = 0;
    gs.AM.state = {seek: null, offer: null, game: null};

    // Goko constants
    gs.AM.ENTER_LOBBY = "gatewayConnect";              // Fired on lobby enter
    gs.AM.GAME_START = "gameServerHello";              // Fired on game start
    gs.AM.TABLE_STATE = "tableState";                  // Fired on table changes
    gs.AM.CASUAL_SYS_ID = '4fd6356ce0f90b12ebb0ff3a';  // Goko casual rating sys
    gs.AM.PRO_SYS_ID = '501726b67af16c2af2fc9c54';     // Goko pro rating sys

    // Runs at end of script
    initAutomatch = function (mtgRoom, gokoconn, zch) {
        debug('Initializing Automatch');

        // Goko helper objects
        gs.AM.mtgRoom = mtgRoom;
        gs.AM.gokoconn = gokoconn;
        gs.AM.zch = zch;

        // Goko player info. Ratings and sets owned via asynchronous query.
        gs.AM.player = {pname: gs.AM.gokoconn.connInfo.playerName,
                     pid: gs.AM.gokoconn.connInfo.playerId,
                     kind: gs.AM.gokoconn.connInfo.kind,
                     rating: {},
                     sets_owned: null};
        fetchOwnRatings(updateAMButton);
        fetchOwnSets(updateAMButton);

        // Asynchronously connect to automatch server via WebSocket
        connectToAutomatchServer();

        // Create automatch popup dialogs
        gs.AM.appendSeekPopup($('#viewport'));
        gs.AM.appendOfferPopup($('#viewport'));
        gs.AM.appendGamePopup($('#viewport'));

        // Replace the "Play Now" button with an Automatch button
        $('.room-section-btn-find-table').remove();
        $('.room-section-header-buttons').append(
            $('<button id="automatchButton" />')
                .addClass('fs-mtrm-text-border')
                .addClass('fs-mtrm-dominion-btn')
                .click(gs.AM.showSeekPop)
        );

        // Disable the butomatch button until the async init calls finish
        updateAMButton();

        // Add auto-automatch option to table create dialog
        $('.edit-table-lock-table').parent().after(
            $('<div>').append('<input type="checkbox" id="am-onseek-box">')
                      .append(' Use Automatch')
                      .append(' <span id="automatch-info-span" />')
        );
        $('#am-onseek-box').attr('checked', gs.get_option('automatch_on_seek'));

        // Show automatch information when user clicks on blue "(?)"
        var amURL = "https://github.com/aiannacc/Goko-Salvager/wiki/Automatch";
        var amInfo = '<p>Automatch can search for opponents in other'
                     + ' lobbies while you wait at your table here.'
                     + '<p>This will not prevent players in this lobby from'
                     + ' joining your table.</p>'
                     + '<a href="' + amURL + '" target="_blank">More</a>';
        $('#automatch-info-span').html(' (?)')
                                 .css('color', 'blue')
                                 .css('cursor', 'pointer')
                                 .click(function () {
                console.log('clicked for AM info');
                if ($('#automatch-info-popup').length === 0) {
                    $('<div>').prop('id', 'automatch-info-popup')
                              .html(amInfo)
                              .css('z-index', '6000')
                              .prop('title', 'Automatch Info')
                              .appendTo(".fs-mtrm-popup-edit-table");
                }
                // NOTE: I had to hack the CSS to make this appear on top.
                //       I set ".ui-front {z-index: 1000}" in the included
                //       JQuery "smoothness" style file.
                $('#automatch-info-popup').dialog({
                    modal: true,
                    width: 500,
                    draggable: false,
                    resizable: false
                });
            });

        // NOTE: Somehow this doesn't prevent Goko's click event. That's
        //       almost exactly what I want, though it's a bit mysterious.
        //       Unfortunately, I can't know whether this or the Goko click
        //       event will trigger first.
        $('.edit-table-btn-create').click(function () {

            // TODO: bind automatch_on_seek properly
            if ($('#am-onseek-box').attr('checked')) {
                gs.set_option('automatch_on_seek', true);
                sendAutoAutomatchSeekRequest();
            } else {
                gs.set_option('automatch_on_seek', false);
            }
        });

        // Notify automatch when the player starts a game
        gs.AM.gokoconn.bind(gs.AM.GAME_START, gs.AM.gameStarted);

        // Refresh player's rating info after games
        // TODO: no need to refresh on room changes.
        gs.AM.gokoconn.bind(gs.AM.ENTER_LOBBY, function () {
            fetchOwnRatings(updateAMButton);
        });
    };

    // Asynchronously request Goko casual and pro ratings
    fetchOwnRatings = function (frCallback) {
        gs.AM.player.rating = {};

        if (gs.AM.player.kind === 'guest') {
            // TODO: look up guest ratings correctly
            gs.AM.player.rating.goko_casual_rating = 1000;
            gs.AM.player.rating.goko_pro_rating = 1000;
            if (typeof frCallback !== undefined) {
                frCallback();
            }

        } else {
            // Asynchronously get casual rating
            gs.AM.gokoconn.getRating({
                playerId: gs.AM.player.pid,
                ratingSystemId: gs.AM.CASUAL_SYS_ID
            }, function (resp) {
                gs.AM.player.rating.goko_casual_rating = resp.data.rating;
                if (typeof frCallback !== undefined) {
                    frCallback();
                }
            });

            // Asynchronously get pro rating
            gs.AM.gokoconn.getRating({
                playerId: gs.AM.player.pid,
                ratingSystemId: gs.AM.PRO_SYS_ID
            }, function (resp) {
                gs.AM.player.rating.goko_pro_rating = resp.data.rating;
                if (typeof frCallback !== undefined) {
                    frCallback();
                }
            });

            // TODO: get Isotropish rating
        }
    };

    // Asynchronously request which card sets we own
    fetchOwnSets = function (fsCallback) {
        if (gs.AM.player.kind === "guest") {
            // Guests only have Base. No need to check.
            gs.AM.player.sets_owned = ['Base'];
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
            gs.AM.gokoconn.getInventoryList({}, function (r) {
                var myInv = r.data.inventoryList.filter(function (x) {
                    return x.name === "Personal";
                })[0];
                gs.AM.gokoconn.getInventory({
                    inventoryId: myInv.inventoryId,
                    tagFilter: "Dominion Card"
                }, function (r) {
                    gs.AM.gokoconn.getObjects2({
                        objectIds: r.data.objectIds
                    }, function (r) {
                        var setsOwned = [];
                        r.data.objectList.map(function (c) {
                            var set = cardsToSets[c.name];
                            if (set && setsOwned.indexOf(set) < 0) {
                                setsOwned.push(set);
                            }
                        });
                        gs.AM.player.sets_owned = setsOwned;
                        if (typeof fsCallback !== undefined) {
                            fsCallback();
                        }
                    });
                });
            });
        }
    };

    connectToAutomatchServer = function () {
        debug('Connecting to Automatch server at ' + gs.AM.server_url);

        gs.AM.ws = new WebSocket(gs.AM.server_url
                + '?pname=' + gs.AM.player.pname);
        gs.AM.ws.lastMessageTime = new Date();

        gs.AM.ws.onopen = function () {
            debug('Connected to Automatch server.');
            gs.AM.wsFailCount = 0;
            updateAMButton();

            // Ping AM server every 25 sec. Timeout if no messages (including
            // pingbacks) received for 60 sec.
            if (typeof gs.AM.pingLoop !== 'undefined') {
                clearInterval(gs.AM.pingLoop);
            }
            gs.AM.pingLoop = setInterval(function () {
                debug('Running ping loop');
                if (new Date() - gs.AM.ws.lastMessageTime > 30000) {
                    debug('Automatch server timed out.');
                    clearInterval(gs.AM.pingLoop);
                    handleDisconnect();
                } else {
                    debug('Sending ping');
                    gs.AM.ping();
                }
            }, 25000);
        };

        gs.AM.ws.onclose = function () {
            debug('Automatch server closed websocket.');
            handleDisconnect();
        };

        // Messages from server
        gs.AM.ws.onmessage = function (evt) {
            var msg = JSON.parse(evt.data);
            debug('Got ' + msg.msgtype + ' message from Automatch server:');
            debug(msg.message);

            gs.AM.ws.lastMessageTime = new Date();

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
        gs.AM.ws.sendMessage = function (msgtype, msg, smCallback) {
            var msgid, msgObj, msgStr;

            msgid = gs.AM.player.pname + Date.now();
            msgObj = {msgtype: msgtype,
                      message: msg,
                      msgid: msgid};
            msgStr = JSON.stringify(msgObj);

            gs.AM.ws.callbacks[msgid] = smCallback;
            gs.AM.ws.send(msgStr);

            debug('Sent ' + msgtype + ' message to Automatch server:');
            debug(msgObj);
        };

        // Callbacks to be run when server confirms msgid received
        gs.AM.ws.callbacks = {};
    };

    updateAMButton = function () {
        var connected, gotPlayerInfo, ready, buttonText, buttonColor;

        if (!gs.AM.player.hasOwnProperty('sets_owned')
                || !gs.AM.player.rating.hasOwnProperty('goko_casual_rating')
                || !gs.AM.player.rating.hasOwnProperty('goko_pro_rating')) {
            ready = false;
            buttonText = 'Automatch: Getting Player Info';
            buttonColor = 'LightGray';
        } else if (typeof gs.AM.ws === 'undefined') {
            ready = false;
            buttonText = 'Automatch: Connecting';
            buttonColor = 'LightGray';
        } else if (gs.AM.ws.readyState === WebSocket.CONNECTING) {
            ready = false;
            buttonText = 'Automatch: Connecting';
            buttonColor = 'LightGray';
        } else if (gs.AM.ws.readyState === WebSocket.CLOSED
                || gs.AM.ws.readyState === WebSocket.CLOSING) {
            ready = false;
            buttonText = 'Automatch: Offline';
            buttonColor = 'Red';
        } else if (gs.AM.ws.readyState === WebSocket.OPEN) {
            ready = true;
            if (gs.AM.state.seek !== null) {
                buttonText = 'Automatch: Searching';
                buttonColor = 'GreenYellow';
            } else {
                buttonText = 'Automatch: Idle';
                buttonColor = 'White';
            }
        }
        $('#automatchButton').prop('disabled', !ready)
                             .css('color', buttonColor)
                             .html(buttonText);
    };

    handleDisconnect = function () {
        // Update state
        gs.AM.state = {seek: null, offer: null, game: null};
        gs.AM.wsFailCount += 1;

        debug('Automatch failed: ' + gs.AM.wsFailCount
                + '/' + gs.AM.wsMaxFails);

        // Update UI
        gs.AM.showSeekPop(false);
        gs.AM.showOfferPop(false);
        gs.AM.showGamePop(false);
        updateAMButton();

        // Stop trying to ping
        if (typeof gs.AM.pingLoop !== 'undefined') {
            clearInterval(gs.AM.pingLoop);
        }

        // Wait 15 seconds and attempt reconnect.
        if (gs.AM.wsFailCount < gs.AM.wsMaxFails) {
            setTimeout(function () {
                connectToAutomatchServer();
                updateAMButton();
            }, 15000);
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
        var crCallback = gs.AM.ws.callbacks[msg.msgid];
        if (typeof crCallback !== 'undefined' && crCallback !== null) {
            debug(crCallback);
            crCallback();
        }
        updateAMButton();
    };

    confirmSeek = function (msg) {
        gs.AM.state.seek = msg.seek;
    };

    offerMatch = function (msg) {
        gs.AM.state.seek = null;
        gs.AM.state.offer = msg.offer;
        gs.AM.showOfferPop(true);
        new Audio('sounds/startTurn.ogg').play();
    };

    rescindOffer = function (msg) {
        gs.AM.state.offer = null;
        // TODO: handle this in a more UI-consistent way
        gs.AM.showOfferPop(false);
        alert('Automatch offer was rescinded:\n' + msg.reason);
    };

    announceGame = function (msg) {
        gs.AM.state.offer = null;
        gs.AM.state.game = msg.game;
        gs.AM.state.game.roomid = gs.AM.mtgRoom.roomList
            .where({name: gs.AM.state.game.roomname})[0].get('roomId');

        // Show game announcement dialog
        gs.AM.showOfferPop(false);
        gs.AM.showGamePop(true);

        // Host goes to room, creates game, notifies server
        if (gs.AM.state.game.hostname === gs.AM.player.pname) {

            var hostGame = function () {
                gs.AM.gokoconn.unbind(gs.AM.ENTER_LOBBY, hostGame);
                createAutomatchGame(function (tableindex) {
                    gs.AM.state.game.tableindex = tableindex;
                    gs.AM.gameCreated();
                });
            };
            gs.AM.gokoconn.bind(gs.AM.ENTER_LOBBY, hostGame);

            // Go to room or just create the game if we're already there
            if (gs.AM.zch.currentRoom.get('roomId') === gs.AM.state.game.roomid) {
                hostGame();
            } else {
                gs.AM.zch.changeRoom(gs.AM.state.game.roomid);
            }
        }
    };

    gameReady = function (msg) {
        gs.AM.state.offer = null;
        gs.AM.state.game = msg.game;

        // Guests go to room and join host's game
        if (gs.AM.state.game.hostname !== gs.AM.player.pname) {
            var joinGame = function () {
                gs.AM.gokoconn.unbind(gs.AM.ENTER_LOBBY, joinGame);
                var table, seatindex, joinOpts;
                table = gs.AM.mtgRoom.roomList
                    .where({roomId: gs.AM.mtgRoom.currentRoomId})[0]
                    .get('tableList')
                    .where({number: gs.AM.state.game.tableindex})[0];
                seatindex = gs.AM.state.game.seeks.map(function (seek) {
                    return seek.player.pname;
                }).filter(function (pname) {
                    return pname !== gs.AM.state.game.hostname;
                }).indexOf(gs.AM.player.pname) + 1;

                joinOpts = {table: gs.AM.state.game.tableindex,
                            seat: seatindex};
                debug('Joining table:');
                debug(joinOpts);
                gs.AM.gokoconn.joinAndSit(joinOpts, function () {
                    joinOpts.ready = true;
                    gs.AM.gokoconn.setReady(joinOpts);
                });
                debug('Joined game. Automatch finished.');
                gs.AM.showGamePop(false);
            };
            gs.AM.gokoconn.bind(gs.AM.ENTER_LOBBY, joinGame);
            gs.AM.zch.changeRoom(gs.AM.state.game.roomid);
        }
    };

    // TODO: deal with possibility that unannounce arrives before announce
    unannounceGame = function (msg) {
        gs.AM.state.game = null;
        gs.AM.showGamePop(false);
        alert('Automatch game canceled. Reason:\n' + msg.reason);
    };

    /*
     * Handle messages to the automatch server
     */

    gs.AM.ping = function () {
        gs.AM.ws.sendMessage('PING', {});
    };

    gs.AM.submitSeek = function (seek) {
        gs.AM.state.seek = seek;
        gs.AM.ws.sendMessage('SUBMIT_SEEK', {seek: gs.AM.state.seek});
    };

    gs.AM.cancelSeek = function (seek) {
        if (gs.AM.state.seek !== null) {
            gs.AM.state.seek.canceling = true;
            gs.AM.tableSettings = null;
            gs.AM.ws.sendMessage('CANCEL_SEEK',
                {seekid: gs.AM.state.seek.seekid},
                function () { gs.AM.state.seek = null; });
        }
    };

    gs.AM.acceptOffer = function (aoCallback) {
        var msg = {matchid: gs.AM.state.offer.matchid};
        gs.AM.ws.sendMessage('ACCEPT_OFFER', msg, aoCallback);
    };

    gs.AM.unacceptOffer = function () {
        var msg = {matchid: gs.AM.state.offer.matchid};
        gs.AM.ws.sendMessage('UNACCEPT_OFFER', msg, function () {
            gs.AM.state.offer = null;
        });
    };

    gs.AM.declineOffer = function () {
        var msg = {matchid: gs.AM.state.offer.matchid};
        gs.AM.ws.sendMessage('DECLINE_OFFER', msg, function () {
            gs.AM.state.offer = null;
        });
    };

    gs.AM.gameCreated = function () {
        var msg = {game: gs.AM.state.game};
        gs.AM.ws.sendMessage('GAME_CREATED', msg);
    };

    gs.AM.gameStarted = function () {
        var msg = {matchid: null};
        if (gs.AM.state.game !== null) {
            msg = {matchid: gs.AM.state.game.matchid};
        }
        gs.AM.ws.sendMessage('GAME_STARTED', msg);
        gs.AM.state = {seek: null, offer: null, game: null};
    };

    gs.AM.abortGame = function () {
        if (gs.AM.state.game.hasOwnProperty('matchid')) {
            gs.AM.ws.sendMessage('CANCEL_GAME',
                    {matchid: gs.AM.state.game.matchid});
        }
    };

    /*
     * Send an auto-automatch request
     */
    sendAutoAutomatchSeekRequest = function () {
        console.log('Creating auto-automatch request');

        var tSettings = JSON.parse(gs.AM.mtgRoom.views.ClassicRoomsEditTable
                                     .retriveDOM().settings);
        console.log("Table Settings:");
        console.log(tSettings);

        // Cache table settings so that we build the same game if we
        // end up making an automatch in Casual or Unrated.
        gs.AM.tableSettings = tSettings;

        var tName = tSettings.name;
        var pCount = tSettings.seatsState.filter(function (s) {
            return s;
        }).length;
        var rSystem = tSettings.ratingType;

        console.log('tname: ' + tName);
        console.log('pcount: ' + pCount);
        console.log('rSystem: ' + rSystem);

        // Match title fragments like 5432+, 5k+, 5.4k+
        console.log('Reading min rating req');
        var m, minRating = null;
        if ((m = tName.match(/(\d(\.\d+){0,1})[kK]\+/)) !== null) {
            minRating = Math.floor(1000 * parseFloat(m[1], 10));
        } else if ((m = tName.match(/(\d\d\d\d)\+/)) !== null) {
            minRating = parseInt(m[1], 10);
        }

        // Do not automatch if looking for a particular opponent
        if ((m = tName.toLowerCase().match(/for\s*\S*/)) !== null) {
            console.log('Table is for a specific opp; no automatch');
        } else {
            var np, rs, ar;

            np = {rclass: 'NumPlayers', props: {}};
            np.props.min_players = pCount;
            np.props.max_players = pCount;

            rs = {rclass: 'RatingSystem', props: {}};
            rs.props.rating_system = rSystem;

            ar = {rclass: 'AbsoluteRating', props: {}};
            ar.props.min_pts = minRating;
            ar.props.max_pts = null;
            ar.props.rating_system = rSystem;

            // Send seek request
            var seek = {
                player: gs.AM.player,
                requirements: [np, rs, ar]
            };
            console.log(seek);

            // TODO: wait for seek canceled confirmation
            if (gs.AM.state.seek !== null) {
                gs.AM.cancelSeek(gs.AM.state.seek);
            }

            console.log('Sending auto-automatch request');
            gs.AM.submitSeek(seek);
        }
    };

    /*
     * Automated hosting/joining using the Goko FS framework
     */

    createAutomatchGame = function (callback) {
        var oppnames, ratingSystem, listenJoin, listenCreate;

        oppnames = gs.AM.state.game.seeks.map(function (seek) {
            return seek.player.pname;
        }).filter(function (pname) {
            return pname !== gs.AM.player.pname;
        });
        ratingSystem = gs.AM.state.game.rating_system;

        // Handle join requests automatically
        enableAutoAccept(oppnames);

        // !!! Hideous code follows !!!
        // TODO: clean up the flow of execution
        // TODO: do we really have to bind to all table changes in the room?

        // 3. Wait for all opponents to join
        listenJoin = function () {
            var tableModel = gs.AM.zch.currentTable;
            if (tableModel !== null &&
                    tableModel.get('joined').length === oppnames.length + 1) {

                // Notify user when all opponents have joined
                gs.AM.gokoconn.unbind(gs.AM.TABLE_STATE, listenJoin);
                debug('All opponents have joined. Automatch complete.');
                disableAutoAccept();
                gs.AM.showGamePop(false);
            }
        };

        // 2. Notify Automatch server; listen for joins
        listenCreate = function () {
            var tableModel = gs.AM.zch.currentTable;
            if (tableModel !== null) {
                gs.AM.gokoconn.unbind(gs.AM.TABLE_STATE, listenCreate);
                gs.AM.gokoconn.bind(gs.AM.TABLE_STATE, listenJoin);
                callback(tableModel.get('number'));
            }
        };

        // 1. Create a new game table; listen for its creation
        gs.AM.gokoconn.bind(gs.AM.TABLE_STATE, listenCreate);
        createTable(oppnames, ratingSystem);
    };

    disableAutoAccept = function () {
        var reqView = gs.AM.mtgRoom.views.ClassicRoomsPermit;
        if (typeof reqView.showByRequest_orig !== 'undefined') {
            reqView.showByRequest = reqView.showByRequest_orig;
        }
    };

    enableAutoAccept = function (oppnames) {
        var reqView = gs.AM.mtgRoom.views.ClassicRoomsPermit;
        reqView.showByRequest_orig = reqView.showByRequest;
        reqView.showByRequest = function (request) {
            var joinerName, opts, isAutomatchOpp;

            joinerName = gs.AM.mtgRoom.playerList
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
        // Leave current table first, if any
        if (gs.AM.zch.hasOwnProperty('currentTable')
                && gs.AM.zch.currentTable !== null) {
            gs.AM.zch.leaveTable(gs.AM.zch.currentTable);
        }

        var seatsState, tKingdom, tSettings, tOpts;
        seatsState = [1, 2, 3, 4, 5, 6].map(function (i) {
            return (i <= opps.length + 1);
        });


        if (gs.AM.tableSettings !== null) {
            // Use cached settings if available
            tSettings = gs.AM.tableSettings;
            tSettings.name = 'For ' + opps.join(', ');
            tOpts = {settings: JSON.stringify(tSettings),
                     isLock: false,
                     isRequestJoin: true,
                     isRequestSit: false,
                     tableIndex: null};
            gs.AM.zch.createTable(tOpts);

        } else {
            // Otherwise generate new ones
            var deck = new window.FS.Dominion.DeckBuilder.Model.CardDeck();
            deck = deck.doEmpty();
            deck.set({ name: 'Automatch Random deck' });
            mtgRoom.deckBuilder.persistent.getRandomDeck({
                app: mtgRoom.deckBuilder,
                deck: deck,
                useEternalGenerateMethod: true  // (Goko typo)
            }, function (d) {
                tSettings = {name: 'For ' + opps.join(', '),
                             seatsState: seatsState,
                             gameData: {uid: ""},
                             kingdomCards: d.get('cardNameIds'),
                             platinumColony: d.get('isColonyAndPlatinum'),
                             useShelters: d.get('useShelters'),
                             ratingType: ratingSystem};
                tOpts = {settings: JSON.stringify(tSettings),
                         isLock: false,
                         isRequestJoin: true,
                         isRequestSit: false,
                         tableIndex: null};
                gs.AM.zch.createTable(tOpts);
            });
        }
    };

    // Print debugging messages to the JS console
    debug = function (str) {
        if (gs.AM.log_debugging_messages) {
            console.log(str);
        }
    };

    debug('Automatch script loaded.');
    debug('Initializing automatch.');
    initAutomatch(mtgRoom, conn, zch);
};
