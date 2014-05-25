(function () {
    "use strict";

    var mod = GS.modules.automatch = new GS.Module('Automatch');
    mod.dependencies = ['FS.EventDispatcher'];
    mod.load = function () {
        var loadAutomatchModule = function () {
            var announceGame,
                confirmReceipt,
                confirmSeek,
                connectToAutomatchServer,
                createAutomatchGame,
                createTable,
                disableAutoAccept,
                enableAutoAccept,
                fetchOwnRatings,
                fetchOwnSets,
                gameReady,
                handleDisconnect,
                initAutomatch,
                offerMatch,
                rescindOffer,
                sendAutoAutomatchSeekRequest,
                showChat,
                unannounceGame,
                updateAMButton;

            // Configuration
            GS.AM = GS.AM || {};
            GS.AM.log_debugging_messages = true;
            GS.AM.wsMaxFails = 100;

            // Use secure websockets
            if (GS.get_option('testmode')) {
                GS.AM.server_url = 'wss://gokosalvager.com:7443/automatch';
            } else {
                GS.AM.server_url = 'wss://gokosalvager.com:443/automatch';
            }

            // Initial state
            // automatchInitStarted = false;
            GS.AM.tableSettings = null;
            GS.AM.wsFailCount = 0;
            GS.AM.noreconnect = false;
            GS.AM.state = {seek: null, offer: null, game: null};

            // Goko constants
            GS.AM.ENTER_LOBBY = "gatewayConnect";
            GS.AM.LEAVE_LOBBY = "gatewayDisconnect";
            GS.AM.GAME_START = "gameServerHello";              // Fired on game start
            GS.AM.TABLE_STATE = "tableState";                  // Fired on table changes
            GS.AM.CASUAL_SYS_ID = '4fd6356ce0f90b12ebb0ff3a';  // Goko casual rating sys
            GS.AM.PRO_SYS_ID = '501726b67af16c2af2fc9c54';     // Goko pro rating sys

            // Runs at end of script
            initAutomatch = function () {
                GS.debug('Initializing Automatch');

                // Goko helper objects
                GS.AM.mtgRoom = mtgRoom;
                GS.AM.gokoconn = mtgRoom.conn;
                GS.AM.zch = mtgRoom.getHelper('ZoneClassicHelper');

                // Goko player info. Ratings and sets owned via asynchronous query.
                GS.AM.player = {pname: GS.AM.gokoconn.connInfo.playerName,
                             pid: GS.AM.gokoconn.connInfo.playerId,
                             kind: GS.AM.gokoconn.connInfo.kind,
                             rating: {},
                             ratingsDirty: true,
                             sets_owned: null};

                // Remove broken css in Goko's "Create Game" button
                $('.room-section-btn-create-table')
                    .removeClass('room-section-btn-create-table')
                    .css('margin', '0px 3px 0px 3px')
                    .click(mtgRoom.views.ClassicRoomSection.onClickCreateTable);

                // Replace the "Play Now" button with an Automatch button
                $('.room-section-btn-find-table').remove();
                $('.room-section-header-buttons')
                    .append($('<li>')
                        .append($('<button id="automatchButton" />')
                            .addClass('fs-mtrm-text-border')
                            .addClass('fs-mtrm-dominion-action-btn')
                            .css('margin', '0px 3px 0px 3px')
                            .css('width', '200px')
                            .click(GS.AM.showSeekPop)));
                updateAMButton();

                fetchOwnRatings(updateAMButton);
                fetchOwnSets(updateAMButton);

                // Asynchronously connect to automatch server via WebSocket
                connectToAutomatchServer();

                // Create automatch popup dialogs
                GS.AM.appendSeekPopup($('#viewport'));
                GS.AM.appendOfferPopup($('#viewport'));
                GS.AM.appendGamePopup($('#viewport'));

                // Disable the butomatch button until the async init calls finish
                updateAMButton();

                // Add auto-automatch option to table create dialog
                $('.edit-table-lock-table').parent().after(
                    $('<div>').append('<input type="checkbox" id="am-onseek-box">')
                              .append(' Use Automatch')
                              .append(' <span id="automatch-info-span" />')
                );
                $('#am-onseek-box').attr('checked', GS.get_option('automatch_on_seek'));

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
                        GS.debug('clicked for AM info');
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
                            modal: false,
                            width: 500,
                            draggable: true,
                            resizable: false
                        });
                    });

                // NOTE: Somehow this doesn't prevent Goko's click event. That's
                //       almost exactly what I want, though it's a bit mysterious.
                //       Unfortunately, I can't know whether this or the Goko click
                //       event will trigger first.
                $('.edit-table-btn-create').click(function () {

                    // TODO: bind automatch_on_seek using AngularJS
                    if ($('#am-onseek-box').attr('checked')) {
                        GS.set_option('automatch_on_seek', true);
                        sendAutoAutomatchSeekRequest();
                    } else {
                        GS.set_option('automatch_on_seek', false);
                    }
                });

                // Notify automatch when the player starts a game
                // Also shut down automatch
                GS.AM.gokoconn.bind(GS.AM.GAME_START, function () {
                    GS.AM.gameStarted();

                    GS.AM.state = {seek: null, offer: null, game: null};

                    // Disable auto-reconnect and disconnect from automatch server
                    GS.AM.noreconnect = true;
                    if (GS.AM.ws !== undefined
                            && GS.AM.ws !== null
                            && GS.AM.ws.readyState === 1) {
                        GS.AM.ws.close();
                    }

                    // Remind us to update the ratings when next joining a lobby
                    GS.AM.player.ratingsDirty = true;
                });

                // Refresh player's rating info after games
                GS.AM.gokoconn.bind(GS.AM.ENTER_LOBBY, function () {
                    // Check whether we've entered a multiplayer meeting room
                    GS.debug('Entered lobby: ' + mtgRoom.currentRoomId);
                    if (mtgRoom.currentRoomId !== null) {

                        // Enable auto-reconnect and connect to automatch server
                        GS.AM.noreconnect = false;
                        if (GS.AM.ws === undefined
                                || GS.AM.ws === null
                                || GS.AM.ws.readyState !== 1) {
                            connectToAutomatchServer();
                        }

                        // Refresh my ratings
                        if (GS.AM.player.ratingsDirty) {
                            fetchOwnRatings(updateAMButton);
                        }
                    }
                });

                GS.AM.gokoconn.bind(GS.AM.LEAVE_LOBBY, function () {
                    // Shut down automatch when player leaves meeting room lobby
                    if (mtgRoom.currentRoomId === null) {
                        GS.AM.state = {seek: null, offer: null, game: null};

                        // Disable auto-reconnect and disconnect from automatch server
                        GS.AM.noreconnect = true;
                        if (GS.AM.ws !== undefined
                                && GS.AM.ws !== null
                                && GS.AM.ws.readyState === 1) {
                            GS.AM.ws.close();
                        }
                    }
                });
            };

            // Asynchronously request Goko casual and pro ratings
            fetchOwnRatings = function (frCallback) {
                GS.AM.player.rating = {};

                if (GS.AM.player.kind === 'guest') {
                    // TODO: look up guest ratings correctly
                    GS.AM.player.rating.goko_casual_rating = 1000;
                    GS.AM.player.rating.goko_pro_rating = 1000;
                    if (frCallback !== undefined) {
                        frCallback();
                    }

                } else {
                    GS.AM.player.rating.isotropish_rating
                        = GS.getIsoLevel(GS.AM.player.pid);

                    // Asynchronously get casual rating
                    GS.AM.gokoconn.getRating({
                        playerId: GS.AM.player.pid,
                        ratingSystemId: GS.AM.CASUAL_SYS_ID
                    }, function (resp) {
                        GS.AM.player.rating.goko_casual_rating = resp.data.rating;
                        if (resp.data.rating === undefined) {
                            GS.AM.player.rating.goko_casual_rating = 1000;
                        }
                        if (frCallback !== undefined) {
                            frCallback();
                        }
                    });

                    // Asynchronously get pro rating
                    GS.AM.gokoconn.getRating({
                        playerId: GS.AM.player.pid,
                        ratingSystemId: GS.AM.PRO_SYS_ID
                    }, function (resp) {
                        GS.AM.player.rating.goko_pro_rating = resp.data.rating;
                        if (resp.data.rating === undefined) {
                            GS.AM.player.rating.goko_pro_rating = 1000;
                        }
                        GS.AM.player.ratingsDirty = false;
                        if (frCallback !== undefined) {
                            frCallback();
                        }
                    });
                }
            };

            // Asynchronously request which card sets we own
            fetchOwnSets = function (fsCallback) {
                if (GS.AM.player.kind === "guest") {
                    // Guests only have Base. No need to check.
                    GS.AM.player.sets_owned = ['Base'];
                    if (fsCallback !== undefined) {
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
                    GS.AM.gokoconn.getInventoryList({}, function (r) {
                        var myInv = r.data.inventoryList.filter(function (x) {
                            return x.name === "Personal";
                        })[0];
                        GS.AM.gokoconn.getInventory({
                            inventoryId: myInv.inventoryId,
                            tagFilter: "Dominion Card"
                        }, function (r) {
                            GS.AM.gokoconn.getObjects2({
                                objectIds: r.data.objectIds
                            }, function (r) {
                                var setsOwned = [];
                                r.data.objectList.map(function (c) {
                                    var set = cardsToSets[c.name];
                                    if (set && setsOwned.indexOf(set) < 0) {
                                        setsOwned.push(set);
                                    }
                                });
                                GS.AM.player.sets_owned = setsOwned;
                                if (fsCallback !== undefined) {
                                    fsCallback();
                                }
                            });
                        });
                    });
                }
            };

            connectToAutomatchServer = function () {
                GS.debug('Connecting to Automatch server at ' + GS.AM.server_url);

                if (GS.AM.hasOwnProperty('ws') && GS.AM.ws.readyState !== 3) {
                    GS.debug('Already connected to Automatch server.');
                    return;
                }

                GS.AM.ws = new WebSocket(GS.AM.server_url
                        + '?pname=' + GS.AM.player.pname);
                GS.AM.ws.lastMessageTime = new Date();

                GS.AM.ws.onopen = function () {
                    GS.debug('Connected to Automatch server.');
                    GS.AM.wsFailCount = 0;
                    updateAMButton();

                    // Ping AM server every 25 sec. Timeout if no messages (including
                    // pingbacks) received for 180 sec.
                    if (GS.AM.pingLoop !== undefined) {
                        clearInterval(GS.AM.pingLoop);
                    }
                    GS.AM.pingLoop = setInterval(function () {
                        GS.debug('Running ping loop');
                        if (new Date() - GS.AM.ws.lastMessageTime > 180000) {
                            GS.debug('Automatch server timed out.');
                            clearInterval(GS.AM.pingLoop);
                            try {
                                GS.AM.ws.close();
                            } catch (ignore) {}
                        } else {
                            GS.debug('Sending ping');
                            GS.AM.ping();
                        }
                    }, 25000);
                };

                GS.AM.ws.onclose = function () {
                    GS.debug('Automatch server closed websocket.');
                    handleDisconnect();
                };

                // Messages from server
                GS.AM.ws.onmessage = function (evt) {
                    var msg = JSON.parse(evt.data);
                    GS.debug('Got ' + msg.msgtype + ' message from Automatch server:');
                    GS.debug(msg.message);

                    GS.AM.ws.lastMessageTime = new Date();

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
                    case 'ANNOUNCE_CHAT':
                        showChat(msg.message);
                        break;
                    default:
                        throw 'Received unknown message type: ' + msg.msgtype;
                    }
                };

                // Convenience wrapper for websocket send() method
                GS.AM.ws.sendMessage = function (msgtype, msg, smCallback) {
                    var msgid, msgObj, msgStr;

                    msgid = GS.AM.player.pname + Date.now();
                    msgObj = {msgtype: msgtype,
                              message: msg,
                              msgid: msgid};
                    msgStr = JSON.stringify(msgObj);

                    GS.AM.ws.callbacks[msgid] = smCallback;
                    GS.AM.ws.send(msgStr);

                    GS.debug('Sent ' + msgtype + ' message to Automatch server:');
                    GS.debug(msgObj);
                };

                // Callbacks to be run when server confirms msgid received
                GS.AM.ws.callbacks = {};
            };

            updateAMButton = function () {
                var ready, buttonText, buttonColor;
                // var connected, gotPlayerInfo;

                if (!GS.AM.player.hasOwnProperty('sets_owned')
                        || !GS.AM.player.rating.hasOwnProperty('goko_casual_rating')
                        || !GS.AM.player.rating.hasOwnProperty('goko_pro_rating')) {
                    ready = false;
                    buttonText = 'Automatch: Initializing';
                    buttonColor = 'LightGray';
                } else if (GS.AM.ws === undefined) {
                    ready = false;
                    buttonText = 'Automatch: Connecting';
                    buttonColor = 'LightGray';
                } else if (GS.AM.ws.readyState === WebSocket.CONNECTING) {
                    ready = false;
                    buttonText = 'Automatch: Connecting';
                    buttonColor = 'LightGray';
                } else if (GS.AM.ws.readyState === WebSocket.CLOSED
                        || GS.AM.ws.readyState === WebSocket.CLOSING) {
                    ready = false;
                    buttonText = 'Automatch: Offline';
                    buttonColor = 'Red';
                } else if (GS.AM.ws.readyState === WebSocket.OPEN) {
                    ready = true;
                    if (GS.AM.state.seek !== null) {
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
                GS.AM.state = {seek: null, offer: null, game: null};
                GS.AM.wsFailCount += 1;

                GS.debug('Automatch connection failure: ' + GS.AM.wsFailCount
                        + '/' + GS.AM.wsMaxFails);

                // Update UI
                GS.AM.showSeekPop(false);
                GS.AM.showOfferPop(false);
                GS.AM.showGamePop(false);
                updateAMButton();

                // Stop trying to ping
                if (GS.AM.pingLoop !== undefined) {
                    clearInterval(GS.AM.pingLoop);
                }

                // Wait 5 seconds and attempt reconnect.
                if (!GS.AM.noreconnect && GS.AM.wsFailCount < GS.AM.wsMaxFails) {
                    setTimeout(function () {
                        connectToAutomatchServer();
                        updateAMButton();
                    }, 5000);
                } else {
                    GS.debug('Not attempting to reconnect to automatch server.');
                }
            };

            /*
             * Handle messages from the Automatch server
             */

            // Invoke the callback registered to this message's id, if any.
            confirmReceipt = function (msg) {
                GS.debug('Receipt of message confirmed: ' + msg.msgid);
                var crCallback = GS.AM.ws.callbacks[msg.msgid];
                if (crCallback !== undefined && crCallback !== null) {
                    crCallback();
                }
                updateAMButton();
            };

            confirmSeek = function (msg) {
                GS.AM.state.seek = msg.seek;
            };

            offerMatch = function (msg) {
                GS.AM.state.seek = null;
                GS.AM.state.offer = msg.offer;
                GS.AM.showOfferPop(true);
                GS.notifyUser('Automatch found', new Audio('sounds/startTurn.ogg'));
            };

            showChat = function (msg) {
                GS.AM.showOfferChat(msg.speaker, msg.text);
            };

            rescindOffer = function (msg) {
                GS.AM.state.offer = null;
                GS.AM.tableSettings = null;
                // TODO: handle this in a more UI-consistent way
                GS.AM.showOfferPop(false);

                var chatText = $('#amChatArea').val();
                GS.notifyUser('Automatch offer was rescinded:\n' + msg.reason
                        + (chatText ? '  ' + chatText : ''));
            };

            announceGame = function (msg) {
                GS.AM.state.offer = null;
                GS.AM.state.game = msg.game;
                GS.AM.state.game.roomid = GS.AM.mtgRoom.roomList
                    .where({name: GS.AM.state.game.roomname})[0].get('roomId');

                // Show game announcement dialog
                GS.AM.showOfferPop(false);
                GS.AM.showGamePop(true);

                // Host goes to room, creates game, notifies server
                if (GS.AM.state.game.hostname === GS.AM.player.pname) {

                    var hostGame = function () {
                        GS.AM.gokoconn.unbind(GS.AM.ENTER_LOBBY, hostGame);
                        createAutomatchGame(function (tableindex) {
                            GS.AM.state.game.tableindex = tableindex;
                            GS.AM.gameCreated();
                        });
                    };
                    GS.AM.gokoconn.bind(GS.AM.ENTER_LOBBY, hostGame);

                    // Go to room or just create the game if we're already there
                    if (GS.AM.zch.currentRoom.get('roomId')
                            === GS.AM.state.game.roomid) {
                        hostGame();
                    } else {
                        GS.AM.zch.changeRoom(GS.AM.state.game.roomid);
                    }
                }
            };

            gameReady = function (msg) {
                GS.AM.state.offer = null;
                GS.AM.state.game = msg.game;

                // Guests go to room and join host's game
                if (GS.AM.state.game.hostname !== GS.AM.player.pname) {
                    var joinGame = function () {
                        GS.AM.gokoconn.unbind(GS.AM.ENTER_LOBBY, joinGame);
                        var seatindex, joinOpts;
                        seatindex = GS.AM.state.game.seeks.map(function (seek) {
                            return seek.player.pname;
                        }).filter(function (pname) {
                            return pname !== GS.AM.state.game.hostname;
                        }).indexOf(GS.AM.player.pname) + 1;

                        joinOpts = {table: GS.AM.state.game.tableindex,
                                    seat: seatindex};
                        GS.debug('Joining table:');
                        GS.debug(joinOpts);
                        GS.AM.gokoconn.joinAndSit(joinOpts, function () {
                            joinOpts.ready = true;
                            GS.AM.gokoconn.setReady(joinOpts);
                        });
                        GS.debug('Joined game. Automatch finished.');
                        GS.AM.showGamePop(false);
                    };
                    GS.AM.gokoconn.bind(GS.AM.ENTER_LOBBY, joinGame);
                    GS.AM.zch.changeRoom(GS.AM.state.game.roomid);
                }
            };

            // TODO: deal with possibility that unannounce arrives before announce
            unannounceGame = function (msg) {
                GS.AM.state.game = null;
                GS.AM.showGamePop(false);
                GS.notifyUser('Automatch game canceled. Reason:\n' + msg.reason);
            };

            /*
             * Handle messages to the automatch server
             */

            GS.AM.ping = function () {
                GS.AM.ws.sendMessage('PING', {});
            };

            GS.AM.submitSeek = function (seek) {
                var blist = GS.getCombinedBlacklist();
                seek.blacklist = [];
                _.keys(blist).map(function (pname) {
                    if (blist[pname].nomatch || blist[pname].noplay) {
                        seek.blacklist.push(pname);
                    }
                });
                GS.AM.state.seek = seek;
                GS.AM.ws.sendMessage('SUBMIT_SEEK', {seek: GS.AM.state.seek});
            };

            GS.AM.cancelSeek = function (seek) {
                if (GS.AM.state.seek !== null) {
                    GS.AM.state.seek.canceling = true;
                    GS.AM.ws.sendMessage('CANCEL_SEEK',
                        {seekid: GS.AM.state.seek.seekid},
                        function () { GS.AM.state.seek = null; });
                }
                GS.AM.tableSettings = null;
            };

            GS.AM.sendChat = function (text) {
                var msg = {
                    text: text,
                    matchid: GS.AM.state.offer.matchid
                };
                GS.AM.ws.sendMessage('SUBMIT_CHAT', msg);
            };


            GS.AM.acceptOffer = function (aoCallback) {
                var msg = {matchid: GS.AM.state.offer.matchid};

                // Close the Create Table dialog if it's open
                var detv = mtgRoom.views.ClassicRoomsEditTable;
                if (detv.isShow) {
                    detv.onClickCancel();
                }

                GS.AM.ws.sendMessage('ACCEPT_OFFER', msg, aoCallback);
            };

            GS.AM.unacceptOffer = function () {
                var msg = {matchid: GS.AM.state.offer.matchid};
                GS.AM.ws.sendMessage('UNACCEPT_OFFER', msg, function () {
                    GS.AM.state.offer = null;
                });
            };

            GS.AM.declineOffer = function () {
                var msg = {matchid: GS.AM.state.offer.matchid};
                GS.AM.ws.sendMessage('DECLINE_OFFER', msg, function () {
                    GS.AM.state.offer = null;
                });
            };

            GS.AM.gameCreated = function () {
                var msg = {game: GS.AM.state.game};
                GS.AM.ws.sendMessage('GAME_CREATED', msg);
            };

            GS.AM.gameStarted = function () {
                var msg = {matchid: null};
                if (GS.AM.state.game !== null) {
                    msg = {matchid: GS.AM.state.game.matchid};
                }
                if (GS.AM.state.game !== null) {
                    GS.AM.vpcounter = GS.AM.state.game.vpcounter;
                } else {
                    GS.AM.vpcounter = null;
                }
                GS.AM.ws.sendMessage('GAME_STARTED', msg);
                GS.AM.state = {seek: null, offer: null, game: null};
            };

            GS.AM.abortGame = function () {
                if (GS.AM.state.game.hasOwnProperty('matchid')) {
                    GS.AM.ws.sendMessage('CANCEL_GAME',
                            {matchid: GS.AM.state.game.matchid});
                }
            };

            /*
             * Send an auto-automatch request
             */
            sendAutoAutomatchSeekRequest = function () {
                GS.debug('Creating auto-automatch request');

                var tSettings = JSON.parse(GS.AM.mtgRoom.views.ClassicRoomsEditTable
                                             .retriveDOM().settings);
                GS.debug("Table Settings:");
                GS.debug(tSettings);

                // Cache table settings so that we build the same game if we
                // end up making an automatch in Casual or Unrated.
                GS.AM.tableSettings = tSettings;

                var tName = tSettings.name;
                var pCount = tSettings.seatsState.filter(function (s) {
                    return s;
                }).length;
                var rSystem = tSettings.ratingType;

                GS.AM.sendAutoAutomatchSeekRequestParams(tName, pCount, rSystem);
            };

            var rangeToRequirement = function (range, rSystem) {
                var out;
                if (range.difference !== undefined) {
                    out = {rclass: 'RelativeRating', props: {}};
                    out.propsjpts_lower = range.difference;
                    out.props.pts_higher = range.difference;
                } else {
                    out = {rclass: 'AbsoluteRating', props: {}};
                    out.props.min_pts = range.min !== undefined
                                             ? range.min : null;
                    out.props.max_pts = range.max !== undefined
                                             ? range.max : null;
                }
                out.props.rating_system = rSystem;
                return out;
            };

            GS.AM.sendAutoAutomatchSeekRequestParams = function (tName, pCount, rSystem) {
                GS.debug('tname: ' + tName);
                GS.debug('pcount: ' + pCount);
                GS.debug('rSystem: ' + rSystem);

                // Match title fragments like 5432+, 5k+, 5.4k+
                GS.debug('Reading rating range requirement');

                // TODO: use casual rating for casual/unrated games?
                var gokoRange = GS.parseProRange(tName);
                var isoRange = GS.parseIsoRange(tName);

                var vpcounter = null;
                if (tName.toLowerCase().indexOf('#vpon') >= 0) {
                    vpcounter = true;
                } else if (tName.toLowerCase().indexOf('#vpoff') >= 0) {
                    vpcounter = false;
                }

                // Do not automatch if looking for a particular opponent
                var m = tName.toLowerCase().match(/for\s*\S*/);
                if (m !== null) {
                    GS.debug('Table is for a specific opp; no automatch');
                } else {
                    var np, rs, vp, rGoko, rIso;

                    np = {rclass: 'NumPlayers', props: {}};
                    np.props.min_players = pCount;
                    np.props.max_players = pCount;

                    rs = {rclass: 'RatingSystem', props: {}};
                    rs.props.rating_system = rSystem;

                    vp = {rclass: 'VPCounter', props: {}};
                    vp.props.vpcounter = vpcounter;

                    rGoko = rangeToRequirement(gokoRange, rSystem);
                    rIso = rangeToRequirement(isoRange, 'isotropish');

                    // Send seek request
                    var seek = {
                        player: GS.AM.player,
                        requirements: [np, rs, vp, rGoko, rIso]
                    };
                    GS.debug(seek);

                    // TODO: wait for seek canceled confirmation
                    if (GS.AM.state.seek !== null) {
                        GS.AM.cancelSeek(GS.AM.state.seek);
                    }

                    GS.debug('Sending auto-automatch request');
                    GS.AM.submitSeek(seek);
                }
            };

            /*
             * Automated hosting/joining using the Goko FS framework
             */

            createAutomatchGame = function (callback) {
                var oppnames, ratingSystem, vpcounter, listenJoin, listenCreate;

                oppnames = GS.AM.state.game.seeks.map(function (seek) {
                    return seek.player.pname;
                }).filter(function (pname) {
                    return pname !== GS.AM.player.pname;
                });
                ratingSystem = GS.AM.state.game.rating_system;

                vpcounter = GS.AM.state.game.vpcounter;

                // Handle join requests automatically
                enableAutoAccept(oppnames);

                // !!! Hideous code follows !!!
                // TODO: clean up the flow of execution
                // TODO: do we really have to bind to all table changes in the room?

                // 3. Wait for all opponents to join
                listenJoin = function () {
                    var tableModel = GS.AM.zch.currentTable;
                    if (tableModel !== null &&
                            tableModel.get('joined').length === oppnames.length + 1) {

                        // Notify user when all opponents have joined
                        GS.AM.gokoconn.unbind(GS.AM.TABLE_STATE, listenJoin);
                        GS.debug('All opponents have joined. Automatch complete.');
                        disableAutoAccept();
                        GS.AM.showGamePop(false);
                    }
                };

                // 2. Notify Automatch server; listen for joins
                listenCreate = function () {
                    var tableModel = GS.AM.zch.currentTable;
                    if (tableModel !== null) {
                        GS.AM.gokoconn.unbind(GS.AM.TABLE_STATE, listenCreate);
                        GS.AM.gokoconn.bind(GS.AM.TABLE_STATE, listenJoin);
                        callback(tableModel.get('number'));
                    }
                };

                // 1. Create a new game table; listen for its creation
                GS.AM.gokoconn.bind(GS.AM.TABLE_STATE, listenCreate);
                createTable(oppnames, ratingSystem, vpcounter);
            };

            disableAutoAccept = function () {
                var reqView = GS.AM.mtgRoom.views.ClassicRoomsPermit;
                if (reqView.showByRequest_orig !== undefined) {
                    reqView.showByRequest = reqView.showByRequest_orig;
                }
            };

            enableAutoAccept = function (oppnames) {
                var reqView = GS.AM.mtgRoom.views.ClassicRoomsPermit;
                reqView.showByRequest_orig = reqView.showByRequest;
                reqView.showByRequest = function (request) {
                    var joinerName, isAutomatchOpp;
                    // var opts;

                    joinerName = GS.AM.mtgRoom.playerList
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

            createTable = function (opps, ratingSystem, vpcounter) {
                // Leave current table first, if any
                if (GS.AM.zch.hasOwnProperty('currentTable')
                        && GS.AM.zch.currentTable !== null) {
                    GS.AM.zch.leaveTable(GS.AM.zch.currentTable);
                }

                var seatsState, tSettings, tOpts;
                // var tKingdom;
                seatsState = [1, 2, 3, 4, 5, 6].map(function (i) {
                    return (i <= opps.length + 1);
                });


                if (GS.AM.tableSettings !== null) {
                    // Use cached settings if available
                    tSettings = GS.AM.tableSettings;
                    tSettings.name = 'For ' + opps.join(', ');
                    if (vpcounter !== null) {
                        tSettings.name += ' ' + (vpcounter ? '#VPON' : '#VPOFF');
                    }
                    tOpts = {settings: JSON.stringify(tSettings),
                             isLock: false,
                             isRequestJoin: true,
                             isRequestSit: false,
                             tableIndex: null};
                    GS.AM.zch.createTable(tOpts);

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
                        GS.AM.zch.createTable(tOpts);
                    });
                }
            };

            GS.debug('Automatch script loaded.');
            initAutomatch();
        };

        // Don't loop-wait for dependencies. Listen for room join events instead.
        var alreadyLoaded = false;
        GS.alsoDo(FS.EventDispatcher, 'trigger', null, function (msg, evt) {
            if (msg === 'gatewayConnect' && !alreadyLoaded) {
                try {
                    var mtgRoom = window.mtgRoom;
                    var conn = mtgRoom.conn;
                    var zch = mtgRoom.helpers.ZoneClassicHelper;
                    if (conn !== undefined && zch !== undefined) {
                        alreadyLoaded = true;
                        console.log('Not already loaded Automatch');
                        loadAutomatchModule();
                    }
                } catch (ignore) {}
            }
        });
    };
}());
