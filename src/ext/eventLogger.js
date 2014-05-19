(function () {
    "use strict";

    GS.modules.eventLogger = new GS.Module('Event Logger');
    GS.modules.eventLogger.dependencies = [
        'DominionClient',
        'FS.Connection',
        'FS.GameInstance'
    ];
    GS.modules.eventLogger.load = function () {
        window.eventHistory = {
            DominionClient: [],
            MeetingRoom: [],
            Connection: [],
            GameInstance: []
        };

        GS.alsoDo(FS.MeetingRoom, 'trigger', function (msg) {
            console.log('MeetingRoom: ' + msg);
            console.log(Array.prototype.slice.call(arguments, 1));
        });

        GS.alsoDo(FS.Connection, 'trigger', function (msg) {
            if (msg === 'gameMessage') { return; }
            console.log('Connection: ' + msg);
            console.log(Array.prototype.slice.call(arguments, 1));
        });

        GS.alsoDo(DominionClient, 'trigger', function (msg) {
            switch (msg) {
            case 'incomingMessage:messageGroup':
            case 'incomingMessage:gamePingMessage':
                break;
            case 'incomingMessage':
            case 'default':
                var args = Array.prototype.slice.call(arguments, 1);
                if (args[0] !== 'gamePingMessage' &&
                        args[0] !== 'messageGroup') {
                    console.log('DominionClient: ' + msg);
                    console.log(Array.prototype.slice.call(arguments, 1));
                }
                break;
            }
        });
    };
}());
