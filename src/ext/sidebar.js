/*jslint browser: true, devel: true, indent: 4, es5: true, vars: true, nomen: true, regexp: true, forin: true, white:true */
/*global jQuery, _, $, Audio  */

var createSidebar, resizeSidebar;

// Resize and reposition the logviewer to match the new window size
resizeSidebar = function (gs) {
    "use strict";

    // Keep Goko play area in center
    if ($('#sidebar').css('display') === 'none') {
        return;
    }

    // Move Goko play area to far left
    // Note that the usual jQuery .css() function doesn't have precendence
    // over the entries in Goko's .css files.
    $('#goko-game').attr('style', 'left: 0px !important; margin-left: 0px !important');

    // Calculate new logviewer size and position
    var goko_w = $('#myCanvas').width();
    var w = window.innerWidth - goko_w;

    // Resize and reposition the sidebar
    $('#sidebar').css('left', goko_w + 'px')
                 .css('width', w + 'px')
                 .css('margin-top', $('#myCanvas').css('margin-top'))
                 .css('height', $('#myCanvas').css('height'));

    // Scroll to bottom of log
    $('#prettylog').css('max-height',$('#sidebar').height() - $('#sidebar').css('margin-top').replace('px', 0));
    $('#prettylog').scrollTop(99999999);
};

// Add logviewer to GUI
createSidebar = function (gs, logManager) {
    "use strict";
    $('#goko-game').append(
        ['<div id="sidebar">',
         '  <table id="vptable" class="vptable">',
         '    <tr>',
         '      <td>Player 1</td>',
         '      <td>500</td>',
         '    </tr>',
         '  </table>',
         '  <div id="prettylog"></div>',
         '</div>'
        ].join('\n')
    );

    // Hide sidebar until first game message
    $('#sidebar').hide();

    gs.alsoDo(logManager, 'addLog', null, function (opt) {
        if ($('#goko-game').css('display') !== 'none') {
            // TODO: this is excessive
            $('#sidebar').show();
            resizeSidebar(gs);
        }
    });

    window.addEventListener('resize', function () {
        setTimeout(function () {
            resizeSidebar(gs);
        }, 100);
    }, false);
};

window.GokoSalvager.depWait(
    ['GokoSalvager',
     'Dom.LogManager'],
    100, createSidebar, this, 'Sidebar'
);
