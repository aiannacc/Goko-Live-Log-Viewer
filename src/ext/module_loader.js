/*jslint browser:true, devel:true, white:true, vars:true, forin:true */
/*globals $, angular, GS */

(function () {
    "use strict";

    console.log("Loading Module Loader");

    // Module load order
    var modNames = [
        'settingsDialog',
        //'eventLogger',
        'notifications',
        'lobbyRatings',
        'decktracker',
        'tableState', 
        'autokick',
        'blacklist',
        'avatars',
        'sidebar',
        'logviewer',
        'chatbox',
        'vpcalculator',
        'vptoggle',
        'vpcounterui',
        'alwaysStack',
        'automatchGamePop',
        'automatchOfferPop',
        'automatchSeekPop',
        'automatch',
        'quickGame',
        'launchScreenLoader',
        'createTable',
        'createGameDialog',
        'kingdomGenerator2'
    ];

    var loadModule = function (i) {
        var failCount = 0;
        var mod = GS.modules[modNames[i]];
        var missing = mod.getMissingDeps();
        if (missing.length === 0) {
            console.log('Starting module ' + mod.name);
            mod.load();
            i += 1;
            if (i !== modNames.length) {
                loadModule(i);
            }
        } else {
            var intvl = setInterval(function () {
                var missing = mod.getMissingDeps();
                if (missing.length === 0) {
                    clearInterval(intvl);
                    console.log('Starting module ' + mod.name);
                    mod.load();
                    i += 1;
                    if (i !== modNames.length) {
                        loadModule(i);
                    }
                } else {
                    failCount += 1;
                    if (failCount % 10 === 0) {
                        console.log('Module ' + mod.name + ' is missing dependencies:');
                        console.log(missing);
                    }
                    //if (failCount === 300) {
                    //    alert('Goko Salvager could not load. Module ' + mod.name
                    //        + ' could not find its Goko object dependencies.');
                    //}
                }
            }, 500);
        }
    };

    loadModule(0);
}());
