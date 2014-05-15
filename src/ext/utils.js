(function () {
    "use strict";

    console.log('Loading Utils');

    GS.debug = function (text) {
        if (GS.get_option('debug_mode')) {
            console.log(text);
        }
    };

    GS.alsoDo = function (object, methodname, fnBefore, fnAfter) {

        // If we've already overridden this method, then override the
        // overriding method instead
        var methodname_o = '_' + methodname + '_orig';
        if (object.prototype.hasOwnProperty(methodname_o)) {
            return GS.alsoDo(object, methodname_o, fnBefore, fnAfter);
        }

        // Cache original method
        object.prototype[methodname_o] = object.prototype[methodname];

        // Replace original method with a method sandwich
        object.prototype[methodname] = function () {

            // Run fnBefore
            if (fnBefore !== undefined && fnBefore !== null) {
                fnBefore.apply(this, arguments);
            }

            // Run the original method
            var out = this[methodname_o].apply(this, arguments);

            // Run fnAfter
            if (fnAfter !== undefined && fnAfter !== null) {
                fnAfter.apply(this, arguments);
            }

            // Return the result of the original method
            return out;
        };
    };

    GS.getTableName = function () {
        try {
            return JSON.parse(mtgRoom.getCurrentTable().get('settings')).name;
        } catch (e) {
            return null;
        }
    };

    GS.getMyName = function () {
        return mtgRoom.localPlayer.get('playerName');
    };

    GS.getGameClient = function () {
        if (mtgRoom !== undefined) {
            var roomId;
            if (mtgRoom.getCurrentTable() !== null) {
                roomId = mtgRoom.getCurrentTable().get('room').get('roomId');
            } else {
                roomId = mtgRoom.currentRoomId;
            }

            if (roomId === undefined || roomId === null) {
                throw 'Could not determine room id';
            }
            var table = mtgRoom.getCurrentTable();
            var tableNo = table !== null ? table.get('number') : 0;
            var key = roomId + ':' + tableNo;
            return mtgRoom.games[key];
        }
        throw 'Meeting Room undefined';
    };

    GS.sendRoomChat = function (message, nocheck) {
        if (GS.vp.toggle !== undefined
                && GS.vp.toggle.isChatCommand(message)
                && (nocheck === undefined || !nocheck)) {
            GS.vp.toggle.handleChatCommand(message);
        } else {
            var gc = GS.getGameClient();
            gc.clientConnection.send('sendChat', {text: message});
        }
    };

    // Show a message in my chat box without sending
    GS.showRoomChat = function (message) {
        var gc = GS.getGameClient();
        gc.clientConnection.trigger("addChat", {
            playerName: '**',
            text: message
        });
    };

    GS.getBrowser = function () {
        var out;
        if (navigator.appVersion.search('Chrome') !== -1) {
            out = 'Chrome';
        } else if (navigator.appVersion.search('Safari') !== -1) {
            out = 'Safari';
        } else {
            out = 'Firefox';
        }
        return out;
    };

    GS.salvagerIconURL = 'http://gokologs.drunkensailor.org/static/img/salvager128.png';
    GS.url = 'www.gokosalvager.com';

    // Parse numbers like 303 and 4.23k
    // Fail noisily if unparseable strings get here
    GS.parseNum = function (str) {
        var m = str.match(/^([0-9.]+)([kK]?)$/);
        return Math.floor(parseFloat(m[1]) * (m[2] !== '' ? 1000 : 1));
    };

    // Parse Goko Pro rating ranges that can be used in game titles
    // Valid forms are like X+, Y-, X-Y, +/-R,
    //   where X,Y,R are numbers like 4000 or 4k or 4.00k
    // Only the first expression encountered will be parsed
    // Precedence: +/- > range > min thresh > max thresh
    GS.parseProRange = function (tablename) {
        var m, range = {};

        if ((m = tablename.match(/^(.* |)(\d+(.\d+)?([kK])?)\+/)) !== null) {
            range.min = GS.parseNum(m[2]);
        } else if ((m = tablename.match(/^(.* |)(\d+(.\d+)?([kK])?)-(\d+(.\d+)?([kK])?)/)) !== null) {
            range.min = GS.parseNum(m[2]);
            range.max = GS.parseNum(m[5]);
        } else if ((m = tablename.match(/^(.* |)(\d+(.\d+)?([kK])?)\-/)) !== null) {
            range.max = GS.parseNum(m[2]);
        } else if ((m = tablename.match(/^(.* |)\+\/\-(\d+(.\d+)?([kK])?)/)) !== null) {
            range.difference = GS.parseNum(m[2]);
        }
        return range;
    };

    // For Isotropish ranges, valid forms must have an "L" in front.
    // The regex syntax is otherwise identical
    GS.parseIsoRange = function (tablename) {
        var m = tablename.match(/L(\S*)/);
        return m === null ? GS.parseProRange('') : GS.parseProRange(m[1]);
    };

    // load templates from the generated templates.js
    GS.template = function (templateName, options) {
      try {
          return window.JST[templateName](options);
      } catch (e) {
          GS.debug('Template not found: ' + templateName);
          return '';
      }
    };

    GS.getIsoLevel = function (id, defaultValue) {
        var cache = GS.isoLevelCache,
            level = defaultValue;

        if (cache !== undefined && cache.hasOwnProperty(id)) {
            level = GS.isoLevelCache[id];
        }

        return level;
    };

    // first bind to gameServerHello so an instance of DominionClient is
    // available, make sure it's bound to the client associated with the current
    // game
    //
    // TODO: test this with multiple tabs starting different games in the same
    // browser
    GS.whenGameClientReady = function (callback) {
        mtgRoom.conn.bind('gameServerHello', function (msg) {
            var gameClient = _.find(mtgRoom.games, function (game) {
                return game.gameAddress === msg.data.gameServerAddress;
            }, this);
            callback(gameClient);
        });
    };


}());
