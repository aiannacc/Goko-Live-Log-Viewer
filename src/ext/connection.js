/*jslint browser: true, devel: true, indent: 4, maxlen: 90, es5: true, vars:true, nomen:true */
/*global $, _, WebSocket, GS, mtgRoom */

// Create a single WebSocket connection to gokosalvager.com
//
// I plan to use this connection for all client-server communication, including:
// - automatch
// - Salvager's settings
// - challenges
// - veto mode
// - vp counter toggling
// - in-game chat (maybe)

(function () {
    "use strict";

    var startPingLoop, handleDisconnect, handleOpen, handleMessage, connectToGS;

    var mod = GS.modules.wsConnection = new GS.Module('WS Connection');
    mod.dependencies = [
        'GS',
        'mtgRoom.conn.connInfo.playerId',
        'mtgRoom.conn.connInfo.playerName',
        'mtgRoom.conn.connInfo.playerPoolId'
    ];
    mod.load = function () {
        connectToGS();
        startPingLoop();
    };

    // Constants
    GS.wsdomain = 'gokosalvager.com';
    mod.port = GS.get_option('testmode') ? 7889 : 8889;
    mod.url = "wss://" + GS.wsdomain + ":" + mod.port + "/gs/websocket";

    // Status
    mod.lastPingTime = new Date();
    mod.msgcount = 0;
    mod.registered = false;

    // Listeners/Callbacks
    mod.promises = {};
    mod.connListeners = [];
    mod.msgListeners = {};

    // Attempt to connect to the GokoSalvager server
    connectToGS = function () {
        console.log('Connecting to ' + GS.wsdomain + ' via WebSocket.');
        mod.ws = new WebSocket(mod.url);
        mod.ws.onopen = handleOpen;
        mod.ws.onclose = handleDisconnect;
        mod.ws.onmessage = handleMessage;
    };

    handleOpen = function () {
        console.log('WS connection to ' + GS.wsdomain + ' opened.');

        // Send browser, salvager, and player information to server
        GS.sendWSMessage('CLIENT_INFO', {
            playerName: mtgRoom.conn.connInfo.playerName,
            playerId: mtgRoom.conn.connInfo.playerId,
            gsversion: GS.version,
            browser: GS.getBrowser()
        }).then(function (resp) {
            console.info('Registered client with ' + GS.wsdomain, resp);
            mod.registered = true;
            _.each(mod.connListeners, function (cb) { cb(); });
        });
    };

    handleMessage = function (evt) {
        var d = JSON.parse(evt.data);
        var m = d.message;

        mod.lastPingTime = new Date();
        console.log(JSON.parse(evt.data));

        if (d.msgtype === 'RESPONSE') {
            // Server responded to a client message.
            // Fulfill and remove the corresponding Promise.
            if (m.hasOwnProperty('error')) {
                mod.promises[m.queryid].reject.call(undefined, m.error);
            } else {
                mod.promises[m.queryid].resolve.call(undefined, m);
                delete mod.promises[m.queryid];
            }

        } else {
            // Server initiated message.  Notify any listeners.
            var callbacks = mod.msgListeners[d.msgtype];
            if (typeof callbacks !== 'undefined') {
                _.each(callbacks, function (cb) { cb(m); });
            }
        }
    };

    // Other modules use this method to talk to the server
    GS.sendWSMessage = function (msgtype, msg) {
        mod.msgcount += 1;
        var msgid = 'msg' + mod.msgcount;
        var msgJSON = JSON.stringify({
            msgtype: msgtype,
            message: msg,
            msgid: msgid
        });
        console.info('Sending message', msgJSON);
        return new Promise(function(resolve, reject) {
            mod.promises[msgid] = {resolve: resolve, reject: reject};
            mod.ws.send(msgJSON);
        });
    };

    startPingLoop = function () {
        console.log('Starting to ping server');

        // ping server every 25 sec. Timeout if no responses for 180s.
        mod.lastPingTime = new Date();

        mod.pingLoop = setInterval(function () {
            if (new Date() - mod.lastPingTime > 180000 && mod.isConnReady()) {
                console.log('Connection to ' + GS.wsdomain + ' timed out.');
                clearInterval(mod.pingLoop);
                try {
                    mod.ws.close();
                } catch (e) {
                    console.log(e);
                }
            } else {
                GS.sendWSMessage('PING', {});
            }
        }, 25000);
    };

    handleDisconnect = function () {
        console.log('Connection to ' + GS.wsdomain + ' lost.');
        clearInterval(mod.pingLoop);

        // Wait 5 seconds and attempt to reconnect.
        console.log('Attempting reconnect to GS server.');
        setTimeout(function () {
            connectToGS();
        }, 5000);
    };

    mod.isConnReady = function () {
        return typeof mod.ws !== 'undefined' 
                && mod.ws.readyState === 1
                && mod.registered;
    }

    // Register callbacks to be invoked whenever we (re)connect.
    // Note: "connected" means server has received our user details.
    mod.listenForConnection = function (callback) {
        this.connListeners.push(callback);
    };

    // Register callbacks to receive specific message types.
    mod.listenForMessage = function (msgtype, callback) {
        if (typeof this.msgListeners[msgtype] === 'undefined') {
            this.msgListeners[msgtype] = [];
        }
        this.msgListeners[msgtype].push(callback);
    };

    GS.whenConnectionReady = new Promise(function(resolve, reject) {
        if (mod.isConnReady()) {
            resolve(); 
        } else {
            mod.listenForConnection(resolve);
        }
    });
}());
