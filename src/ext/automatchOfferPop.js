var loadAMOfferPop = function() {
    if (typeof AM === 'undefined') {
        AM = {}
    }

    AM.appendOfferPopup = function(viewport) {
        viewport.append($(AM.getOfferPopHTML()));
        AM.configureOfferPop();
    }

    AM.getOfferPopHTML = function() {
        return ['<div id="offerPop" style="visibility:hidden">',
                '  <h3 style="text-align:center">Match Found</h3>',
                '  ',
                '  Players:<br>',
                '  <ul id="plist"> </ul>',
                '  Host: <label id="offerhost" /><br>',
                '  Sets: <label id="offersets" /><br>',
                '  Rating: <label id="offerrating" /><br>',
                '  Room: <label id="offerroom" /><br>',
                '  ',
                '  <p id="offerwaitinfo" />',
                '  ',
                '  <input type="button" class="automatch offer" id="offeracc" value="Accept" />',
                '  <input type="button" class="automatch offer" id="offerdec" value="Decline/Cancel" />',
                '</div>'
               ].join('\n');
    };

    // Define UI behavior
    AM.configureOfferPop = function() {

        // Override Goko's "hide select" elements by default" nonsense
        $('#offerPop .wtfgoko').css('visibility', 'inherit');
        $('#offerPop .wtfgoko').css('top', 'auto');

        // Make this into a lightbox-style dialog
        $('#offerPop').css("position", "absolute");
        $('#offerPop').css("top", "50%");
        $('#offerPop').css("left", "50%");
        $('#offerPop').css("height", "300px");
        $('#offerPop').css("margin-top", "-150px");
        $('#offerPop').css("width", "40%");
        $('#offerPop').css("margin-left", "-20%");
        $('#offerPop').css("background", "white");

        $('#offeracc').click(function (evt) {
            AM.state.offer.accepted = true;

            // Disable UI while waiting for server response.
            $('#offeracc').prop('disabled', true);
            $('#offerrej').prop('disabled', true);
            $('#offerwaitinfo').html('Accepted offer. Waiting for server to confirm.');

            // Notify server
            AM.sendMessage('ACCEPT_OFFER', {matchid: AM.state.offer.matchid}, function() {
                $('#offerwaitinfo').html('Accepted offer. Waiting for opponents(s) to accept.');
                $('#offeracc').prop('disabled', true);
                $('#offerrej').prop('disabled', false);
            });
        });

        $('#offerdec').click(function (evt) {
            AM.showOfferPop(false);

            if (AM.state.offer.accepted !== null && AM.state.offer.accepted) {
                AM.sendMessage('UNACCEPT_OFFER', {matchid: AM.state.offer.matchid}, function() {
                    AM.state.offer = null;
                });
            } else {
                AM.sendMessage('DECLINE_OFFER', {matchid: AM.state.offer.matchid}, function() {
                    AM.state.offer = null;
                });
            }
        });
    }

    // Update and show/hide the dialog
    AM.showOfferPop = function(visible) {
        if (typeof visible === "undefined") {
            visible = true;
        }

        if (AM.state.offer !== null) {
            // List players
            $('#plist').empty();
            AM.state.offer.seeks.map(function(s) {
                var p = s.player.pname + ' [' + s.player.rating.goko_pro_rating + ']'
                $('#plist').append('<li>' + p + '</li>');
                // TODO: use casual rating if it's a casual game
            });

            // List or count card sets
            var sets = AM.getHost(AM.state.offer).sets_owned;
            switch(sets.length) {
                case 15:
                    $('#offersets').html('All Cards');
                    break;
                case 1:
                    $('#offersets').html('Base Only');
                    break;
                case 2: case 3:
                    $('#offersets').html(sets.join(', '));
                    break;
                default:
                    $('#offersets').html(sets.length + ' sets');
            }

            $('#offerrating').html(AM.state.offer.rating_system);
            $('#offerhost').html(AM.state.offer.hostname);
            $('#offerroom').html(AM.state.offer.roomname);
            $('#offerwaitinfo').html('');
            $('#offeracc').prop('disabled', false);
            $('#offerrej').prop('disabled', false);
        }
        $('#offerPop').css('visibility', visible ? 'visible' : 'hidden');
    };
};

// Execute our code in Goko's JS context by appending it to the document
var script = document.createElement('script');
script.textContent = '(' + loadAMOfferPop + ')();';
document.body.appendChild(script);
