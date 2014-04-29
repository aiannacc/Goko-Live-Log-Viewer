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

    var mod = GS.modules.wsConnection = new GS.Module('WS Connection');
    mod.dependencies = [
        'GS',
        'mtgRoom.conn.connInfo.playerId',
        'mtgRoom.conn.connInfo.playerName',
        'mtgRoom.conn.connInfo.playerPoolId'
    ];
    mod.load = function () {

        var startPingLoop, handleDisconnect, updateWSIcon;

        console.log('Loading WS Connection module');

        // Connection variables
        GS.WS = {};
        GS.WS.domain = 'gokosalvager.com';
        GS.WS.port = 8889;  // TODO: Switch from port 8889 back to 443 after
                            //       server transition
        GS.WS.url = "wss://" + GS.WS.domain + ":" + GS.WS.port + "/gs/websocket";
        GS.WS.noreconnect = false;
        GS.WS.maxFails = 36;
        GS.WS.failCount = 0;
        GS.WS.lastPingTime = new Date();
        GS.WS.callbacks = {};
        GS.WS.clientInfoReceived = false;

        // Attempt to connect to the GokoSalvager server
        GS.WS.connectToGS = function () {
            GS.debug('Creating WebSocket connection to ' + GS.WS.domain);
            GS.WS.conn = new WebSocket(GS.WS.url);

            GS.WS.conn.onopen = function () {
                console.log('Connected to ' + GS.WS.domain);
                GS.WS.failCount = 0;
                updateWSIcon();
                startPingLoop();
            };

            GS.WS.conn.onclose = function () {
                console.log('Received onclose event on connection to ' + GS.WS.domain);
                handleDisconnect();
            };

            // Messages from server
            GS.WS.conn.onmessage = function (evt) {
                var d = JSON.parse(evt.data);
                var m = d.message;

                GS.WS.lastpingTime = new Date();

                switch (d.msgtype) {
                case 'REQUEST_CLIENT_INFO':
                    var info = {
                        playerName: mtgRoom.conn.connInfo.playerName,
                        playerId: mtgRoom.conn.connInfo.playerId,
                        gsversion: GS.version
                    };
                    GS.WS.sendMessage('CLIENT_INFO', info, function () {
                        GS.WS.clientInfoReceived = true;
                    });
                    break;
                case 'RESPONSE':
                    // Server response to client's request for information.
                    // Evaluate the callback the client registered, with the
                    // server's response as its argument.
                    var callback = GS.WS.callbacks[m.queryid];
                    if (callback !== undefined) {
                        if (callback !== null) {
                            callback(m);
                        }
                        delete GS.WS.callbacks[m.queryid];
                    }
                    break;
                case 'UPDATE_ISO_LEVELS':
                    _.each(m.new_levels, function (isoLevel, playerId) {
                        GS.isoLevelCache[playerId] = isoLevel;
                    });
                    // TODO: update HTML elements for these players, if they
                    //       happen to be in the same lobby as us
                    break;
                case 'UPDATE_AVATAR_INFO':
                    // TODO: implement
                    break;
                default:
                    throw 'Invalid server message type: ' + d.msgtype;
                }
            };
        };

        GS.WS.isConnReady = function () {
            return GS.WS.conn !== undefined
                && GS.WS.conn.readyState === 1
                && GS.WS.clientInfoReceived;
        };


        GS.WS.waitSendMessage = function (msgtype, msg, callback) {
            var waitInt = window.setInterval(function () {
                if (GS.WS.isConnReady()) {
                    window.clearInterval(waitInt);
                    GS.WS.sendMessage(msgtype, msg, callback);
                }
            }, 100);
        };

        // Convenience wrapper for websocket send() method.  Globally accessible.
        var msgcount = 0;
        GS.WS.sendMessage = function (msgtype, msg, smCallback) {

            var msgid, msgJSON;

            msgcount += 1;
            msgid = 'msg' + msgcount;
            msgJSON = JSON.stringify({
                msgtype: msgtype,
                message: msg,
                msgid: msgid
            });

            if (smCallback !== undefined && smCallback !== null) {
                GS.WS.callbacks[msgid] = smCallback;
            }

            try {
                GS.WS.conn.send(msgJSON);
            } catch (e) {
                console.log(e);
            }
        };

        startPingLoop = function () {
            // ping server every 25 sec. Timeout if no responses for 180s.
            GS.WS.lastpingTime = new Date();

            GS.WS.pingLoop = setInterval(function () {
                if (new Date() - GS.WS.lastpingTime > 180000) {
                    console.log('Connection to ' + GS.WS.domain + ' timed out.');
                    clearInterval(GS.WS.pingLoop);
                    try {
                        GS.WS.conn.close();
                    } catch (e) {
                        console.log(e);
                    }
                } else {
                    GS.WS.sendMessage('PING', {});
                }
            }, 25000);
        };

        updateWSIcon = function () {
            // TODO: inform the user that he's connected to the GokoSalvager server
            console.log('TODO: Update icon for status: ' + GS.WS.conn.readyState);
        };

        handleDisconnect = function () {
            // Update state
            GS.state = {seek: null, offer: null, game: null};
            GS.WS.failCount += 1;

            console.log('Connection to ' + GS.WS.domain + ' lost: '
                      + GS.WS.failCount + '/' + GS.WS.maxFails);

            // Update UI
            updateWSIcon();

            // Stop the ping cycle
            if (GS.WS.pingLoop !== undefined) {
                clearInterval(GS.WS.pingLoop);
            }

            // Wait 5 seconds and attempt to reconnect.
            if (GS.WS.noreconnect) {
                console.log('Auto-reconnect to GS server disabled.');
            } else if (GS.WS.failCount >= GS.WS.maxFails) {
                console.log('Max connection failures reached.');
            } else {
                console.log('Attempting reconnect to GS server.');
                setTimeout(function () {
                    GS.WS.connectToGS();
                }, 5000);
            }
        };

        GS.WS.connectToGS();
    };
}());
