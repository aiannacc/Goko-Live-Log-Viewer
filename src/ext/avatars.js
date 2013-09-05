/*jslint browser: true, devel: true, indent: 4, vars: true, nomen: true, regexp: true, forin: true, white:true */
/*global $, _ */

/*
 * Custom Avatar module
 */
var loadAvatarModule = function (gs, gp, ls) {
    "use strict";

    var myCanvas = document.createElement("canvas");
    var myContext = myCanvas.getContext("2d");
    gp.old_AvatarLoader = gp.AvatarLoader;
    gp.AvatarLoader = function (userdata, callback) {
        function loadImage() {
            var img = new Image();
            var img2 = new Image();
            img.onerror = img2.onerror = function () {
                gp.old_AvatarLoader(userdata, callback);
            };
            img.onload = function () {
                try {
                    var size = [50, 100, 256][userdata.which];
                    myCanvas.width = size;
                    myCanvas.height = size;
                    myContext.drawImage(img, 0, 0, img.width, img.height, 0, 0, size, size);
                    img2.onload = function () { callback(img2); };
                    img2.src = myCanvas.toDataURL("image/png");
                } catch (e) {
                    console.err(e);
                    alert(e.toString());
                    gp.old_AvatarLoader(userdata, callback);
                }
            };
            img.crossOrigin = "Anonymous";
            img.src = "http://dom.retrobox.eu/avatars/" + userdata.player.id + ".png";
        }
        if (userdata.which < 3) {
            loadImage();
        } else {
            gp.old_AvatarLoader(userdata, callback);
        }
    };

    gp.preloader = function (ids, which) {};

    ls.MAIN = ls.MAIN.replace('<div id="fs-player-pad-avatar"',
            '<div style="display:none"><form id="uploadAvatarForm" method="post" action="http://dom.retrobox.eu/setavatar.php"><input type="text" id="uploadAvatarId" name="id" value="x"/></form></div>' +
            '<div id="fs-player-pad-avatar" onClick="' +
            'document.getElementById(\'uploadAvatarId\').setAttribute(\'value\',Goko.ObjectCache.getInstance().conn.connInfo.playerId);' +
            'document.getElementById(\'uploadAvatarForm\').submit();' +
            '"');
};

window.GokoSalvager.depWait(
    ['GokoSalvager',
     'Goko.Player',
     'FS.Templates.LaunchScreen'],
    100, loadAvatarModule, this, 'Avatar Module'
);
