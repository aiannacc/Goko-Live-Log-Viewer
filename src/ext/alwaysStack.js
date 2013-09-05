/*jslint browser: true, devel: true, indent: 4, vars: true, nomen: true, regexp: true, forin: true, white:true */
/*global $, _ */

// Always Stack module
//
var loadAlwaysStackModule = function (gs, csp) {
    "use strict";
    gs.alsoDo(csp, 'addView', null, function (view, index) {
        if (gs.get_option('always_stack') && this.autoStackCards) {
            this.stackCards = true;
        }
    });
};

window.GokoSalvager.depWait(
    ['GokoSalvager',
     'FS.Cards.CardStackPanel'],
    100, loadAlwaysStackModule, this, 'Always Stack Module'
);
