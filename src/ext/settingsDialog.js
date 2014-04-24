/*jslint browser:true, devel:true, es5:true, nomen:true, forin:true, vars:true */
/*globals $, _, angular, GS, FS, mtgRoom */

(function () {
    "use strict";
    console.log('Loading Settings Dialog');
    GS.modules.settingsDialog = new GS.Module('User Settings Dialog');
    GS.modules.settingsDialog.dependencies = [
        '$',
        'angular',
        '#viewport',
        '.fs-rs-logout-row',
        'FS',
        'GS.WS',
        'FS.LaunchScreen.View.Container',
        'mtgRoom.conn.connInfo',
        'GS.submitBlacklist',
        'GS.reconcileBlacklist',
    ];
    GS.modules.settingsDialog.load = function () {

        // Create dialog
        $('#viewport')
            .append($('<div>').attr('id', 'settingsDialog')
                              .attr('title', 'Extension Settings')
                              .attr('ng-app', 'settingsApp')
                              .attr('ng-controller', 'settingsController')
                .append($('<div id="settingsTabs">')
                    .append($('<ul>')
                        .append($('<li><a href="#settingsTabs-lobby">Lobby</a></li>'))
                        .append($('<li><a href="#settingsTabs-game">Game</a></li>'))
                        .append($('<li><a href="#settingsTabs-black">Blacklist</a></li>'))
                        .append($('<li><a href="#settingsTabs-misc">Misc</a></li>')))
                    .append($('<div id="settingsTabs-game">'))
                    .append($('<div id="settingsTabs-black">'))
                    .append($('<div id="settingsTabs-lobby">'))
                    .append($('<div id="settingsTabs-misc">'))));

        // Display dialog sections using tabbed sheets
        $('#settingsTabs').tabs();

        // Define the dialog sections: in-game settings
        $('#settingsTabs-game')
            .append($('<div>').text('In-game sidebar'))
            .append($('<input>').attr('type', 'checkbox')
                                .attr('id', 'settings_sidebar')
                                .attr('ng-model', 'so.sidebar')
                                .addClass('indented'))
            .append('<label for="settings_sidebar">Show sidebar (VPs, log, chat)</label><br />')
            .append($('<input>').attr('type', 'checkbox')
                                .attr('id', 'settings_sidebar_chat')
                                .attr('ng-model', 'so.sidebar_chat')
                                .addClass('indented'))
            .append('<label for="settings_sidebar_chat">Replace Goko chat window</label><br />')
            .append($('<input type="checkbox" ng-model="so.flash_chat" id="settings_flash_chat" class="indented">'))
            .append('<label for="settings_flash_chat">Visual chat alert</label><br />')
            .append($('<input type="checkbox" ng-model="so.chat_noise" id="settings_chat_noise" class="indented">'))
            .append('<label for="settings_chat_noise">Audio chat alert</label><br />')
            .append($('<div>').text('VP Counter'))
            .append($('<input>').attr('type', 'checkbox')
                                .attr('id', 'settings_vp_request')
                                .attr('ng-model', 'so.vp_request')
                                .addClass('indented'))
            .append('<label for="settings_vp_request">Always request (#vpon)</label><br />')
            .append($('<input>').attr('type', 'checkbox')
                                .attr('id', 'settings_vp_refuse')
                                .attr('ng-model', 'so.vp_refuse')
                                .addClass('indented'))
            .append('<label for="settings_vp_refuse">Always refuse (#vpoff)</label><br />')
            .append('Animation Speed:<br>')
            .append($('<input>').attr('type', 'checkbox')
                                .attr('id', 'settings_speed_tweak_uniform')
                                .attr('ng-model', 'so.speed_tweak_uniform')
                                .attr('ng-change', 'updateSpeeds()')
                                .addClass('indented'))
            .append('<label for="settings_speed_tweak_uniform">More consistent speeds</label><br />')
            .append($('<input>').attr('type', 'checkbox')
                                .attr('id', 'settings_speed_tweak_faster')
                                .attr('ng-model', 'so.speed_tweak_faster')
                                .attr('ng-change', 'updateSpeeds()')
                                .attr('ng-disabled', '!so.speed_tweak_uniform')
                                .addClass('indented'))
            .append('<label for="settings_speed_tweak_faster">Speed up "normal" and "fast" modes</label><br />')
            .append($('<input>').attr('type', 'checkbox')
                                .attr('id', 'settings_always_stack')
                                .attr('ng-model', 'so.always_stack'))
            .append('<label for="settings_always_stack">Stack duplicate cards</label><br />')
            .append('Greeting Message')
            .append($('<input>').attr('type', 'text')
                                .attr('id', 'greeting')
                                .attr('ng-model', 'so.greeting'));

        // Define the dialog sections: blacklist settings
        $('#settingsTabs-black')
            .append('<br>')
            .append($('<form name="blnewForm" novalidate>')
                .append($('<table style="table-layout:fixed">').addClass('indented')
                    .append($('<tbody>')
                        .append($('<tr>')
                            .append($('<td width="50%"><b>Player</b></td>'))
                            .append($('<td width="15%"><b>Kick</b></td>'))
                            .append($('<td width="15%"><b>NoAM</b></td>'))
                            .append($('<td width="15%"><b>Censor</b></td>'))
                            .append($('<td width="5%">')))))
                .append($('<table style="table-layout:fixed">').addClass('indented')
                                                               .css('display', 'block')
                    .append($('<tbody>').css('height', '210px')
                                        .css('overflow-y', 'scroll')
                                        .css('display', 'block')
                        .append($('<tr ng-repeat="(pname, o) in so.blacklist2">')
                            .append($('<td witdh="50%">{{pname}}</td>'))
                            .append($('<td width="15%">')
                                .append($('<input type="checkbox" ng-model="o.noplay"></td>')))
                            .append($('<td width="15%">')
                                .append($('<input type="checkbox" ng-model="o.nomatch"></td>')))
                            .append($('<td width="15%">')
                                .append($('<input type="checkbox" ng-model="o.censor"></td>')))
                            .append($('<td width="5%">')
                                .append($('<button ng-click="bldel(pname)">Del</button></td>'))))))
                .append($('<table style="table-layout:fixed">').addClass('indented')
                    .append($('<tbody>')
                        .append($('<tr>')
                            .append($('<td width="46%">')
                                .append($('<input type="text" ng-model="blnewpname" '
                                        + 'id="blnewpnameField" required>')))
                            .append($('<td width="15%">')
                                .append($('<input>').attr('type', 'checkbox')
                                                    .attr('ng-model', 'blnew.noplay')
                                                    .attr('ng-disabled', 'blnewForm.$invalid')))
                            .append($('<td width="15%">')
                                .append($('<input>').attr('type', 'checkbox')
                                                    .attr('ng-model', 'blnew.nomatch')
                                                    .attr('ng-disabled', 'blnewForm.$invalid')))
                            .append($('<td width="15%">')
                                .append($('<input>').attr('type', 'checkbox')
                                                    .attr('ng-model', 'blnew.censor')
                                                    .attr('ng-disabled', 'blnewForm.$invalid')))
                            .append($('<td width="9%">')
                                .append($('<button>').attr('ng-click', 'bladd()')
                                                     .attr('ng-disabled', 'blnewForm.$invalid')
                                                     .attr('id', 'blAddButton')
                                    .append('Add')))))))
            .append($('<br>'))
            .append($('<div>')
                .append('Common Blacklist:<br>')
                .append($('<div>').addClass('indented')
                    .append('Also blacklist the ')
                    .append($('<select>').attr('ng-model', 'so.blacklist_common')
                                        .attr('ng-options', 's for s in blacklist_strengths')
                                        .attr('ng-change', 'cacheCommonBlacklist'))
                    .append('% most-commonly blacklisted players')));

        // Pressing enter adds the new blacklist entry
        $('#blnewpnameField').keypress(function (e) {
            if (e.which === 13) {
                e.preventDefault();
                $(this).blur();
                $('#blAddButton').focus().click();
                $('#blnewpnameField').focus();
                return false;
            }
        });

        // Define the dialog sections: lobby settings
        $('#settingsTabs-lobby')
                .append($('<div>').text('Notifications:'))
                .append($('<input>').attr('type', 'checkbox')
                                    .attr('id', 'settings_audio_notifications')
                                    .attr('ng-model', 'so.audio_notifications')
                                    .addClass('indented'))
                .append('<label for="settings_audio_notifications">Sounds</label><br />')
                .append($('<input>').attr('type', 'checkbox')
                                    .attr('id', 'settings_popup_notifications')
                                    .attr('ng-model', 'so.popup_notifications')
                                    .addClass('indented'))
                .append('<label for="settings_popup_notifications">Traditional popups</label><br />')
                .append($('<input>').attr('id', 'desktopnotificationcheckbox')
                                    .attr('type', 'checkbox')
                                    .attr('ng-model', 'so.desktop_notifications')
                                    .addClass('indented'))
                .append('<label for="desktopnotificationcheckbox">HTML5 Notifications (recommended)</label><br />')

                .append($('<div>').text('Lobby Ratings:'))
                .append($('<span>').addClass('indented')
                    .append('Sort players by ')
                    .append($('<select>').attr('ng-model', 'so.sortkey')
                                         .attr('ng-options',
                                               's.name as s.text for s in sortkeys')))
                .append($('<br>'))
                .append($('<input>').attr('type', 'checkbox')
                                    .attr('id', 'settings_proranks')
                                    .attr('ng-model', 'so.proranks')
                                    .addClass('indented'))
                .append('<label for="settings_proranks">Display Pro ratings instead of Casual</label><br />')
                .append($('<input>').attr('type', 'checkbox')
                                    .attr('id', 'settings_isoranks')
                                    .attr('ng-model', 'so.isoranks')
                                    .addClass('indented'))
                .append('<label for="settings_isoranks">Also display Isotropish ratings</label><br />')

                .append($('<div>').text('Autokick:'))
                .append($('<input>').attr('type', 'checkbox')
                                    .attr('id', 'settings_autokick_by_rating')
                                    .attr('ng-model', 'so.autokick_by_rating')
                                    .addClass('indented'))

                .append('<label for="settings_autokick_by_rating">By Goko Pro rating</label><br />')
                .append($('<input>').attr('type', 'checkbox')
                                    .attr('id', 'settings_autokick_by_level')
                                    .attr('ng-model', 'so.autokick_by_level')
                                    .addClass('indented'))
                .append('<label for="settings_autokick_by_level">By TrueSkill (Isotropish) level</label><br />')
                .append($('<input>').attr('type', 'checkbox')
                                    .attr('id', 'settings_autokick_by_forname')
                                    .attr('ng-model', 'so.autokick_by_forname')
                                    .addClass('indented'))
                .append('<label for="settings_autokick_by_forname">By player name</label><br />')

                .append($('<input>').attr('type', 'checkbox')
                                    .attr('id', 'settings_explain_kicks')
                                    .attr('ng-model', 'so.explain_kicks')
                                    .addClass('indented'))
                .append('<label for="settings_explain_kicks">Explain kicks in chat</label><br />')


                .append($('<div>').text('Quick game:'))
                .append('&nbsp;&nbsp;&nbsp;&nbsp;Name:')
                .append($('<input>').attr('type', 'name')
                                    .attr('id', 'quick_game_name')
                                    .attr('ng-model', 'so.quick_game_name')
                                    .addClass('indented'))
                .append('<br>')
                .append('&nbsp;&nbsp;&nbsp;&nbsp;Type (pro/casual/unrated):')
                .append($('<input>').attr('type', 'name')
                                    .attr('id', 'quick_game_type')
                                    .attr('ng-model', 'so.quick_game_type')
                                    .addClass('indented'))
                .append('<br>')
                .append('&nbsp;&nbsp;&nbsp;&nbsp;# of players (2/3/4/5/6):')
                .append($('<input>').attr('type', 'name')
                                    .attr('id', 'quick_game_players')
                                    .attr('ng-model', 'so.quick_game_players')
                                    .addClass('indented'))
                .append('<br>')
                .append($('<input>').attr('type', 'checkbox')
                                    .attr('id', 'settings_quick_game_automatch')
                                    .attr('ng-model', 'so.quick_game_automatch')
                                    .addClass('indented'))
                .append('<label for="settings_quick_game_automatch">Use Automatch</label><br />');

        // Define the dialog sections: miscellaneous settings
        $('#settingsTabs-misc')
            .append($('<input type="checkbox" id="settings_generator" ng-model="so.generator">'))
            .append('<label for="settings_generator">Kingdom Generator</label><br />')
            .append($('<input type="checkbox" id="settings_autozap" ng-model="so.autozap">'))
            .append('<label for="settings_autozap">Adventure Mode Auto-Zap</label><br />')
            .append($('<input type="checkbox" id="settings_debug_mode" ng-model="so.debug_mode">'))
            .append('<label for="settings_debug_mode">Extra logging (for error reports)</label><br />');

        // Verify blacklist when opening Blacklist tab.  Save on close.
        $('#settingsTabs').on("tabsactivate", function (event, ui) {
            if (ui.newTab[0].innerText === 'Blacklist') {
                // Compare local and server lists when opening Blacklist tab
                GS.reconcileBlacklist(function () {
                    $('#settingsTabs').scope().$digest();
                });
            } else if (ui.oldTab[0].innerText === 'Blacklist') {
                // Save local lists when closing Blacklist tab
                GS.submitBlacklist();
            }
        });
        // Also save blacklist when settings dialog is closed.
        $('#settingsDialog').on("dialogclose", function (event, ui) {
            GS.submitBlacklist();
        });

        // Override goko's select-hiding CSS nonsense
        $('#settingsTabs select').css('visibility', 'inherit');
        $('#settingsTabs select').css('top', 'auto');

        // Make dialog into a JQueryUI popup
        $('#settingsDialog').dialog({
            modal: true,
            width: 700,
            maxHeight: $(window).height() - 200,
            closeText: 'Save',
            draggable: true,
            resizeable: false,
            position: { my: "center", at: "center", of: window },
            autoOpen: false,
            create: function () {
                var helpURL = 'https://github.com/aiannacc/Goko-Salvager/'
                            + 'wiki/User-Settings';
                $(this).parent().children(".ui-dialog-titlebar")
                    .append($('<a>').attr('href', helpURL)
                                    .attr('target', '_blank')
                                    .css('text-decoration', 'underline')
                                    .css('color', '#0000cc')
                        .append('Help'));
            }
        });

        window.settingsController = function ($scope) {

            $scope.sortkeys = [
                {name: 'pname', text: 'Username'},
                {name: 'rating', text: 'Pro/Casual Rating'},
                {name: 'iso', text: 'Isotropish Rating'}
            ];

            if (!_.contains(['pname', 'rating', 'iso'], GS.get_option('sortkey'))) {
                GS.set_option('sortkey', 'rating');
            }

            $scope.quick_game_types = [
                {name: 'pro'},
                {name: 'casual'},
                {name: 'unrated'},
            ];
            $scope.blnewpname = '';
            $scope.blnew = {
                noplay: true,
                nomatch: true,
                censor: true
            };
            $scope.blacklist_strengths = [
                0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100
            ];
            $scope.so = GS.get_options();

            $scope.parseLocalStorage = function () {
                $scope.so = GS.get_options();
                $scope.$digest();
            };

            $scope.bldel = function (pname) {
                delete $scope.so.blacklist2[pname];
            };
            $scope.bladdDisable = function () {
                return $scope.blnewpname === '';
            };
            $scope.bladd = function () {
                if ($scope.blnewpname !== '') {
                    $scope.so.blacklist2[$scope.blnewpname] = {
                        noplay: $scope.blnew.noplay,
                        nomatch: $scope.blnew.nomatch,
                        censor: $scope.blnew.censor
                    };
                    $scope.blnew = {
                        noplay: true,
                        nomatch: true,
                        censor: true
                    };
                }
                $scope.blnewpname = '';
            };
            $scope.cacheCommonBlacklist = function () {
                GS.cacheCommonBlacklist($scope.so.blacklist_common, function () {});
            };

            $scope.$watch('so.sortkey', function () {
                if ($scope.so.sortkey === 'iso') {
                    $scope.so.isoranks = true;
                }
            });

            $scope.$watch('so.proranks', function () {
                if (!$scope.so.proranks && $scope.so.sortkey === 'pro') {
                    $scope.so.sortkey = 'pname';
                }
            });

            $scope.$watch('so.isoranks', function () {
                if (!$scope.so.isoranks && $scope.so.sortkey === 'iso') {
                    $scope.so.sortkey = 'rating';
                }
            });

            // Speed tweak settings
            $scope.updateSpeeds = function () {
                console.log('tweaking animation speeds');
                GS.tweakAnimationSpeeds();
            };
            $scope.$watch('so.speed_tweak_uniform', function () {
                $scope.so.speed_tweak_faster =
                    $scope.so.speed_tweak_faster && $scope.so.speed_tweak_uniform;
            });

            $scope.$watch('so.vp_refuse', function () {
                $scope.so.vp_request = $scope.so.vp_request && !$scope.so.vp_refuse;
            });
            $scope.$watch('so.sidebar', function () {
                $scope.so.sidebar_chat = $scope.so.sidebar_chat && $scope.so.sidebar;
            });
            $scope.$watch('so.sidebar_chat', function () {
                $scope.so.sidebar = $scope.so.sidebar_chat || $scope.so.sidebar;
            });
            $scope.$watch('so.vp_request', function () {
                $scope.so.vp_refuse = $scope.so.vp_refuse && !$scope.so.vp_request;
            });
            $scope.$watch('so.desktop_notifications', function () {
                $scope.so.popup_notifications =
                    $scope.so.popup_notifications && !$scope.so.desktop_notifications;
            });
            $scope.$watch('so.popup_notifications', function () {
                $scope.so.desktop_notifications =
                    $scope.so.desktop_notifications && !$scope.so.popup_notifications;
            });

            $scope.$watch('so', function () {
                GS.set_options($scope.so);
            }, true);
            $scope.$watch(GS.get_options, function () {
                $scope.so = GS.get_options();
            }, true);
        };
        angular.bootstrap($('#settingsDialog'));
    };
}());
