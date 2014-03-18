/*jslint browser: true, devel: true, indent: 4, vars: true, nomen: true, regexp: true, forin: true, white:true */
/*global $, _, FS, GS, mtgRoom */

(function () {
    "use strict";

    var mod = GS.modules.state = new GS.Module('state');
    mod.dependencies = [
        'mtgRoom'
    ];
    mod.load = function () {
        var setConnection, setConnection2, updateRoom, nullRoom, onGameJoin,
            onGameSetup, onUpdateGameState, onGameOver, resetGameState;

        GS.state = {
            gconn: null,      // Main Goko WebSocket connection
            playerId: null,
            playerName: null,
            sessionId: null,
            roomId: null,
            roomName: null,
            roomChangeCallbacks: []
        };

        resetGameState = function () {
            GS.state.game = {
                cconn: null,      // Game-specific WebSocket client connection
                client: null,     // Game client
                turn: null,
                phase: null,
                firstPlayer: null,
                playerToAct: null,
                players: null
            };
        };
        resetGameState();

        // For other modules to request room change notifications
        GS.state.addRoomChangeCallback = function (callback) {
            GS.state.roomChangeCallbacks.push(callback);
        };

        // Update our reference and event notifications.
        setConnection = function(gokoconn) {
            // Wait until Goko finishes preparing the connection object
            var intvl = setInterval(function () {
                if (_.keys(gokoconn.eventCallbacks).length === 36) {
                    clearInterval(intvl);
                    setConnection2(gokoconn);
                }
            }, 10);
        };

        setConnection2 = function(gokoconn) {

            console.log('setting new connection');
            GS.state.gconn = gokoconn;

            // These can always be fished out of the Connection object, but it's
            // convenient not to have to remember where Goko keeps them.
            GS.state.playerId = gokoconn.connInfo.playerId;
            GS.state.playerName = gokoconn.connInfo.playerName;
            GS.state.sessionId = gokoconn.connInfo.sessionId;

            // Update event notifications when Connection object changes
            gokoconn.bind('gatewayConnect', updateRoom);
            gokoconn.bind('gatewayDisconnect', nullRoom);

            // When starting a game
            gokoconn.bind('gameServerHello', onGameJoin);
            
            // TODO: Other noteworthy events
            //gokoconn.bind('roomChat', );         // Game or lobby chat
            //gokoconn.bind('roomStatus', );       // Someone enters <?>
            //gokoconn.bind('getInventoryList', ); // Queried for inventory ID
 
            // Log all MeetingRoom events
            // TODO: disable after testing
            _.keys(mtgRoom.eventCallbacks).map(function (k) {
                mtgRoom.bind(k, function() {
                    console.info('MeetingRoom: ' + k, arguments);
                });
            });

            // Log all Connection events
            // TODO: disable after testing
            _.keys(GS.state.gconn.eventCallbacks).map(function (k) {
                GS.state.gconn.bind(k, function() {
                    console.info('GokoConn: ' + k, arguments);
                });
            });
        };

        onGameJoin = function (msg) {
            //var table = mtgRoom.getCurrentTable();
            //var tableNo = table !== null ? table.get('number') : 0;
            var key = msg.data.roomId + ':' + msg.data.table;
            console.log(key);
            GS.state.game.client = mtgRoom.games[key];
            GS.state.game.cconn = GS.state.game.client.clientConnection;

            // Log all ClientConnection events
            // TODO: disable after testing
            _.keys(GS.state.game.cconn._callbacks).map(function (k) {
                GS.state.game.cconn.bind(k, function() {
                    console.info('ClientConn: ' + k, arguments);
                });
            });

            // TODO: Notable events
            //GS.state.cconn.bind('addChat');
            //GS.state.cconn.bind('addLog');

            GS.state.game.cconn.bind('gameOver', onGameOver);
            GS.state.game.cconn.bind('gameSetup', onGameSetup);
            GS.state.game.cconn.bind('updateState', onUpdateGameState);
        };

        onGameSetup = function (gameData, client) {
            GS.state.game.gameData = gameData;

            GS.state.game.players = [];
            _.each(GS.state.game.players, function (p) {
                GS.state.game.players[p.playerIndex] = {
                    playerId: p.playerId,
                    playerName: p.playerName,
                    isBot: _.isObject(p.bot) && p.bot
                };
            });

            //_.pluck(gameData.playerInfos, 'name'),
            //gameData.playerInfos.map(function (pinfo) {
            //    return pinfo.hasOwnProperty('bot') && pinfo.bot;
            //})
        };

        onGameOver = function () {
            resetGameState();
        };

        onUpdateGameState = function (state) {
            if (!_.isObject(GS.state.game.firstPlayer)) {
                GS.state.game.firstPlayer = state.playerToMove;
                GS.state.game.turn = 1;
            } else if (state.playerToMove === GS.state.game.firstPlayer
                    && state.playerToMove !== GS.state.game.playerToAct) {
                // TODO: Does this handle Outpost and Possession correctly?
                GS.state.game.turn += 1;
            }
            GS.state.game.playerToAct = state.playerToMove;
            GS.state.game.phase = state.dominionPhase;
        };

        // When user leaves a lobby
        nullRoom = function (msg) {
            GS.state.roomId = null;
            GS.state.roomName = null;
            _.each(GS.state.roomChangeCallbacks, function(cb) { cb(); });
        };

        // When user enters a lobby
        updateRoom = function (msg) {
            GS.state.roomId = GS.state.gconn.options.roomId;
            GS.state.roomName = mtgRoom.getRoomList()
                                       .findByRoomId(GS.state.roomId)
                                       .get('name');
            _.each(GS.state.roomChangeCallbacks, function(cb) { cb(); });
        };

        // Maintain a reference to Goko's primary WebSocket connection.
        // Update it whenever Goko (re)connects.
        GS.alsoDo(FS.Utils.ConnectionMaker, 'getConnection', null, function() {
            setConnection(this.conn);
        });

        // Cache Goko's current WebSocket connection, if any
        if (_.isObject(window.conn)) {
            setConnection(window.conn);
        } else if (_.isObject(mtgRoom.conn)) {
            setConnection(mtgRoom.conn);
        }
    };
}());
