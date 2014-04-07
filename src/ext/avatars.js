/*jslint browser: true, devel: true, indent: 4, vars: true, nomen: true, regexp: true, forin: true */
/*global $, _, GS, Goko, FS, mtgRoom */

(function () {
    "use strict";

    var mod = GS.modules.avatars = new GS.Module('Avatars');
    mod.dependencies = [
        'Goko.Player.AvatarLoader',
        'Goko.Player.preloader',
        'mtgRoom'
    ];
    mod.load = function () {

        // Cache of who has custom avatars: playerId --> true/false
        var gsAvatarLoader, retroboxAvatarLoader, gokoAvatarLoader;

        // Populate a local list of who has a custom avatar
        GS.noAvatarCacheWarned = false;
        GS.whenConnectionReady.then(function () {
            return GS.sendWSMessage('QUERY_AVATAR_TABLE', {});
        }).then(function (resp) {
            console.log('Received avatar cache from server.');
            GS.hasAvatar = resp.available;
        });

        // Goko's default avatar loader and our replacement function
        gokoAvatarLoader = Goko.Player.AvatarLoader;

        // Look up avatars on gokosalvager.com; fall back on Goko
        gsAvatarLoader = function (userdata, callback) {
            var img = new Image();
            img.onerror = function () {
                // Defer to goko if the GS server fails us
                gokoAvatarLoader(userdata, callback);
            };
            img.onload = function () {
                callback(img);
            };

            // TODO: Switch from port 8889 back to 443 after server transition
            img.crossOrigin = "Anonymous";
            img.src = "https://gokosalvager.com:8889/"
                    + "gs/avatars/" + userdata.player.id + ".jpg";
        };

        // Look up avatars on dom.retrobox.eu; fall back on Goko
        retroboxAvatarLoader = function (userdata, callback) {
            var img = new Image();
            img.onerror = function () {
                // Defer to goko if the Retrobox server fails us
                gokoAvatarLoader(userdata, callback);
            };
            img.onload = function () {
                callback(img);
            };
            img.crossOrigin = "Anonymous";
            img.src = "http://dom.retrobox.eu/avatars/" + userdata.player.id + ".png";
        };

        // Prevent the billions of 404 CORS and mixed content errors that
        // blindly attempting to load avatars from retrobox by:
        //
        // 1. Use the GS websocket to ask whether a custom avatar exists.
        // 2a. Look up a custom avatar from GS via https
        // 2b. Look up a vanilla avatar using the regular goko method
        // 
        // Goko should also provide any large (size >= 3) versions of the
        // avatars, even if a custom one is available.
        //
        var SMALL = 1, MEDIUM = 2;

        Goko.Player.AvatarLoader = function (userdata, callback) {
            // If displaying the launch (title) screen before the hasAvatar[]
            // cache is populated, blindly look up the user's own avatar from
            // gokosalvager.com anyway.
            //
            // Players with custom avatars will thereby always see them on the
            // launch screen, while players with no custom avatar will receive
            // a single 404/CORS error.
            //
            if (userdata.which > MEDIUM) {
                gokoAvatarLoader(userdata, callback);
            } else if (typeof GS.hasAvatar === 'undefined') {
                if (mtgRoom.currentRoomId === null && userdata.which <= MEDIUM) {
                    gsAvatarLoader(userdata, callback);
                } else {
                    if (!GS.noAvatarCacheWarned) {
                        console.log('The avatar cache from ' + GS.wsdomain
                                  + ' is not yet loaded.  Using retrobox for now');
                        GS.noAvatarCacheWarned = true;
                    }
                    retroboxAvatarLoader(userdata, callback);
                }
            } else if (typeof GS.hasAvatar[userdata.player.id] !== 'undefined') {
                if (GS.hasAvatar[userdata.player.id]) {
                    gsAvatarLoader(userdata, callback);
                } else {
                    gokoAvatarLoader(userdata, callback);
                }
            } else {
                if (GS.hasAvatar[userdata.player.id]) {
                    gsAvatarLoader(userdata, callback);
                } else {
                    gokoAvatarLoader(userdata, callback);
                }
            }
        };

        // Prevent Goko's preloader from building a cache of vanilla avatars.
        // Note that the cache will still be populated later and used, but it
        // will be populated using our avatar loading code rather than Goko's.
        Goko.Player.preloader = function (ids, which) {};

        // Also clear anything that got into the cache befor this module loaded
        try {
            Goko.ObjectCache.getInstance().player = {};
        } catch (e) {
            // Player cache does not yet exist --> no need to clear it
        }
    };
}());
