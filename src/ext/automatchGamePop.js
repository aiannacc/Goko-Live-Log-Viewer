/*jslint browser: true, devel: true, indent: 4, maxlen: 90, es5: true */
/*global jQuery, $ */

(function () {
    "use strict";

    var gs = window.GokoSalvager;
    gs.AM = gs.AM || {};

    gs.AM.appendGamePopup = function (viewport) {
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
            modal: true,
            width: 500,
            draggable: false,
            resizeable: false,
            autoOpen: false
        });

        $('#abortgame').click(function (evt) {
            $('#abortgame').prop('disabled', true);
            gs.AM.abortGame();
            $('#gamepop').css('visibility', 'hidden');
        });
    };

    // Update and show/hide the dialog
    gs.AM.showGamePop = function (visible) {
        if (typeof visible === "undefined") {
            visible = true;
        }

        $('#gamehost').html();
        $('#gameguests').empty();

        if (gs.AM.state.game !== null) {
            var hostname = gs.AM.state.game.hostname;
            $('#gamehost').html(hostname);

            // List guest names
            gs.AM.state.game.seeks.map(function (s) {
                return s.player.pname;
            }).filter(function (pname) {
                return pname !== gs.AM.state.game.hostname;
            }).map(function (pname) {
                $('#gameguests').append('<li>' + pname + '</li>');
            });

            $('#abortgame').prop('disabled', false);
        }
        $('#gamepop').dialog(visible ? 'open' : 'close');
    };
}());
