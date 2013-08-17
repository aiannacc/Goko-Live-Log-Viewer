
/*jslint browser: true, devel: true, indent: 4, vars: true, nomen: true, regexp: true, forin: true */
/*global $, _ */

var loadAlwaysStackModule;
(function () {
    "use strict";

    console.log('Preparing to load Always Stack module');

    var exists = function (obj) {
        return (typeof obj !== 'undefined' && obj !== null);
    };

    // Wait (non-blocking) until the required objects have been instantiated
    var dbWait = setInterval(function () {
        var gs, gso, csp;

        console.log('Checking for Always Stack dependencies');
        
        try {
            gs = window.GokoSalvager;
            gso = gs.get_option;
            csp = window.FS.Cards.CardStackPanel;
        } catch (e) {}

        if ([gso, csp].every(exists)) {
            console.log('Loading Always Stack module');
            loadAlwaysStackModule(gs, csp);
            clearInterval(dbWait);
        }
    }, 100);
}());


//
// Always Stack module
//
// Goko dependencies:
// - addView API (setting stackCards in that function, value of autoStackCards)
// Internal dependencies:
// - option: alwaysStack
//
loadAlwaysStackModule = function (gs, csp) {
    "use strict";
    csp.prototype.old_addView = csp.prototype.addView;
    csp.prototype.addView = function (view, index) {
        var ret = this.old_addView(view, index);
        if (gs.get_option('always_stack') && this.autoStackCards) {
            this.stackCards = true;
        }
        return ret;
    };
};
