var loadAMSeekPop = function() {
    if (typeof AM === 'undefined') {
        AM = {}
    }

    AM.appendSeekPopup = function(viewport) {
        viewport.append($(AM.getSeekPopHTML()));
        AM.configureSeekPop();
    }

    AM.getSeekPopHTML = function() {
        return ['<div id="seekPop" style="visibility:hidden">',
                '  <h3 style="text-align:center">Request Automatch</h3>',
                '  <table>',
                '    <tr>',
                '      <td colspan="2">',
                '        <label>Min Players:</label>',
                '        <select class="wtfgoko" id="minPlayers">',
                '          <option value="2">2</option>',
                '          <option value="3">3</option>',
                '          <option value="4">4</option>',
                '          <option value="5">5</option>',
                '          <option value="6">6</option>',
                '        </select>',
                '      </td>',
                '      <td colspan="2">',
                '        <label>Min Sets:</label>',
                '        <select class="wtfgoko" id="minSets">',
                '          <option selected class="wtfgoko" value="1">Base Only</option>',
                '          <option value="2">2</option>',
                '          <option value="3">3</option>',
                '          <option value="4">4</option>',
                '          <option value="5">5</option>',
                '          <option value="6">6</option>',
                '          <option value="7">7</option>',
                '          <option value="8">8</option>',
                '          <option value="9">9</option>',
                '          <option value="10">10</option>',
                '          <option value="12">12</option>',
                '          <option value="13">13</option>',
                '          <option value="14">14</option>',
                '          <option value="15">All Cards</option>',
                '        </select>',
                '      </td>',
                '    </tr>',
                '    <tr>',
                '      <td colspan="2">',
                '        <label>Max Players:</label>',
                '        <select class="wtfgoko" id="maxPlayers">',
                '          <option value="2">2</option>',
                '          <option value="3">3</option>',
                '          <option value="4">4</option>',
                '          <option value="5">5</option>',
                '          <option value="6">6</option>',
                '        </select>',
                '      </td>',
                '      <td colspan="2">',
                '        <label>Max Sets:</label>',
                '        <select class="wtfgoko" id="maxSets">',
                '          <option value="1">Base Only</option>',
                '          <option value="2">2</option>',
                '          <option value="3">3</option>',
                '          <option value="4">4</option>',
                '          <option value="5">5</option>',
                '          <option value="6">6</option>',
                '          <option value="7">7</option>',
                '          <option value="8">8</option>',
                '          <option value="9">9</option>',
                '          <option value="10">10</option>',
                '          <option value="12">12</option>',
                '          <option value="13">13</option>',
                '          <option value="14">14</option>',
                '          <option selected class="wtfgoko" value="15">All Cards</option>',
                '        </select>',
                '      </td>',
                '    </tr>',
                '  </table>',
                '  <table>',
                '    <tr>',
                '      <td colspan="1">',
                '        <label>Rating +/-</label>',
                '      </td>',
                '      <td colspan="1">',
                '        <input type="number" id="rdiff" value="1000" size="4"/>',
                '      </td>',
                '    </tr>',
                '    <tr>',
                '      <td colspan="1">',
                '        <label>System</label>',
                '      </td>',
                '      <td colspan="1">',
                '        <select class="wtfgoko" id="ratingSystem">',
                '          <option value="pro">Pro</option>',
                '          <option value="casual">Casual</option>',
                '        </select>',
                '      </td>',
                '    </tr>',
                '    <tr>',
                '      <td colspan="1">',
                '        <input type="submit" id="seekreq" value="Submit" />',
                '      </td>',
                '      <td colspan="1">',
                '        <input type="submit" id="seekcan" value="Cancel" />',
                '      </td>',
                '      <td colspan="1">',
                '        <input type="submit" id="seekhide" value="Hide" />',
                '      </td>',
                '    </tr>',
                '    <tr>',
                '      <td colspan="4">',
                '        <div id="seekstatus"></div>',
                '      </td>',
                '    </tr>',
                '  </table>',
                '</div>'].join('');
    };

    // Define UI behavior
    AM.configureSeekPop = function() {
        // Override Goko's "hide select" elements by default" nonsense
        $('#seekPop .wtfgoko').css('visibility', 'inherit');
        $('#seekPop .wtfgoko').css('top', 'auto');

        // Make this into a lightbox-style dialog
        $('#seekPop').css("position", "absolute");
        $('#seekPop').css("top", "50%");
        $('#seekPop').css("left", "50%");
        $('#seekPop').css("height", "250px");
        $('#seekPop').css("margin-top", "-125px");
        $('#seekPop').css("width", "40%");
        $('#seekPop').css("margin-left", "-20%");
        $('#seekPop').css("background", "white");

        // Submit request    
        $('#seekreq').click(function() {
            console.log('requested seek');

            var np = {class: 'NumPlayers', props: {}};
            np.props.min_players = parseInt($('#minPlayers').val());
            np.props.max_players = parseInt($('#maxPlayers').val());

            var ns = {class: 'NumSets', props: {}};
            ns.props.min_sets = parseInt($('#minSets').val());
            ns.props.max_sets = parseInt($('#maxSets').val());

            var rr = {class: 'RelativeRating', props: {}};
            rr.props.pts_lower = parseInt($('#rdiff').val());
            rr.props.pts_higher = parseInt($('#rdiff').val());
            rr.props.rating_system = $('#ratingSystem').val();

            var rs = {class: 'RatingSystem', props: {}};
            rs.props.rating_system = $('#ratingSystem').val();

            // Send seek request
            AM.state.seek = {player: AM.player,
                             requirements: [np, ns, rr, rs]};
            AM.sendMessage('SUBMIT_SEEK', {seek: AM.state.seek});

            // Hide the dialog
            AM.showSeekPop(false);
        });

        // Cancel outstanding request, if any, and close dialog
        $('#seekcan').click(function() {
            if (AM.state.seek !== null) {
                AM.state.seek.canceling = true;
                AM.sendMessage('CANCEL_SEEK',
                    {seekid: AM.state.seek.seekid},
                    function() { AM.state.seek = null; });
            }
            AM.showSeekPop(false);
        });

        $('#seekhide').click(function() {
            AM.showSeekPop(false);
        });


        /*
         * Input validation
         */

        $('#minPlayers').change(function() {
            if (parseInt($('#minPlayers').val()) > parseInt($('#maxPlayers').val())) {
                $('#maxPlayers').val($('#minPlayers').val());
            }
        });

        $('#maxPlayers').change(function() {
            if (parseInt($('#maxPlayers').val()) < parseInt($('#minPlayers').val())) {
                $('#minPlayers').val($('#maxPlayers').val());
            }
        });

        $('#minSets').change(function() {
            if (parseInt($('#minSets').val()) > parseInt($('#maxSets').val())) {
                $('#maxSets').val($('#minSets').val());
            }
        });

        $('#maxSets').change(function() {
            if (parseInt($('#maxSets').val()) < parseInt($('#minSets').val())) {
                $('#minSets').val($('#maxSets').val());
            }
        });
    };

    // Update and show/hide the dialog
    AM.showSeekPop = function(visible) {
        if (typeof visible === "undefined") {
            visible = true;
        }

        var connected = AM.ws !== null && AM.ws.readyState === 1;
        var playerLoaded = AM.player.sets_owned
            && AM.player.rating.hasOwnProperty('goko_casual_rating')
            && AM.player.rating.hasOwnProperty('goko_pro_rating');
        var seeking = (AM.state.seek !== null);
        var canceling = seeking && AM.state.seek.hasOwnProperty('canceling');

        $('#seekPop select').prop('disabled', seeking || canceling); 
        $('#seekPop input').prop('disabled', seeking || canceling);
        $('#seekreq').prop('disabled', 
                seeking || canceling || !connected || !playerLoaded);
        $('#seekcan').prop('disabled', canceling);
        $('#seekhide').prop('disabled', false);
        $('#seekstatus').html(seeking ? 'Looking for a match...' : '');

        $('#seekPop').css('visibility', visible ? 'visible' : 'hidden');
    };
};

// Execute our code in Goko's JS context by appending it to the document
var script = document.createElement('script');
script.textContent = '(' + loadAMSeekPop + ')();';
document.body.appendChild(script);
