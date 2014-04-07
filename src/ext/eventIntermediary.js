/*jslint browser: true, devel: true, indent: 4, vars: true, nomen: true, regexp: true, forin: true */
/*global $, _, FS, GS, mtgRoom */

// This module acts as an intermediary between Goko event producers and module
// event consumers.  This is better than listening to the Goko event producers
// directly because:
//
// 1. The Goko event producers change, which obliges the listener to track
//    these changes and rebind accordingly.
//
// 2. Some of the Goko events are ambiguous, which obliges the listener to
//    track the client's state in order to correctly interpret them. 
//
// Not all Goko events have been added here.
//
// Goko Event Producers:
// - primary FS.Connection (gconn) -- replaced at login (and on reconnect<?>)
// - game client Connection (cconn) -- replaced at game start
// - game client (client) -- replaced at game start
// - MeetingRoom (mtgRoom) -- never replaced<?>
//
// Event Name:                Producer:    Message:
// -----------                ---------    --------
// gameExitedOpp              mtgRoom      MeetingRoom:Game:ClientExit
//
// lobbyEntered               gconn        gatewayConnect
// lobbyExited                gconn        gatewayDisconnect
// lobbyChat                  gconn        roomChat
// gameChat                   gconn        roomChat
// gameJoined                 gconn        gameServerHello
// tableCreated               gconn        tableState
// tableJoined                gconn        tableState
// tableJoinedOpp             gconn        tableState
//
// gameStarted                cconn        gameSetup
// gameEnded                  cconn        gameOver
// gamePhaseChanged           cconn        updateState
// gameTurnChanged            cconn        updateState
//
// gameSetup                  client       incomingMessage:gameSetup
// logLineAdded               client       incomingMessage:addLog
//
// game might have ended<?>   client       incomingMessage -- see vptoggle.js
//
(function () {
    "use strict";

    var createEventIntermediary, setConnection, setConnection2, onGameJoin,
        remapEvent, fire, bindGokoConnEvents, bindClientEvents,
        bindMtgRoomEvents;

    var mod = GS.modules.eventIntermediary = new GS.Module('eventIntermediary');
    mod.dependencies = [
        'mtgRoom'
    ];
    mod.load = function () {
        createEventIntermediary();

        // Cache/update Goko's primary WebSocket connection.
        GS.alsoDo(FS.Utils.ConnectionMaker, 'getConnection', null, function () {
            setConnection(this.conn);
        });
        if (_.isObject(window.conn)) {
            setConnection(window.conn);
        } else if (_.isObject(mtgRoom.conn)) {
            setConnection(mtgRoom.conn);
        }
    };

    createEventIntermediary = function () {
        GS.eventIntermediary = {
            gokoConn: null,
            clientConn: null,
            client: null,
            callBacks: { },
            bind: function (eventName, callback) {
                if (!this.callBacks.hasOwnProperty(eventName)) {
                    this.callBacks[eventName] = [];
                }
                this.callBacks[eventName].push(callback);
            },
            fire: function (eventName) {
                _.each(eventName, function (callback) {
                    callback(arguments.slice(1));
                });
            }
        };
    };

    remapEvent = function (producer, oldEventName, newEventName) {
        producer.bind(oldEventName, function () {
            GS.eventIntermediary.produce(newEventName, arguments);
        });
    };

    // Update our reference and event notifications.
    setConnection = function (gokoConn) {
        // Wait until Goko finishes preparing the connection object
        var intvl = setInterval(function () {
            if (_.keys(gokoConn.eventCallbacks).length === 36) {
                clearInterval(intvl);
                setConnection2(gokoConn);
            }
        }, 10);
    };

    setConnection2 = function (gokoConn) {
        GS.eventIntermediary.gokoConn = gokoConn;

        // TODO: unbine from old gokoconn object <?>
        bindGokoConnEvents(gokoConn);

        //gokoConn.bind('gameServerHello', function (msg) {
        //    var key = msg.data.roomId + ':' + msg.data.table;
        //    GS.eventIntermediary.client = mtgRoom.games[key];
        //    GS.eventIntermediary.clientConn =
        //        GS.state.game.client.clientConnection;
        //});
    };

    // Simple wrapped for firing a named event
    fire = function (eventName) {
        GS.eventIntermediary.fire(eventName, arguments.slice(1));
    };

    bindGokoConnEvents = function (gc) {
        gc.bind('gatewayConnect', fire('lobbyEntered'));
        gc.bind('gatewayDisconnect', fire('lobbyExited'));
        gc.bind('gameServerHello', fire('gameJoined'));

        gc.bind('lobbyChat', function () {
            // TODO: Disambiguate chat types
            console.info('Event -- lobbyChat', arguments);
        });

        gc.bind('tableState', function () {
            // TODO: Disambiguate table creation, user joining, opp joining
            console.info('Event -- tableState', arguments);
        });
    };
}());
