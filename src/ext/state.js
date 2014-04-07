/*jslint browser: true, devel: true, indent: 4, vars: true, nomen: true, regexp: true, forin: true */
/*global $, _, FS, GS, mtgRoom */

// Uses the eventIntermediary module to keep track of the user's
// client's state (e.g. in lobby, playing game, etc).
//
(function () {
    "use strict";
    
    var resetState, resetGameState, createEventProducer, setConnection,
        setConnection2;

    var mod = GS.modules.state = new GS.Module('state');
    mod.dependencies = [
        'mtgRoom'
    ];
    mod.load = function () {
        //var updateRoom, nullRoom, onGameJoin,
        //    onGameSetup, onUpdateGameState, onGameOver, resetGameState,
        //    onOppExit;

        //resetState();

        //onGameJoin = function (msg) {
        //    var key = msg.data.roomId + ':' + msg.data.table;
        //    GS.state.game.client = mtgRoom.games[key];
        //    GS.state.game.cconn = GS.state.game.client.clientConnection;

        //    // TODO: Notable events
        //    GS.state.game.cconn.bind('gameOver', onGameOver);
        //    GS.state.game.cconn.bind('gameSetup', onGameSetup);
        //    GS.state.game.cconn.bind('updateState', onUpdateGameState);
        //};

        //onOppExit = function (msg, data) {
        //    var pname = data.player.get('player').get('playerName');
        //    console.info('Player Exit', data.player.get('player'));
        //};

        //onGameSetup = function (gameData, client) {
        //    GS.state.game.gameData = gameData;

        //    GS.state.game.players = [];
        //    GS.state.game.playerInfos = gameData.playerInfos;
        //    _.each(gameData.playerInfos, function (p) {
        //        GS.state.game.players[p.playerIndex] = {
        //            playerId: p.playerId,
        //            playerName: p.name,
        //            isBot: p.hasOwnProperty('bot') && p.bot
        //        };
        //    });
        //};

        //onGameOver = function () {
        //    resetGameState();
        //};

        //onUpdateGameState = function (state) {
        //    if (!_.isObject(GS.state.game.firstPlayer)) {
        //        GS.state.game.firstPlayer = state.playerToMove;
        //        GS.state.game.turn = 1;
        //    } else if (state.playerToMove === GS.state.game.firstPlayer
        //            && state.playerToMove !== GS.state.game.playerToAct) {
        //        // TODO: Does this handle Outpost and Possession correctly?
        //        GS.state.game.turn += 1;
        //    }
        //    GS.state.game.playerToAct = state.playerToMove;
        //    GS.state.game.phase = state.dominionPhase;
        //};

        //// When user leaves a lobby
        //nullRoom = function (msg) {
        //    GS.state.roomId = null;
        //    GS.state.roomName = null;
        //    _.each(GS.state.roomChangeCallbacks, function (cb) { cb(); });
        //};

        //// When user enters a lobby
        //updateRoom = function (msg) {
        //    GS.state.roomId = GS.state.gconn.options.roomId;
        //    GS.state.roomName = mtgRoom.getRoomList()
        //                               .findByRoomId(GS.state.roomId)
        //                               .get('name');
        //    _.each(GS.state.roomChangeCallbacks, function (cb) { cb(); });
        //};
    };

    resetState = function () {
        GS.state = {
            gconn: null,      // Main Goko WebSocket connection
            playerId: null,
            playerName: null,
            sessionId: null,
            roomId: null,
            roomName: null,
            roomChangeCallbacks: []
        };
        resetGameState();
    };

    resetGameState = function () {
        GS.state.game = {
            cconn: null,       // Game-specific WebSocket client connection
            client: null,      // Game client
            turn: null,
            phase: null,
            firstPlayer: null,
            playerToAct: null,
            players: null
        };
    };
}());
