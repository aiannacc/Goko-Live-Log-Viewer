/*jslint browser: true, devel: true, indent: 4, maxlen: 90, es5: true */
/*global $, GS */

(function () {
    "use strict";

    var mod = GS.modules.automatchGamePop = new GS.Module('Automatch Game Popup');
    mod.dependencies = ['$'];
    mod.load = function () {
        GS.AM = GS.AM || {};

        GS.AM.appendGamePopup = function (viewport) {
            viewport.append([
                '<div id="gamepop" title="Creating Automatch Game">',
                '  ',
                '  Host: <div id="gamehost"></div><br>',
                '  Guests: <ul id="gameguests"></ul><br>',
                '  ',
                '  <p>',
                '    Automatch will create the game and seat you automatically.',
                '    This dialog should disappear shortly.',
                '  </p>',
                '  ',
                '  <input type="button" id="abortgame" value="Abort" />',
                '</div>'
            ].join('\n'));

            $('#gamepop').dialog({
                modal: false,
                width: 500,
                draggable: true,
                resizeable: false,
                autoOpen: false
            });

            $('#abortgame').click(function (evt) {
                $('#abortgame').prop('disabled', true);
                GS.AM.abortGame();
                $('#gamepop').css('visibility', 'hidden');
            });
        };

        // Update and show/hide the dialog
        GS.AM.showGamePop = function (visible) {
            if (typeof visible === "undefined") {
                visible = true;
            }

            $('#gamehost').html();
            $('#gameguests').empty();

            if (GS.AM.state.game !== null) {
                var hostname = GS.AM.state.game.hostname;
                $('#gamehost').html(hostname);

                // List guest names
                GS.AM.state.game.seeks.map(function (s) {
                    return s.player.pname;
                }).filter(function (pname) {
                    return pname !== GS.AM.state.game.hostname;
                }).map(function (pname) {
                    $('#gameguests').append('<li>' + pname + '</li>');
                });

                $('#abortgame').prop('disabled', false);
            }
            $('#gamepop').dialog(visible ? 'open' : 'close');
        };
    };
}());
