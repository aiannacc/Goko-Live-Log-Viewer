/*jslint browser: true, devel: true, indent: 4, maxlen: 90, es5: true */
/*global $, angular, GS */

(function () {
    "use strict";
    console.log('Loading replacement create game dialog.');

    var mod = GS.modules.createGameDialog
        = new GS.Module('Replacement Create Game Dialog');
    mod.dependencies = [
        '$',
        'angular',
        '#viewport',
        '.room-section-header-buttons',
        '.room-section-btn-create-table',
        // TODO: remove this unfathomably ugly hack
        '#quickGameButton'
    ];
    mod.load = function () {
        $('#viewport').append([
            '<div id="createGameDialog" title="Create Game" ',
            '     ng:app="createGameApp"',
            '     ng:controller="createGameController">',
            '  <table>',
            '    <tr>',
            '      <td colspan="2">',
            '        <label>Title:</label>',
            '      </td>',
            '      <td>',
            '        <input type="text" ng:model="cg.title" size="30">',
            '      </td>',
            '    </tr>',
            '    <tr>',
            '      <td colspan="2"/>',
            '      <td>',
            '        <input type="text" ng:model="cg.genTitle" size="30">',
            '      </td>',
            '    </tr>',
            '    <tr>',
            '      <td colspan="2"/>',
            '      <td>',
            '        Players: ',
            '        <select ng:model="cg.numPlayers">',
            '          <option value="2">2</option>',
            '          <option value="3">3</option>',
            '          <option value="4">4</option>',
            '          <option value="5">5</option>',
            '          <option value="6">6</option>',
            '        </select>',
            '        Rating: ',
            '        <select id="ratingSystem" ng:model="cg.rSystem">',
            '          <option value="pro">Pro</option>',
            '          <option value="casual">Casual</option>',
            '          <option value="unrated">Unrated</option>',
            '        </select>',
            '      </td>',
            '    </tr>',
            '    <tr>',
            '      <td colspan="2">Opponent:</td>',
            '    </tr>',
            '    <tr>',
            '      <td>&nbsp;&nbsp;</td>',
            '      <td>Rating:</td>',
            '      <td>',
            '        <input type="number" min="0" max="9999" ',
            '               step="1" ng:model="cg.minRating" size="4">',
            '        to',
            '        <input type="number" min="0" max="9999" ',
            '               step="1" ng:model="cg.maxRating" size="4">',
            '        <input type="checkbox" ng:model="cg.automatch">',
            '               Use Automatch?',
            '      </td>',
            '    </tr>',
            '    <tr>',
            '      <td/>',
            '      <td>Name:</td>',
            '      <td><input type="text" ng:model="cg.oppName" size="30"></td>',
            '    </tr>',
            '    <tr>',
            '      <td/>',
            '      <td>Blacklist:</td>',
            '      <td>',
            '        <input type="checkbox" ng:model="cg.myBlacklist">',
            '        Use my list',
            '        <input type="checkbox" ng:model="cg.commonBlacklist">',
            '        Use common list',
            '    </tr>',
            '    <tr>',
            '      <td colspan="2">Rules:</td>',
            '    </tr>',
            '    <tr>',
            '      <td/>',
            '      <td>VP Counter:</td>',
            '      <td>',
            '        <select ng:model="cg.vpon">',
            '          <option value="on">On</option>',
            '          <option value="off">Off</option>',
            '          <option value="in-game">Decide In-Game</option>',
            '        </select>',
            '      <td/>',
            '    </tr>',
            '    <tr>',
            '      <td/>',
            '      <td>Veto Mode:</td>',
            '      <td>',
            '        <select ng:model="cg.veto">',
            '          <option value="off">Off</option>',
            '          <option value="on">On</option>',
            '        </select>',
            '      <td/>',
            '    </tr>',
            '    <tr>',
            '      <td/>',
            '      <td>Shelters:</td>',
            '      <td>',
            '        <select ng:model="cg.shelters">',
            '          <option value="random">Random</option>',
            '          <option value="yes">Yes</option>',
            '          <option value="no">No</option>',
            '        </select>',
            '      <td/>',
            '    </tr>',
            '    <tr>',
            '      <td/>',
            '      <td>Colonies:</td>',
            '      <td>',
            '        <select ng:model="cg.colonies">',
            '          <option value="random">Random</option>',
            '          <option value="yes">Yes</option>',
            '          <option value="no">No</option>',
            '        </select>',
            '      <td/>',
            '    </tr>',
            '    </tr>',
            '    <tr>',
            '      <td/>',
            '      <td>Kingdom:</td>',
            '      <td>',
            '        <select ng:model="cg.kingdom">',
            '          <option value="random">Random</option>',
            '          <option value="selected">Pre-Selected</option>',
            '        </select>',
            '      </td>',
            '    </tr>',
            '    <tr>',
            '      <td/>',
            '      <td colspan="2">',
            '        If a standard-rules-only player joins:',
            '        <select ng:model="cg.ifStandardJoin">',
            '          <option value="ask">Ask me</option>',
            '          <option value="kick">Kick them</option>',
            '          <option value="kick+">Kick and explain why</option>',
            '          <option value="standard">Switch to  standard</option>',
            '        </select>',
            '      </td>',
            '    </tr>',
            '  </table>',
            '  <table id="createGameKingdom">',
            '    <tr>',
            '      ',
            '    </tr>',
            '  </table>',
            '  <input id="cgButton" type="button" value="Create Game">',
            '</div>'
        ].join(''));

        $('#cgButton').click(function () {
            console.log('Creating new game');
            console.log(GS.get_cg_options());
            GS.showCreateGameDialog(false);
        });

        $('#createGameDialog select').css('visibility', 'inherit');
        $('#createGameDialog select').css('top', 'auto');

        $('#createGameDialog').dialog({
            modal: false,
            width: 800,
            draggable: true,
            resizeable: false,
            autoOpen: false
        });

        // Add button to open new create game dialog
        // Remove old Goko create game button
        GS.showCreateGameDialog = function (visible) {
            if (typeof visible === "undefined") {
                visible = true;
            }
            $('#createGameDialog').dialog(visible ? 'open' : 'close');
        };
        $('.room-section-btn-create-table').remove();
        $('.room-section-header-buttons').append(
            $('<button id="automatchButton" />')
                .addClass('fs-mtrm-text-border')
                .addClass('fs-mtrm-dominion-btn')
                .html('Create Game II')
                .click(GS.showCreateGameDialog)
        );

        window.createGameController = function ($scope) {
            $scope.cg = GS.get_cg_options();

            $scope.generateTitle = function () {
                var out = $scope.cg.title;

                if ($scope.cg.oppName !== null) {
                    out += ' For ' + $scope.cg.oppName;
                }

                if ($scope.cg.vpon === 'on') {
                    out += ' #vpon';
                } else if ($scope.cg.vpon === 'off') {
                    out += ' #vpoff';
                }

                if ($scope.cg.minRating !== null
                        && $scope.cg.maxRating !== null) {
                    out += ' ' + $scope.cg.minRating;
                    out += '-' + $scope.cg.maxRating;
                } else if ($scope.cg.minRating !== null
                        && $scope.cg.maxRating === null) {
                    out += ' ' + $scope.cg.minRating + '+';
                } else if ($scope.cg.minRating === null
                        && $scope.cg.maxRating !== null) {
                    out += ' ' + $scope.cg.maxRating + '-';
                }

                return out;
            };

            $scope.$watch('cg', function () {
                $scope.cg.genTitle = $scope.generateTitle();
            });
            $scope.$watch('cg', function () {
                GS.set_cg_options($scope.cg);
            }, true);
            $scope.$watch(GS.get_options, function () {
                $scope.cg = GS.get_cg_options();
            }, true);
        };
        angular.bootstrap($('#createGameDialog'));
    };
}());
