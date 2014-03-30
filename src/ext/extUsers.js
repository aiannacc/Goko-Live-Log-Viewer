/*jslint browser: true, devel: true, indent: 4, vars: true, nomen: true, regexp: true, forin: true */
/*global $, _, GS, Goko, FS, mtgRoom */

(function () {
    "use strict";

    var mod = GS.modules.extUsers = new GS.Module('GS Extension Users');
    mod.dependencies = [ ];
    mod.load = function () { };
    
    mod.players = {};
    mod.gotInitialList = false;

    GS.whenConnectionReady.then(function () {
        return GS.sendWSMessage('QUERY_EXTUSERS', {});
    }).then(function (resp) {
        console.log('Received list of extension users from server.');
        mod.players = {};
        _.each(resp.clientlist, function (c) {
            mod.players[c.connId] = c;
        });
        mod.gotInitialList = true;
    });

    GS.modules.wsConnection.listenForMessage('ADD_EXTUSER', function (msg) {
        var p = msg.user;
        mod.players[p.connId] = p;
    });

    GS.modules.wsConnection.listenForMessage('REM_EXTUSER', function (msg) {
        var p = msg.user;
        delete mod.players[p.connId];
    });

    mod.remUser = function (player) {
        console.info('Rem ext user', player);
        if (mod.gotInitialList) {
            console.info('Rem ext user - List ready', player);
        }
    };
    mod.getUsers = function () {
        return mod.gotInitialList ? mod.players : null;
    };
}());
