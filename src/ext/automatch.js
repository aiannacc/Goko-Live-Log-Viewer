// To be executed in Goko's namespace
var loadAutomatchExtension = function () {

    // Automatch namespace
    if (typeof AM === 'undefined') {
       AM = {};
    };

    // Goko constants
    AM.ENTER_LOBBY = "gatewayConnect";
    AM.GAME_START = "gameServerHello";
    AM.TABLE_STATE = "tableState";
    AM.CASUAL_SYS_ID = '4fd6356ce0f90b12ebb0ff3a';
    AM.PRO_SYS_ID = '501726b67af16c2af2fc9c54';

    // TODO: get testing param from extension options
    AM.testing = false;

    // Automatch initialization requires the Goko websocket FS.Connection.
    // Hijack Goko event dispatching to get it.
    AM.initialized = false;
    FS.Connection.prototype.trigger_old = FS.Connection.prototype.trigger;
    FS.Connection.prototype.trigger = function () {

        // Initialize Automatch with Goko's FS.Connection object
        if (!AM.initialized) {
            AM.initialized = true;
            AM.initialize()
        }

        // Log Connection events in test environment
        //AM.testing && console.log(arguments);

        // Invoke normal Goko event dispatching
        FS.Connection.prototype.trigger_old.apply(this, arguments);
    };

    // Should only be called after Goko's connection and mtgRoom objects exist
    AM.initialize = function (gokoconn) {
        AM.testing && console.log('Initializing Automatch');

        // Automatch status (seeking, received offer, game announced)
        AM.state = {seek: null, offer: null, game: null};

        // Cache Goko connection and ZoneClassicHelper
        // NOTE: We know where Goko keeps these objects, but let's not depend
        //       on that in more places in the code than necessary.
        AM.gokoconn = window.mtgRoom.conn;
        AM.zch = window.mtgRoom.helpers.ZoneClassicHelper;

        // Get goko player info
        AM.player = {pname: AM.gokoconn.connInfo.playerName, 
                     pid: AM.gokoconn.connInfo.playerId,
                     kind: AM.gokoconn.connInfo.kind,
                     rating: {},
                     sets_owned: null};
        AM.fetchOwnRatings();   // (async)
        AM.fetchOwnSets();      // (async)

        // Connect to automatch server via websocket (async)
        AM.url = ['wss://gokologs.drunkensailor.org',
                   (AM.testing ? ':8080' : ''),
                   '/automatch?pname=', AM.player.pname].join('');
        AM.testing && console.log('Automatch server: ' + AM.url);
        AM.connectToAutomatchServer();

        // Create automatch popup dialogs
        AM.appendSeekPopup($('#viewport'));
        AM.appendOfferPopup($('#viewport'));
        AM.appendGamePopup($('#viewport'));

        // Wait for the Lobby Menu to be created, then replace the
        // "Play Now" button with "Automatch" button.
        AM.addAutomatchButtonWhenPossible();

        // Notify server to stop automatching on game start
        AM.gokoconn.bind(AM.GAME_START, function () {
            AM.testing && console.log('Game started');
            AM.sendMessage('GAME_STARTED', {game: AM.state.game});
            AM.state = {seek: null, offer: null, game: null};
        });

        // Refresh player's rating info after games
        // TODO: stop refreshing on room changes.
        AM.gokoconn.bind(FS.MeetingRoomEvents.MEETING_ROOM.GATEWAY_CONNECT, AM.fetchOwnRatings);
    };

    AM.addAutomatchButtonWhenPossible = function () {
        var intvl = setInterval(function () {
            if ($('.room-section-header-buttons').length === 1) {
                clearInterval(intvl);
                AM.testing && console.log("Replacing Play Now with Automatch");
            
                // Replace "Play Now" button with "Automatch" button
                $('.room-section-header-buttons').append(
                    $('<button id="automatchButton"></button>')
                        .addClass('fs-mtrm-text-border')
                        .addClass('fs-mtrm-dominion-btn')
                        .html('Automatch'));
    
                $('#automatchButton').click(function() {
                    console.log('AM Button clicked');
                    AM.showSeekPop(true);
                });
    
                $('.room-section-btn-find-table').remove();
            }
        },500);
    }

    // Request Goko casual and pro ratings (async)
    AM.fetchOwnRatings = function () {
        AM.player.rating = {}
        
        if (AM.player.kind === 'guest') {
            // TODO: look up guest ratings correctly
            AM.player.rating.goko_casual_rating = 1000;
            AM.player.rating.goko_pro_rating = 1000;
        } else {
                        
            // Asynchronously get casual rating
            AM.gokoconn.getRating({
                playerId: AM.player.pid,
                ratingSystemId: AM.CASUAL_SYS_ID
            }, function(resp) {
                AM.player.rating.goko_casual_rating = resp.data.rating;
            });

            // Asynchronously get pro rating
            AM.gokoconn.getRating({
                playerId: AM.player.pid,
                ratingSystemId: AM.PRO_SYS_ID
            }, function(resp) {
                AM.player.rating.goko_pro_rating = resp.data.rating;
            });
        }
    };

    // Request which card sets we own (async)
    AM.fetchOwnSets = function (player) {
        if (AM.player.kind === "guest") {
            // Guests only have Base. No need to check.
            AM.player.sets_owned = ['Base'];
        } else {
            var cardsToSets = {
                Cellar: 'Base',
                Coppersmith: 'Intrigue 1',
                Baron: 'Intrigue 2',
                Ambassador: 'Seaside 1',
                Explorer: 'Seaside 2',
                Apothecardy: 'Alchemy',
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

            /*
             *  Goko Developer #1: "C'mon... how often are you going to need
             *  to look up what cards a player owns? Let's nest it 3 
             *  asynchronous callbacks deep."
             *  
             *  Goko Developer #2: "No, that's bad design. Put it 4 deep."
             */

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
                    });
                });
            });
        };
    };

    AM.connectToAutomatchServer = function () {

        // Open connection asynchronously
        AM.ws = new WebSocket(AM.url);

        // If connection is lost, wait 3 second and reconnect
        // TODO: detect timeouts
        // TODO: notify player of disconnect
        AM.ws.onclose = function () {
            AM.testing && console.log('Lost contact with Automatch server. Reconnecting');
            AM.ws = null;
            setTimeout(AM.connectToAutomatchServer, 3000);
        };

        // Messages from server
        AM.ws.onmessage = function (evt) {
            var msg = JSON.parse(evt.data);

            AM.testing && console.log('Received ' + msg.msgtype + ' message from automatch server:');
            AM.testing && console.log(msg.message);
            
            switch(msg.msgtype) {
                case 'CONFIRM_RECEIPT':
                    AM.confirmReceipt(msg.message);
                    break;
                case 'CONFIRM_SEEK':
                    AM.confirmSeek(msg.message);
                    break;
                case 'OFFER_MATCH':
                    AM.offerMatch(msg.message);
                    break;
                case 'RESCIND_OFFER':
                    AM.rescindOffer(msg.message);
                    break;
                case 'ANNOUNCE_GAME':
                    AM.announceGame(msg.message);
                    break;
                case 'UNANNOUNCE_GAME':
                    AM.unannounceGame(msg.message);
                    break;
                default:
                    throw 'Received unknown message type: ' + msg.msgtype;
            }
        };

        // Wrap websocket send() method
        AM.sendMessage = function (msgtype, msg, callback) {
            var msgid = AM.player.pname + Date.now();
            var msgObj = {msgtype: msgtype,
                           message: msg,
                           msgid: msgid};
            var msgStr = JSON.stringify(msgObj);

            AM.ws.callbacks[msgid] = callback;
            AM.ws.send(msgStr);

            AM.testing && console.log('Sent ' + msgtype + ' message to server:');
            AM.testing && console.log(msgObj);
        };

        // Callbacks to be run when server confirms msgid received
        AM.ws.callbacks = {};
    };


    /*
     * Functions invoked by messages from the Automatch server
     */

    // Invoke the callback registered to this message's id, if any.
    AM.confirmReceipt = function (msg) {
        AM.testing && console.log('Receipt of message confirmed: ' + msg.msgid);
        var callback = AM.ws.callbacks[msg.msgid];
        if (typeof callback !== 'undefined' && callback !== null) {
            AM.testing && console.log(callback);
            callback();
        }
    };

    AM.confirmSeek = function (msg) {
        AM.state.seek = msg.seek;
    };

    AM.offerMatch = function (msg) {
        AM.state.seek = null;
        AM.state.offer = msg.offer;
        AM.showOfferPop(true);
    };

    AM.rescindOffer = function (msg) {
        AM.state.offer = null;
        // TODO: handle this in a more UI-consistent way
        AM.showOfferPop(false);
        alert('Automatch offer was rescinded:\n' + msg.reason);
    };

    AM.announceGame = function (msg) {
        AM.state.offer = null;
        AM.state.game = msg.game;

        // Show game announcement dialog
        AM.showOfferPop(false);
        AM.showGamePop(true);

        // On entering lobby: create game if host, join if guest
        if (AM.state.game.hostname === AM.player.pname) {
            AM.gokoconn.bind(AM.ENTER_LOBBY, AM.hostAutomatchGame);
        } else {
            AM.gokoconn.bind(AM.ENTER_LOBBY, AM.joinAutomatchGame);
        }

        // Go to lobby for automatch game (async)
        var roomId = AM.getRoom(AM.state.game.roomname).get('roomId');
        AM.zch.changeRoom(roomId);
    };

    AM.hostAutomatchGame = function () {
        AM.testing && console.log('Creating automatch game')
        var opps = AM.getOppnames(AM.state.game, AM.player.pname);

        // Create the game (async)
        AM.createGame(opps, AM.state.game.rating_system);

        // Accept opp's join request automatically. Reject others.
        AM.setAutoaccept(true, opps);

        // Listen for all players to join
        // Note: Goko doesn't actually send a "player joined" event, so 
        //       we can't listen for those. Instead we get the whole lobby's
        //       table state changes.
        AM.gokoconn.bind(AM.TABLE_STATE, function() {
            var game = AM.getGameOwnedBy(AM.player.pname);
            if (typeof game !== 'undefined' 
                && game.get('joined').length === opps.length + 1) {
                    AM.gokoconn.unbind(AM.TABLE_STATE, arguments.callee);
                    AM.testing && console.log('All opponents have joined');
                    AM.testing && console.log('Automatch complete.');
                    AM.showGamePop(false);
                    AM.setAutoaccept(false); // Restore default join request dialog
            }
        });
    };

    // 
    AM.joinAutomatchGame = function () {

        // Whether the hosted game exists and is ready for us to join
        var getAMTableIfReady = function() {
            var g = AM.getGameOwnedBy(AM.state.game.hostname);
            console.log(g);
            if (typeof g === 'undefined') {
                AM.testing && console.log('No AM table yet');
                return null;
            } else if (g.get('requestJoin') !== true) {
                AM.testing && console.log('AM table exists but not configured yet');
                return null;
            } else {
                AM.testing && console.log('AM table ready. Joining');
                return g;
            }
        }

        // Check once, then 
        var game = getAMTableIfReady();
        if (game !== null) {
            AM.testing && console.log('AM table was ready on first try. Joining.');
            AM.joinGame(game);
            AM.showGamePop(false);
        } else {
            AM.testing && console.log('AM table was not ready. Binding to tableState events');
            AM.gokoconn.bind(AM.TABLE_STATE, function() {
                var game = getAMTableIfReady();
                if (game !== null) {
                    AM.testing && console.log('AM table was finally ready.'
                        + 'Unbinding from tableState events and joining.');
                    AM.joinGame(game);
                    AM.showGamePop(false);
                    AM.gokoconn.unbind(AM.TABLE_STATE, arguments.callee);
                }
            });
        }
    };

    // TODO: deal with possibility that unannounce arrives before announce
    AM.unannounceGame = function (msg) {
        AM.state.game = null;
        AM.state.reason = msg.reason;
    };

    AM.testing && console.log('Automatch script loaded.');
};

// Execute our code in Goko's JS context by appending it to the document
var script = document.createElement('script');
script.textContent = '(' + loadAutomatchExtension + ')();';
document.body.appendChild(script);
