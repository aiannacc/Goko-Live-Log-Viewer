/*jslint browser: true, devel: true, indent: 4, maxlen: 90, es5: true */
/*global jQuery, $ */

(function () {
    "use strict"; // JSList mode

    // Automatch global namespace
    var AM = window.AM = (window.AM || {});

    AM.appendOfferPopup = function (viewport) {
        viewport.append([
            '<div id="offerPop" title="Automatch Found">',
            '  Host: <label id="offerhost" /><br>',
            '  Guests:<br>',
            '  <ul id="plist"> </ul>',
            '  Sets: <label id="offersets" /><br>',
            '  Rating: <label id="offerrating" /><br>',
            //'  Room: <label id="offerroom" /><br>',
            '  ',
            '  <p id="offerwaitinfo" />',
            '  ',
            '  <input type="button" id="offeracc" value="Accept" />',
            '  <input type="button" id="offerdec" value="Decline/Cancel" />',
            '</div>'
        ].join('\n'));

        $('#offerPop').dialog({
            modal: true,
            width: 500,
            draggable: false,
            resizeable: false,
            autoOpen: false
        });

        $('#offeracc').click(function (evt) {
            AM.state.offer.accepted = true;

            // Disable UI while waiting for server response.
            $('#offeracc').prop('disabled', true);
            $('#offerrej').prop('disabled', true);
            $('#offerwaitinfo').html('Accepted. Waiting for confirmation.');

            // Notify server
            AM.acceptOffer(function () {
                $('#offerwaitinfo').html('Accepted offer. Waiting for opp(s).');
                $('#offeracc').prop('disabled', true);
                $('#offerrej').prop('disabled', false);
            });
        });

        $('#offerdec').click(function (evt) {
            AM.showOfferPop(false);

            if (AM.state.offer.accepted !== null && AM.state.offer.accepted) {
                AM.unacceptOffer();
            } else {
                AM.declineOffer();
            }
        });
    };

    // Update and show/hide the dialog
    AM.showOfferPop = function (visible) {
        if (typeof visible === "undefined") {
            visible = true;
        }

        if (AM.state.offer !== null) {
            // List players
            $('#plist').empty();
            AM.state.offer.seeks.filter(function (s) {
                return s.player.pname !== AM.state.offer.hostname;
            }).map(function (s) {
                // TODO: use casual rating if it's a casual game
                var p = s.player.pname
                        + ' [Pro Rating: ' + s.player.rating.goko_pro_rating + ']';
                $('#plist').append('<li>' + p + '</li>');
            });

            // List or count card sets
            var hostsets = AM.state.offer.seeks.map(function (seek) {
                return seek.player;
            }).filter(function (player) {
                return player.pname === AM.state.offer.hostname;
            })[0].sets_owned;

            switch (hostsets.length) {
            case 15:
                $('#offersets').html('All Cards');
                break;
            case 1:
                $('#offersets').html('Base Only');
                break;
            case 2:
            case 3:
                $('#offersets').html(hostsets.join(', '));
                break;
            default:
                $('#offersets').html(hostsets.length + ' sets');
            }

            $('#offerrating').html(AM.state.offer.rating_system);
            $('#offerhost').html(AM.state.offer.hostname);
            $('#offerroom').html(AM.state.offer.roomname);
            $('#offerwaitinfo').html('If you accept, Automatch will take you '
                    + 'and your opponent(s) to ' + AM.state.offer.roomname
                    + ' and create a new game there.');
            $('#offeracc').prop('disabled', false);
            $('#offerrej').prop('disabled', false);
        }
        $('#offerPop').dialog(visible ? 'open' : 'close');
    };
}());
