/*jslint browser: true, devel: true, indent: 4, vars: true, nomen: true, regexp: true, forin: true */
/*global $, _, FS, GS, mtgRoom */

// Prints Goko events to console to assist a developer in learning what they
// are and when they are produced. 
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
        //    // Log all ClientConnection events
        //    // TODO: disable after testing
        //    _.keys(GS.state.game.cconn._callbacks).map(function (k) {
        //        GS.state.game.cconn.bind(k, function () {
        //            console.info('ClientConn: ' + k, arguments);
        //        });
        //    });

        //    // Log all MeetingRoom events.  Note that these are different from
        //    // the events generated while not playing.
        //    // TODO: disable after testing
        //    var intvl = setInterval(function () {
        //        if (_.keys(mtgRoom.eventCallbacks).length === 19) {
        //            clearInterval(intvl);
        //            _.keys(mtgRoom.eventCallbacks).map(function (k) {
        //                mtgRoom.bind(k, function () {
        //                    console.info('MeetingRoom: ' + k, arguments);
        //                });
        //            });
        //        }
        //    }, 10);
    };
}());
