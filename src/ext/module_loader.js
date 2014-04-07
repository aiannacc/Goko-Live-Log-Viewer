/*jslint browser:true, devel:true, white:true, vars:true, forin:true */
/*globals $, angular, GS, mtgRoom */

(function () {
    "use strict";

    console.log("Loading Module Loader");

    // Module load order
    var modNames = [
        'eventIntermediary',
        'state',
        'wsConnection',
        'avatars',
        'avatarUpload',
        'blacklist',
        'blacklistSync',
        'settingsDialog',       // Depends on blacklist, blacklistSync
        'launchScreenLoader',   // Depends on avatars, settingsDialog modules
        //'eventLogger',
        'notifications',
        'lobbyRatings',
        'decktracker',
        'tableState', 
        'autokick',
        'kingdomGenerator',
        'speedTweak',
        'alwaysStack',
        //'automatchGamePop',
        //'automatchOfferPop',
        //'automatchSeekPop',
        //'automatch',
        'quickGame',
        'sidebar',              
        'logviewer',            // Depends on sidebar
        'vpcalculator',         // Depends on sidebar
        'vptoggle',             // Depends on sidebar
        'vpcounterui',          // Depends on sidebar
        'chatbox',              // Depends on sidebar
        'extUsers',             // Depends on wsConnection
        'autozap',
        'proRecorder'
    ];

    var loadModule = function (i) {
        var failCount = 0;
        var mod = GS.modules[modNames[i]];
        console.log('Preparing to load module ' + mod.name);
        var missing = mod.getMissingDeps();

        if (missing.length === 0) {
            console.log('Loading module ' + mod.name);
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
                    console.log('Loading module ' + mod.name);
                    mod.load();
                    i += 1;
                    if (i !== modNames.length) {
                        loadModule(i);
                    }
                } else {
                    failCount += 1;
                    if (failCount === 20) {
                        console.log('Module ' + mod.name + ' is missing dependencies:');
                        console.log(missing);
                    }
                    if (failCount === 120) {
                        console.log('Goko Salvager could not load. Module ' + mod.name
                                  + ' could not find its Goko object dependencies.');
                    }
                }
            }, 500);
        }
    };

    loadModule(0);
}());
