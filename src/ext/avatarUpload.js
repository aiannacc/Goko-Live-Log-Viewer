/*jslint browser: true, devel: true, indent: 4, vars: true, nomen: true, regexp: true, forin: true */
/*global $, _, GS, FS, mtgRoom, FormData */

(function () {
    "use strict";

    var mod = GS.modules.avatarUpload = new GS.Module('Avatar Upload');
    mod.dependencies = [
        'Goko.Player.preloader',
        '#viewport',
        'mtgRoom.conn',
        '.fs-rs-logout-row',
        'FS.LaunchScreen.getInstance'
    ];
    mod.load = function () {

        // Create upload avatar dialog
        $('#viewport')
            .append($('<div>').attr('id', 'uploadAvatarDialog')
                              .attr('title', 'Upload Avatar')
                .append('Image will be resized/cropped to 100x100')
                .append($('<form enctype="multipart/form-data" id="auForm">')
                    .append($('<input type="file"   name="avatar"   id="auInput" />'))
                    .append($('<input type="hidden" name="playerId" id="auPID" />'))
                    .append($('<input type="button" value="Upload" id="auButton" />')))
                .append('<br>')
                .append('<div id="auInfo">'));

        // Make upload avatar dialog into a JQueryUI popup
        $('#uploadAvatarDialog').dialog({
            modal: true,
            width: 450,
            height: 300,
            closeText: 'Save',
            draggable: false,
            resizeable: false,
            autoOpen: false
        });

        $('#auInput').change(function () {
            var file = this.files[0];
            var type = file.type;
        
            if (type === 'image/jpeg' || type === 'image/png' || type === 'image/gif') {
                $('#auButton').prop('disabled', false);
                $('#auInfo').html('Ready to submit.');
            } else {
                $('#auButton').prop('disabled', true);
                $('#auInfo').html('Invalid file type.  Please select an image file.');
            }
        
            if (file.size / 1000 > 1000) {
                $('#auInfo').html('File is too large: 1 MB max');
                $('#auButton').prop('disabled', true);
            }
        });

        var completeHandler = function () {
            $('#auInfo').html('Upload successful.  You may have to clear your '
                            + 'browser cache before you see your new avatar.');
            FS.LaunchScreen.getInstance().loadPlayerAvatar(mtgRoom.conn);
        };

        $('#auButton').on("click", function () {
            $('#auPID').val(mtgRoom.conn.connInfo.playerId);
            $.ajax({
                url: 'https://www.gokosalvager.com:8889/gs/submit_avatar',
                type: 'POST',
                xhr: function () { return $.ajaxSettings.xhr(); },
                beforeSend: null,
                success: completeHandler,
                error: function () { $('#auInfo').html('Failed to transmit file.'); },
                data: new FormData($('#auForm')[0]),
                cache: false,
                contentType: false,
                processData: false
            });
        });
    };
}());
