/*jslint vars:true, devel:true */
/*globals Services, Components, document, gBrowser, window, GokoSalvagerChrome */

/**
 * GokoSalvagerChrome namespace.
 */
if (typeof GokoSalvagerChrome === 'undefined') {
    var GokoSalvagerChrome = {};
}

var myExtension = {
    init: function () {
        "use strict";
        var appcontent = document.getElementById("appcontent");   // browser
        appcontent.addEventListener("DOMContentLoaded", myExtension.onPageLoad, true);
        //appcontent.addEventListener("ready", myExtension.onPageLoad, true);
    },

    onPageLoad: function (aEvent) {
        "use strict";
        var doc = aEvent.originalTarget;
        if (doc.location.href.match(/play\.goko\.com\/Dominion\/gameClient\.html/)) {

            // Load javascript files in Goko page context
            var scriptDir = "chrome://gokosalvager/content/";
            var scriptFiles = [
                'externals.js',
                'utils.js',
                'settings.js',
                'kingdom_generator.js',
                'settingsDialog.js',
                'userSettings.js',
                'tableState.js',
                'autokick.js',
                'avatars.js',
                'blacklist.js',
                'logviewer.js',
                'lobby_ratings.js',
                'alwaysStack.js',
                'automatchGamePop.js',
                'automatchOfferPop.js',
                'automatchSeekPop.js',
                'automatch.js'
            ];
            var i;
            for (i = 0; i < scriptFiles.length; i += 1) {
                var script = scriptFiles[i];
                Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
                    .getService(Components.interfaces.mozIJSSubScriptLoader)
                    .loadSubScript(scriptDir + script, doc, "UTF-8");
            }

            // Inject css into Goko page
            var styleDir = "chrome://gokosalvager/content/";
            var styleFiles = [
                'logviewer.css',
                'jquery-gokocolors.css'
            ];
            var ios = Components.classes["@mozilla.org/network/io-service;1"]
                    .getService(Components.interfaces.nsIIOService);
            var domWindowUtils = doc.defaultView
                .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                .getInterface(Components.interfaces.nsIDOMWindowUtils);
            for (i = 0; i < styleFiles.length; i += 1) {
                var styleFile = styleDir + styleFiles[i];
                var styleURI = ios.newURI(styleFile, null, null);
                domWindowUtils.loadSheet(styleURI, 1);
            }
        }
    }
};

var singleuselistener = function () {
    "use strict";
    gBrowser.removeEventListener("load", singleuselistener);
    myExtension.init();
};
gBrowser.addEventListener("load", singleuselistener, true);
