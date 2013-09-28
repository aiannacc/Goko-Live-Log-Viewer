/*jslint browser: true, devel: true, indent: 4, vars: true, nomen: true, regexp: true, forin: true, white:true */
/*global $, _, GS, FS */

(function () {
    "use strict";

    console.log('Loading Always Stack');

    var mod = GS.modules.alwaysStack = new GS.Module('Always Stack');
    mod.dependencies = ['GS', 'FS.Cards.CardStackPanel'];
    mod.load = function () {
        GS.alsoDo(FS.Cards.CardStackPanel, 'addView', null, function (view, index) {
            if (GS.get_option('always_stack') && this.autoStackCards) {
                this.stackCards = true;
            }
        });
    };
}());
