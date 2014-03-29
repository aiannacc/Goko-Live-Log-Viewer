/*jslint browser:true, devel:true, es5:true, nomen:true, forin:true, vars:true */
/*globals $, _, angular, GS, */

(function () {
    "use strict";
    console.log('Loading Settings Dialog');
    GS.modules.blacklistSync = new GS.Module('Blacklist Sync');
    GS.modules.blacklistSync.dependencies = [
        '$',
        'angular',
    ];
    GS.modules.blacklistSync.load = function () {

        // Dialog for reconciling differences between local and server
        // versions of blacklist.
        $('<div>').attr('id', 'blReconcile')
                  .attr('title', 'Blacklist Conflict')
                  .attr('ng-app', 'settingsApp')
                  .attr('ng-controller', 'blReconcileController')
            .append("The blacklist on this computer is out of sync "
                  + "with the version stored on " + GS.wsdomain + ":<br>")
            .append($('<br>'))
            .append($('<table>').addClass('indented')
                .append($('<tr>')
                    .append($('<td><b>Player&nbsp;</b></td><td><b>Difference</b></td>')))
                .append($('<tr ng-repeat="(pname, desc) in diff">')
                    .append($('<td>{{pname}}</td>'))
                    .append($('<td>{{desc}}</td>'))))
            .append($('<br>'))
            .append('Which version do you want to keep?  If you aren\'t sure '
                  + 'what this means, click "Merge Them."')
            .dialog({
                resizeable: false,
                width: 500,
                maxHeight: $(window).height(),
                height: "auto",
                modal: true,
                autoOpen: false,
                closeOnEscape: false,
                buttons: {
                    "Local": function () {
                        // NOTE: Closing the dialog with the "X" will do
                        // same thing, but the user may not realize it.
                        // No change to local list necessary.
                        $('#blReconcile').scope().saveLocalList();
                        $('#blReconcile').scope().callback();
                        $('#blReconcile').dialog('close');
                    },
                    "Server": function () {
                        $('#blReconcile').scope().saveServerList();
                        $('#blReconcile').scope().callback();
                        $('#blReconcile').dialog('close');
                    },
                    "Merge Them": function () {
                        $('#blReconcile').scope().saveMergedList();
                        $('#blReconcile').scope().callback();
                        $('#blReconcile').dialog('close');
                    }
                },
                open: function () {
                    var helpURL = 'https://github.com/aiannacc/Goko-Salvager/'
                                + 'wiki/User-Settings#blacklist-settings';
                    $(this).parent().children(".ui-dialog-titlebar")
                        .append($('<a>').attr('href', helpURL)
                                        .attr('target', '_blank')
                                        .css('text-decoration', 'underline')
                                        .css('color', '#0000cc')
                            .append('Help'));
                }
            });

        // "X" button shouldn't close if there are unresolved differences
        $('#blReconcile').on("dialogbeforeclose", function (event, ui) {
            return $('#blReconcile').scope().resolved;
        });

        // Compare local and server versions of the user's blacklist.
        // Open UI to reconcile them, if necessary.
        GS.reconcileBlacklist = function (callback) {
            GS.WS.sendMessage('QUERY_BLACKLIST', {}, function (resp) {
                if (resp === null) {
                    console.log("Cannot compare blacklists: no GS connection");
                }
                var equalLists = $('#blReconcile').scope().setLists(
                    GS.get_option('blacklist2'),
                    resp.blacklist
                );
                if (equalLists) {
                    callback();
                } else {
                    $('#blReconcile').scope().callback = callback;
                    $('#blReconcile').dialog('open');
                }
            });
        };
    
        GS.submitBlacklist = function () {
            var blist = GS.get_option('blacklist2');

            // First delete the angularJS display hash keys
            _.keys(blist).map(function (pname) {
                delete blist[pname].$$hashKey;
            });

            // Try to send blacklist to gokosalvager
            if (GS.WS.isConnReady()) {
                GS.WS.sendMessage('SUBMIT_BLACKLIST', {
                    blacklist: blist,
                    merge: false
                });
            } else {
                console.log('No connection to ' + GS.WS.domain + '.  '
                          + 'Cannot submit blacklist.');
            }
        };
    
        // angularJS Controller for blacklist reconciliation UI
        window.blReconcileController = function ($scope) {
            $scope.local = null;
            $scope.remote = null;
            $scope.diff = {};
            $scope.resolved = false;

            $scope.setLists = function (local, remote) {
                $scope.resolved = false;
                $scope.local = local;
                $scope.remote = remote;
                $scope.diff = {};
                _.keys(remote).map(function (pname) {
                    if (!local.hasOwnProperty(pname)) {
                        $scope.diff[pname] = "Only in server version";
                    } else if (local[pname].noplay !== remote[pname].noplay) {
                        $scope.diff[pname] = "Kick setting differs";
                    } else if (local[pname].nomatch !== remote[pname].nomatch) {
                        $scope.diff[pname] = "Automatch setting differs";
                    } else if (local[pname].censor !== remote[pname].censor) {
                        $scope.diff[pname] = "Censor setting differs";
                    }
                });
                _.keys(local).map(function (pname) {
                    if (!remote.hasOwnProperty(pname)) {
                        $scope.diff[pname] = "Only in local version";
                    }
                });

                // Notify angularJS that the reconcile UI's model has changed
                $scope.$digest();

                // Return whether the two lists differ
                return _.isEmpty($scope.diff);
            };

            $scope.saveLocalList = function () {
                GS.set_option('blacklist2', $scope.local);
                $scope.resolved = true;
            };

            $scope.saveServerList = function () {
                GS.set_option('blacklist2', $scope.remote);
                $scope.resolved = true;
            };

            $scope.saveMergedList = function () {
                _.keys($scope.remote).map(function (pname) {
                    $scope.local[pname] = $scope.remote[pname];
                });
                GS.set_option('blacklist2', $scope.local);
                $scope.resolved = true;
            };
        };

        // Initialize the angularJS controller
        angular.bootstrap($('#blReconcile'));
    };
}());
