/*jslint browser:true, devel:true, nomen:true, forin:true, vars:true, regexp:true, white:true */
/*globals $, _, angular, FS, DominionClient, GameInstance */

(function () {
    "use strict";

    var redefineEDEmit = function (gs, gsad) {
        window.eventHistory = {
            DominionClient: [],
            MeetingRoom: [],
            Connection: [],
            GameInstance: []
        };
        var eh = window.eventHistory;

        gs.alsoDo(FS.MeetingRoom, 'trigger', function (msg) {
            //eh.MeetingRoom.push(arguments);
            console.log('MeetingRoom: ' + msg);
            console.log(Array.prototype.slice.call(arguments,1));
        });

        gs.alsoDo(FS.Connection, 'trigger', function (msg) {
            if (msg === 'gameMessage') { return; }
            //eh.Connection.push(arguments);
            console.log('Connection: ' + msg);
            console.log(Array.prototype.slice.call(arguments,1));
        });
        
        //gs.alsoDo(FS.GameInstance, 'trigger', function (msg) {
        //    eh.MeetingRoom.push(arguments);
        //    console.log('GameInstance: ' + msg);
        //    console.log(Array.prototype.slice.call(arguments,1));
        //});

        gs.alsoDo(DominionClient, 'trigger', function (msg) {
            switch (msg) {
            case 'incomingMessage:messageGroup':
            case 'incomingMessage:gamePingMessage':
                break;
            case 'incomingMessage':
            case 'default':
                var args = Array.prototype.slice.call(arguments,1);
                if (args[0] !== 'gamePingMessage' &&
                        args[0] !== 'messageGroup') {
                    //eh.DominionClient.push(arguments);
                    console.log('DominionClient: ' + msg);
                    console.log(Array.prototype.slice.call(arguments,1));
                }
                break;
            }
        });
    };

    window.GokoSalvager.depWait(
        ['GokoSalvager', 'GokoSalvager.alsoDo', 'DominionClient', 
         'FS.Connection', 'FS.GameInstance'],
        100, redefineEDEmit, this, 'EventDispatcher Listener'
    );
}());
