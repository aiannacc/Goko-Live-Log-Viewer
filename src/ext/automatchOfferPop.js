(function () {
    "use strict";

    var mod = GS.modules.automatchOfferPop = new GS.Module('Automatch Offer Popup');
    mod.dependencies = ['$'];
    mod.load = function () {
        GS.AM = GS.AM || {};

        GS.AM.appendOfferPopup = function (viewport) {
            viewport.append([
                '<div id="offerPop" title="Automatch Found">',
                '  Host: <label id="offerhost" /><br>',
                '  Guests:<br>',
                '  <ul id="plist"> </ul>',
                '  Sets: <label id="offersets" /><br>',
                '  Rating: <label id="offerrating" /><br>',
                '  VP Counter: <label id="offervpc" /><br>',
                '  ',
                '  <p id="offerwaitinfo" />',
                '  ',
                '  <div>',
                '    <textarea id="amChatArea" style="width:100%" ',
                '     readOnly="true" rows="5" />',
                '    <input type="text" id="amChatLine" style="width:100%"/><br>',
                '  </div>',
                '  ',
                '  <input type="button" id="offeracc" value="Accept" />',
                '  <input type="button" id="offerdec" value="Decline/Cancel" />',
                '</div>'
            ].join('\n'));

            GS.AM.showOfferChat = function (pname, text) {
                $('#amChatArea').val($('#amChatArea').val()
                    + pname + ': ' + text + '\n');
            };

            $('#amChatLine').keyup(function (e) {
                if (e.keyCode === 13) {
                    var chatLine = $('#amChatLine').val();
                    $('#amChatLine').val('');
                    GS.AM.sendChat(chatLine);
                }
            });

            $('#offerPop').dialog({
                modal: false,
                width: 500,
                draggable: true,
                resizeable: false,
                autoOpen: false
            });

            $('#offeracc').click(function (evt) {
                GS.AM.state.offer.accepted = true;

                // Disable UI while waiting for server response.
                $('#offeracc').prop('disabled', true);
                $('#offerrej').prop('disabled', true);
                $('#offerwaitinfo').text('Accepted. Waiting for confirmation.');

                // Notify server
                GS.AM.acceptOffer(function () {
                    $('#offerwaitinfo').text('Accepted offer. Waiting for opp(s).');
                    $('#offeracc').prop('disabled', true);
                    $('#offerrej').prop('disabled', false);
                });
            });

            $('#offerdec').click(function (evt) {
                GS.AM.showOfferPop(false);

                if (GS.AM.state.offer.accepted !== null && GS.AM.state.offer.accepted) {
                    GS.AM.unacceptOffer();
                } else {
                    GS.AM.declineOffer();
                }
            });
        };

        // Update and show/hide the dialog
        GS.AM.showOfferPop = function (visible) {
            if (visible === undefined) {
                visible = true;
            }

            if (visible) {
                $('#amChatArea').val('');
                $('#amChatLine').val('');
                $('#amChatLine').focus();
            }

            if (GS.AM.state.offer !== null) {
                // List players
                $('#plist').empty();
                GS.AM.state.offer.seeks.filter(function (s) {
                    return s.player.pname !== GS.AM.state.offer.hostname;
                }).map(function (s) {
                    // TODO: use casual rating if it's a casual game
                    var p = s.player.pname
                            + ' [Pro Rating: ' + s.player.rating.goko_pro_rating + ']';
                    $('#plist').append('<li>' + p + '</li>');
                });

                // List or count card sets
                var host = GS.AM.state.offer.seeks.map(function (seek) {
                    return seek.player;
                }).filter(function (player) {
                    return player.pname === GS.AM.state.offer.hostname;
                })[0];
                var hostsets = host.sets_owned;

                switch (hostsets.length) {
                case 15:
                    $('#offersets').text('All Cards');
                    break;
                case 1:
                    $('#offersets').text('Base Only');
                    break;
                case 2:
                case 3:
                    $('#offersets').text(hostsets.join(', '));
                    break;
                default:
                    $('#offersets').text(hostsets.length + ' sets');
                }

                $('#offervpc').text(GS.AM.state.offer.vpcounter === null
                        ? "Not specified" : (GS.AM.state.offer.vpcounter ? 'On' : 'Off'));

                $('#offerrating').text(GS.AM.state.offer.rating_system);

                $('#offerhost').text(GS.AM.state.offer.hostname
                            + ' [Pro Rating: ' + host.rating.goko_pro_rating + ']');

                $('#offerroom').text(GS.AM.state.offer.roomname);
                $('#offerwaitinfo').text('If you accept, Automatch will take you '
                        + 'and your opponent(s) to ' + GS.AM.state.offer.roomname
                        + ' and create a new game there.');
                $('#offeracc').prop('disabled', false);
                $('#offerrej').prop('disabled', false);
            }
            $('#offerPop').dialog(visible ? 'open' : 'close');
        };
    };
}());
