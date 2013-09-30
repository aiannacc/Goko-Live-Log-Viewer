/*jslint browser: true, devel: true, indent: 4, es5: true, vars: true, nomen: true, regexp: true, forin: true, white:true */
/*global $, Audio, GS, Dom  */

(function () {
    "use strict";

    var mod = GS.modules.sidebar = new GS.Module('Sidebar');
    mod.dependencies = ['Dom.LogManager'];
    mod.load = function () {
        // Resize and reposition the logviewer to match the new window size
        GS.resizeSidebar = function () {
        
            // Hide sidebar if disabled in options
            if (!GS.get_option('sidebar')) {
                $('#sidebar').css('display', 'none');
            }
        
            // Keep Goko play area in center
            if ($('#sidebar').css('display') === 'none') {
                $('#goko-game').attr('style', 'left: 50% !important; margin-left: -512px !important');
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
                         .css('height', $('#myCanvas').css('height'))
                         .css('border-collapse', 'collapse');

            $('#chatdiv').css('visibility', GS.get_option('sidebar_chat') ? 'visible' : 'hidden');
            $('#chatdiv').css('height', 200);
            $('#chatarea').width($('#chatdiv').width()-2)
                          .height(166);
            $('#chatline').width($('#chatdiv').width()-2)
                          .height(20);

            var logheight = $('#sidebar').height() - 20
                - ($('#vptable').is(':visible') ? $('#vptable').height() : 0)
                - ($('#chatdiv').is(':visible') ? $('#chatdiv').height() : 0);
            $('#prettylog').css('height', logheight);
        
            // Scroll to bottom of log
            $('#prettylog').scrollTop(99999999);
        };
        
        // Add sidebar to GUI
        // Children: VP table, prettified log
        $('#goko-game')
            .append($('<div>').attr('id', 'sidebar')
                .append($('<table>').attr('id', 'vptable'))
                .append($('<div>').attr('id', 'prettylog'))
                .append($('<div>').attr('id', 'chatdiv')));
     
        // Hide sidebar until first game message
        $('#sidebar').hide();
     
        GS.alsoDo(Dom.LogManager, 'addLog', null, function (opt) {
            if ($('#goko-game').css('display') !== 'none') {
                // TODO: this is excessive
                $('#sidebar').show();
                GS.resizeSidebar();
            }
        });
     
        window.addEventListener('resize', function () {
            setTimeout(function () {
                GS.resizeSidebar();
            }, 100);
        }, false);
    };
}());
