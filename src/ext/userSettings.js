/*jslint browser: true, devel: true, indent: 4, vars: true, nomen: true, regexp: true, forin: true */
/*global $, _, angular */

var loadUserSettingsModule;
(function () {
    "use strict";

    console.log('Preparing to load User Settings module');

    // Wait (non-blocking) until the required objects have been instantiated
    var waitLoop = setInterval(function () {
        var gs, gso, ang;

        console.log('Checking for User Settings dependencies');

        try {
            gs = window.GokoSalvager;
            gso = gs.get_option;
        } catch (e) {}

        if ($('.fs-rs-logout-row').length > 0
                && typeof gso !== 'undefined' && gso !== null
                && typeof window.angular !== 'undefined'
                && typeof $('div').dialog !== 'undefined') {
            console.log('Loading User Settings module');
            loadUserSettingsModule(gs);
            clearInterval(waitLoop);
        }
    }, 100);
}());

/*
 * GokoSalvager UserSettings Module: displays option menu on login screen
 *
 * Goko dependencies:
 *   - FS.Templates.LaunchScreen
 *   - '.fs-rs-logout-row' HTML widget
 * Internal dependencies:
 *   - GokoSalvager option methods
 */
loadUserSettingsModule = function (gs) {
    "use strict";

    window.gokoSalvagerUserSettingsController = function ($scope) {
        // Load settings on initialization
        $scope.us = gs.get_options();
        console.log($scope.us);

        $scope.add_to_blacklist = function (pname) {
            if (pname) {
                $scope.us.blacklist.push(pname);
            }
            $scope.temp_bl = null;
            $scope.save($scope.us);
        };

        $scope.rem_from_blacklist = function (pname) {
            console.log('adding ' + pname + ' to blacklist.');
            if (pname) {
                $scope.us.blacklist =
                    $scope.us.blacklist.filter(function (p) {
                        return p !== pname;
                    });
            }
            $scope.save($scope.us);
        };

        $scope.save = function (us) {
            console.log(angular.copy(us));
            gs.set_options(angular.copy(us));
        };
    };

    // Open dialog with the "User Settings" link
    $('.fs-rs-logout-row').append(
        $('<div></div>')
            .addClass('fs-lg-settings-btn')
            .html('User Settings')
            .click(function () {
                // Initialize if necessary
                if ($('#usDialog').length === 0) {
                    $('#viewport').append(gs.createSettingsDialog());
                    angular.bootstrap(window.document);
                }
                // Display as JQueryUI popup dialog
                $('#usDialog').dialog({
                    modal: true,
                    width: 550,
                    closeText: 'Save',
                    draggable: false,
                    resizeable: false,
                    autoOpen: false
                });
                $('#usDialog').dialog('open');
            })
    );
};
