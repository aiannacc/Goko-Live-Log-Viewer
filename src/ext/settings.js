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
    window.GokoSalvager = {};
    var gs = window.GokoSalvager;

    var default_options = {
        autokick: true,
        generator: true,
        proranks: true,
        sortrating: true,
        adventurevp: true,
        vp_enabled: true,
        vp_always_on: false,
        vp_always_off: false,
        always_stack: false,
        blacklist: [],
        automatch_on_seek: true,
        automatch_min_players: 2,
        automatch_max_players: 2,
        automatch_min_sets: 1,
        automatch_max_sets: 15,
        automatch_rSystem: 'pro',
        automatch_rdiff: 1500
    };

    gs.get_options = function () {
        try {
            return JSON.parse(localStorage.salvagerOptions);
        } catch (e) {
            gs.set_options(default_options);
            return gs.get_options();
        }
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
