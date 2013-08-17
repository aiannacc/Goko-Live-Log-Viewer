/*jslint browser: true, devel: true, indent: 4, vars: true, nomen: true, regexp: true, forin: true */
/*global $, _, */

/*
 * GokoSalvager Configuration module
 *
 * Goko dependencies: none
 * Internal dependencies: none
 */
var loadConfigurationModule = function (gs) {
    "use strict";

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
        blacklist: []
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
};

(function () {
    "use strict";
    window.GokoSalvager = window.GokoSalvager || {};
    console.log('Loading configuration module.');
    loadConfigurationModule(window.GokoSalvager);
}());
