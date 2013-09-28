/*jslint browser: true, devel: true, indent: 4, vars: true, nomen: true, regexp: true, forin: true, white:true */
/*global $, _, GS, Goko, FS */

(function () {

    "use strict";

    var mod = GS.modules.avatars = new GS.Module('Avatars');
    mod.dependencies = ['Goko.Player', 'FS.Templates.LaunchScreen'];
    mod.load = function () {
        var myCanvas = document.createElement("canvas");
        var myContext = myCanvas.getContext("2d");
        Goko.Player.old_AvatarLoader = Goko.Player.AvatarLoader;
        Goko.Player.AvatarLoader = function (userdata, callback) {
            function loadImage() {
                var img = new Image();
                var img2 = new Image();
                img.onerror = img2.onerror = function () {
                    Goko.Player.old_AvatarLoader(userdata, callback);
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
                        GS.debug(e);
                        alert(e.toString());
                        Goko.Player.old_AvatarLoader(userdata, callback);
                    }
                };
                img.crossOrigin = "Anonymous";
                img.src = "http://dom.retrobox.eu/avatars/" + userdata.player.id + ".png";
            }
            if (userdata.which < 3) {
                loadImage();
            } else {
                Goko.Player.old_AvatarLoader(userdata, callback);
            }
        };
    
        Goko.Player.preloader = function (ids, which) {};
    
        FS.Templates.LaunchScreen.MAIN = FS.Templates.LaunchScreen.MAIN.replace('<div id="fs-player-pad-avatar"',
                '<div style="display:none"><form id="uploadAvatarForm" method="post" action="http://dom.retrobox.eu/setavatar.php"><input type="text" id="uploadAvatarId" name="id" value="x"/></form></div>' +
                '<div id="fs-player-pad-avatar" onClick="' +
                'document.getElementById(\'uploadAvatarId\').setAttribute(\'value\',Goko.ObjectCache.getInstance().conn.connInfo.playerId);' +
                'document.getElementById(\'uploadAvatarForm\').submit();' +
                '"');
    };

}());
