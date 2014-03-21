/*jslint browser: true, devel: true, indent: 4, vars: true, nomen: true, regexp: true, forin: true */
/*global $, _, GS, FS, mtgRoom */

(function () {
    "use strict";
    console.log('Loading LaunchScreenLoader');
    GS.modules.launchScreenLoader = new GS.Module('Launch Screen Loader');
    GS.modules.launchScreenLoader.dependencies = [
        '$',
        '.fs-rs-logout-row',
        '#settingsDialog',
        '#uploadAvatarDialog',
        'mtgRoom.conn',
        'FS.LaunchScreen.getInstance'
    ];
    GS.modules.launchScreenLoader.load = function () {

        GS.launchScreenModified = false;

        // Set avatar and custom links.  To be run only after Goko finishes
        // loading the Launch Screen.  Otherwise Goko's loading process may
        // override our changes.
        var modifyLaunchScreen = function () {

            // Ask Goko to reload our avatar, now that we're know that the
            // avatars module is running.
            FS.LaunchScreen.getInstance().loadPlayerAvatar(mtgRoom.conn);

            // Add Goko Salvager version info
            $('.fs-rs-logout-row')
                .append($('<div>').addClass('fs-lg-settings-btn')
                                  .text(' '))
                .append($('<div>').addClass('fs-lg-settings-btn')
                                  .text('Salvager v' + GS.version));

            // Add link to update avatar
            var openAvatarDialog = function () {
                $('#uploadAvatarDialog').dialog('open');
            };
            $('.fs-rs-logout-row')
                .append($('<div>').addClass('fs-lg-settings-btn')
                                  .attr('id', 'changeAvatarLink')
                                  .text('Change Avatar')
                                  .click(openAvatarDialog));

            // Add link to show GokoSalvager user settings
            var showSettings = function () {
                $('#settingsDialog').dialog('open');
            };
            $('.fs-rs-logout-row')
                .append($('<div>').addClass('fs-lg-settings-btn')
                                  .attr('id', 'userSettingsLink')
                                  .text('User Settings')
                                  .click(showSettings));

            GS.launchScreenModified = true;
        };

        // Loop until Goko finishes preparing the launch screen, then make
        // our modifications. 
        var intv, delay = 250, count = 0;
        var checkReadyAndModify = function () {
            var ls = FS.LaunchScreen.getInstance();
            if (typeof ls !== 'undefined'
                    && typeof ls.container !== 'undefined'
                    && typeof ls.container.isReady !== 'undefined'
                    && ls.container.isReady === true) {

                console.log('Launch Screen ready.');
                clearInterval(intv);
                modifyLaunchScreen();
            } else {
                count += 1;
                var elapsed = count * delay / 1000;
                // NOTE: Keep the delay an integer divisor of 1000 ;)
                if (elapsed % 5 === 0) {
                    console.log('Launch screen not ready after ' + elapsed + 's');
                }
            }
        };
        intv = setInterval(checkReadyAndModify, delay);
    };
}());
