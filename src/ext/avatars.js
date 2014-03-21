/*jslint browser: true, devel: true, indent: 4, vars: true, nomen: true, regexp: true, forin: true */
/*global $, _, GS, Goko, FS, mtgRoom */

(function () {
    "use strict";

    var mod = GS.modules.avatars = new GS.Module('Avatars');
    mod.dependencies = [
        'FS.AvatarHelper.loadAvatarImage',
        'Goko.Player.preloader',
        'GS.WS',
        'mtgRoom'
    ];
    mod.load = function () {

        // Cache of who has custom avatars: playerId --> true/false
        var gsAvatarLoader, retroboxAvatarLoader, gokoAvatarLoader;
        GS.hasAvatar = {};

        // Populate a local list of who has a custom avatar
        // TODO: have server update this list when appropriate
        GS.noAvatarCacheWarned = false;
        GS.WS.waitSendMessage('QUERY_AVATAR_TABLE', {}, function (resp) {
            console.log('Loaded avatar cache from ' + GS.WS.domain);
            GS.avatarCache = resp.available;
        });

        // Goko's default avatar loader and our replacement function
        gokoAvatarLoader = FS.AvatarHelper.loadAvatarImage;

        // Look up avatars on gokosalvager.com; fall back on Goko
        gsAvatarLoader = function (playerId, size, callback) {
            // NOTE: there is no need for image-resizing code that used to be
            //       here.  The Goko framework will resize as necessary.
            var img = new Image();

            img.onerror = function () {
                // Defer to goko if GokoSalvager has gone offline or does not 
                // have a custom avatar.
                gokoAvatarLoader(playerId, size, callback);
            };

            img.crossOrigin = "Anonymous";
            // TODO: Switch from port 8889 back to 443 after server transition
            img.src = "https://gokosalvager.com:8889/"
                    + "gs/avatars/" + playerId + ".jpg";
            callback({
                playerId: playerId,
                image: img
            });
        };

        // Look up avatars on dom.retrobox.eu; fall back on Goko
        retroboxAvatarLoader = function (playerId, size, callback) {
            var img = new Image();
            img.onerror = function () {
                gokoAvatarLoader(playerId, size, callback);
            };
            img.src = "http://dom.retrobox.eu/avatars/" + playerId + ".png";
            img.onerror = function () {
                gokoAvatarLoader(playerId, size, callback);
            };
            callback({
                playerId: playerId,
                image: img
            });
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
        // NOTE: The 'size' argument used to be called 'which'
        //
        var SMALL = 1, MEDIUM = 2;
        FS.AvatarHelper.loadAvatarImage = function (playerId, size, callback) {

            // If displaying the launch (title) screen before the hasAvatar[]
            // cache is populated, blindly look up the user's own avatar from
            // gokosalvager.com anyway.
            //
            // Players with custom avatars will thereby always see them on the
            // launch screen, while players with no custom avatar will receive
            // a single 404/CORS error.
            //
            if (mtgRoom.currentRoomId === null && size <= MEDIUM) {
                gsAvatarLoader(playerId, size, callback);
            } else if (size > MEDIUM) {
                gokoAvatarLoader(playerId, size, callback);
            } else if (typeof GS.hasAvatar[playerId] !== 'undefined') {
                if (GS.hasAvatar[playerId]) {
                    gsAvatarLoader(playerId, size, callback);
                } else {
                    gokoAvatarLoader(playerId, size, callback);
                }
            } else if (typeof GS.avatarCache === 'undefined') {
                if (!GS.noAvatarCacheWarned) {
                    console.log('The avatar cache from ' + GS.WS.domain
                              + ' is not yet loaded.  Using retrobox for now');
                    GS.noAvatarCacheWarned = true;
                }
                retroboxAvatarLoader(playerId, size, callback);
            } else {
                if (GS.avatarCache[playerId]) {
                    gsAvatarLoader(playerId, size, callback);
                } else {
                    gokoAvatarLoader(playerId, size, callback);
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
