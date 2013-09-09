/*jslint browser:true, devel:true, white:true, es5:true */
/*globals $, angular */

(function () {
    "use strict";

    var createSettingsDialog = function (gs) {

        // Create dialog
        $('#viewport')
            .append($('<div>').attr('id', 'settingsDialog')
                              .attr('title', 'Extension Settings')
                              .attr('ng-app', 'settingsApp')
                              .attr('ng-controller', 'settingsController')

                .append($('<div>').text('Autokick:'))
                .append($('<input>').attr('type', 'checkbox')
                                    .attr('ng-model', 'so.autokick_by_rating')
                                    .addClass('indented'))
                .append('By rating range<br>')
                .append($('<input>').attr('type', 'checkbox')
                                    .attr('ng-model', 'so.autokick_by_forname')
                                    .addClass('indented'))
                .append('By player name<br>')

                .append($('<div>').text('Notifications:'))
                .append($('<input>').attr('type', 'checkbox')
                                    .attr('ng-model', 'so.alert_sounds')
                                    .addClass('indented'))
                .append('Play sounds<br>')
                .append($('<input>').attr('type', 'checkbox')
                                    .attr('ng-model', 'so.alert_popups')
                                    .addClass('indented'))
                .append('Create popups<br>')

                .append($('<div>').text('Lobby Ratings:'))
                .append($('<input>').attr('type', 'checkbox')
                                    .attr('ng-model', 'so.sort_rating')
                                    .addClass('indented'))
                .append('Sort players by rating<br>')
                .append($('<input>').attr('type', 'checkbox')
                                    .attr('ng-model', 'so.proranks')
                                    .addClass('indented'))
                .append('Display pro ratings<br>')

                .append($('<div>').text('VP Counter:'))
                .append($('<input>').attr('type', 'checkbox')
                                    .attr('ng-model', 'so.vp_request')
                                    .addClass('indented'))
                .append('Always request (#vpon)<br>')
                .append($('<input>').attr('type', 'checkbox')
                                    .attr('ng-model', 'so.vp_refuse')
                                    .addClass('indented'))
                .append('Always refuse (#vpoff)<br>')

                .append($('<input>').attr('type', 'checkbox')
                                    .attr('ng-model', 'so.sidebar')
                                    .addClass('indented'))
                .append('Show VP counter and log in sidebar<br>')

                .append($('<input>').attr('type', 'checkbox')
                                    .attr('ng-model', 'so.generator'))
                .append('Kingdom Generator<br>')

                .append($('<input>').attr('type', 'checkbox')
                                    .attr('ng-model', 'so.always_stack'))
                .append('Stack duplicate cards<br>')

                .append($('<input>').attr('type', 'checkbox')
                                    .attr('ng-model', 'so.debug_mode'))
                .append('Extra logging (for error reports)<br>')

                .append('Blacklist (noplay + censor):<br>')
                .append($('<table>').addClass('indented')
                    .append($('<tbody>')
                        .append($('<tr>').attr('ng-repeat', 'pname in so.blacklist')
                            .append($('<td>').css('color', 'red')
                                             .attr('ng-click', 'blRemove(pname)')
                                             .text('X'))
                            .append($('<td>').text('{{pname}}')))))
                .append($('<form>').attr('ng-submit', 'blAdd()')
                                   .addClass('indented')
                    .append('Add:')
                    .append($('<input>').attr('type', 'text')
                                        .attr('ng-model', 'newBlacklistee')))

                .append('Automatch Blacklist (no-automatch):<br>')
                .append($('<table>').addClass('indented')
                    .append($('<tbody>')
                        .append($('<tr>').attr('ng-repeat', 'pname in so.automatch_blacklist')
                            .append($('<td>').css('color', 'red')
                                             .attr('ng-click', 'amblRemove(pname)')
                                             .text('X'))
                            .append($('<td>').text('{{pname}}')))))
                .append($('<form>').attr('ng-submit', 'amblAdd()')
                                   .addClass('indented')
                    .append('Add:')
                    .append($('<input>').attr('type', 'text')
                                        .attr('ng-model', 'newAMBlacklistee'))));

        // Make dialog into a JQueryUI popup
        $('#settingsDialog').dialog({
            modal: true,
            width: 550,
            closeText: 'Save',
            draggable: false,
            resizeable: false,
            autoOpen: false
        });

        // Add link to open dialog
        $('.fs-rs-logout-row').append(
            $('<div>').addClass('fs-lg-settings-btn')
                      .text('User Settings')
                      .click(function () {
                          $('#settingsDialog').dialog('open');
                      }));

        window.settingsController = function ($scope) {
            $scope.so = gs.get_options();
            $scope.blAdd = function () {
                if ($scope.newBlacklistee) {
                    $scope.so.blacklist.push($scope.newBlacklistee);
                    $scope.newBlacklistee = '';
                }
            };
            $scope.blRemove = function (pname) {
                $scope.so.blacklist = $scope.so.blacklist.filter(function (pn) {
                    return pn !== pname;
                });
            };
            $scope.amblAdd = function () {
                if ($scope.newAMBlacklistee) {
                    $scope.so.automatch_blacklist.push($scope.newAMBlacklistee);
                    $scope.newAMBlacklistee = '';
                }
            };
            $scope.amblRemove = function (pname) {
                $scope.so.automatch_blacklist = $scope.so.automatch_blacklist.filter(function (pn) {
                    return pn !== pname;
                });
            };
            $scope.$watch('so.vp_refuse', function () {
                $scope.so.vp_request = $scope.so.vp_request && !$scope.so.vp_refuse;
            });
            $scope.$watch('so.vp_request', function () {
                $scope.so.vp_refuse = $scope.so.vp_refuse && !$scope.so.vp_request;
            });
            $scope.$watch('so', function () {
                gs.set_options($scope.so);
            }, true);
            $scope.$watch(gs.get_options, function () {
                $scope.so = gs.get_options();
            }, true);
        };
        angular.bootstrap($('#settingsDialog'));
    };

    window.GokoSalvager.depWait(
        ['GokoSalvager', 'GokoSalvager.get_option',
         'jQuery', 'angular',
         '#viewport', '.fs-rs-logout-row'],
        100, createSettingsDialog, this, 'User Settings Dialog'
    );
}());

