(function () {
    "use strict";

    GS.modules.vpcounterui = new GS.Module('VP Counter');
    GS.modules.vpcounterui.dependencies = ['$', '#sidebar', 'angular'];
    GS.modules.vpcounterui.load = function () {
        // Build UI using jQuery
        $('#vptable').attr('ng-app', 'vpApp')
                     .attr('ng-controller', 'vpController')
                     .attr('id', 'vptable')
                     .addClass('vptable')
                     .attr('ng-show', 'vp.vpon')
            .append($('<tbody>')
                .append($('<tr>').attr('ng-repeat',
                                       'player in playerList | orderBy:"vps":true')
                    .addClass('{{player.pclass}}')
                    .append($('<td>').text('{{player.pname}}'))
                    .append($('<td>').text('{{player.vps}}')))
                .append($('<tr>').attr('ng-show', 'debugMode')
                    .append($('<td>').text('{{vp.locked}}'))));

        // Bind UI to model using AngularJS
        window.vpController = function ($scope) {
            $scope.vp = GS.vp.toggle;
            $scope.playerList = _.values(GS.vp.toggle.players);
            $scope.debug = false;
            $scope.$watch(function () {
                return GS.vp.toggle;
            }, function () {
                $scope.playerList = _.values(GS.vp.toggle.players);
                $scope.vp = GS.vp.toggle;
            }, true);
        };
        angular.bootstrap($('#vptable'));

    };
}());
