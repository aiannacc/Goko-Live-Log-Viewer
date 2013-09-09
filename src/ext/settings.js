/*jslint browser: true, devel: true, indent: 4, vars: true, nomen: true, regexp: true, forin: true */
/*global $, _, */

/*
 * GokoSalvager Configuration module
 *
 * Goko dependencies: none
 * Internal dependencies: none
 */
(function () {
    "use strict";

    // All extension globals should be defined here
    window.GokoSalvager = window.GokoSalvager || {};
    var gs = window.GokoSalvager;

    var default_options = {
        autokick_by_rating: true,
        autokick_by_forname: true,
        alert_popups: false,
        alert_sounds: true,
        generator: true,
        proranks: true,
        sortrating: true,
        adventurevp: true,
        sidebar: true,
        vp_request: true,
        vp_refuse: false,
        always_stack: false,
        blacklist: [],
        automatch_blacklist: [],
        automatch_on_seek: true,
        automatch_min_players: 2,
        automatch_max_players: 2,
        automatch_min_sets: 1,
        automatch_max_sets: 15,
        automatch_rSystem: 'pro',
        automatch_rdiff: 1500,
        debug_mode: false,
        lasttablename: 'My Table'
    };

    gs.get_options = function () {
        var optName, out = {};
        if (localStorage.hasOwnProperty('salvagerOptions')) {
            out = JSON.parse(localStorage.salvagerOptions);
        }
        for (optName in default_options) {
            if (!out.hasOwnProperty(optName)) {
                out[optName] = default_options[optName];
            }
        }
        return out;
    };

    gs.set_options = function (options) {
        localStorage.salvagerOptions = JSON.stringify(options);
    };

    gs.get_option = function (optName) {
        return gs.get_options()[optName];
    };

    gs.set_option = function (optionName, optionValue) {
        var opts = gs.get_options();
        opts[optionName] = optionValue;
        gs.set_options(opts);
    };
}());
