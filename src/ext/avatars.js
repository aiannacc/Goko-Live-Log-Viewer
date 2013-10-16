/*jslint browser: true, devel: true, indent: 4, vars: true, nomen: true, regexp: true, forin: true, white:true */
/*global $, _, GS, Goko, FS, mtgRoom */

(function () {

    "use strict";

    var mod = GS.modules.avatars = new GS.Module('Avatars');
    mod.dependencies = [
        'Goko.Player.AvatarLoader',
        'Goko.Player.preloader',
        'FS.AvatarHelper',
        '.fs-rs-logout-row'
    ];
    mod.load = function () {

        // Create helper objects for resizing images
        var myCanvas = document.createElement("canvas");
        var myContext = myCanvas.getContext("2d");

        // Cache goko's avatar loading method
        var gokoAvatarLoader = FS.AvatarHelper.loadAvatarImage;
		var hasAvatar = new Object();

        // Define our own avatar loading method
        var customAvatarLoader = function (playerId, which, callback) {
            var size = [50, 100, 256][which];
            var img = new Image();
			if (typeof hasAvatar[playerId] == 'undefined') {
				hasAvatar[playerId] = true;
			}
			
			img.onerror = function () {
					// When no URL for a custom avatar can be found
					hasAvatar[playerId] = false;
					gokoAvatarLoader(playerId, which, callback);
			};
			
			img.onload = function() {
					// When custom avatar is found
					// Draw a resized version
					myCanvas.width = size;
					myCanvas.height = size;
					myContext.drawImage(img, 0, 0, img.width, img.height, 0, 0, size, size);
		
					var img2 = new Image();
					// Convert the resized version to a URL
					img2.onload = function () {
						//console.log('Found avatar for ' + playerId);
						var user = {};
						user.playerid = playerId;
						user.image = img2;
						callback(user);
					};
					img2.src = myCanvas.toDataURL("image/png");
			};
			
			if (hasAvatar[playerId]) {
				img.crossOrigin = "Anonymous";
				img.src = "http://dom.retrobox.eu/avatars/" + playerId + ".png";
			} else {
				gokoAvatarLoader(playerId, which, callback);
			}
        };

        // Let Goko handle the large avatar images ('which' >=3). I believe
        // this is just the one on the login screen, the full-body image.
        FS.AvatarHelper.loadAvatarImage = function (playerId, which, callback) {
            if (which >= 3) {
                gokoAvatarLoader(playerId, which, callback);
            } else {
                customAvatarLoader(playerId, which, callback);
            }
        };

        // This is leftover from nutki's original GreaseMonkey script. I'm
        // scared to touch it.
        Goko.Player.preloader = function (ids, which) {};

        var addChangeAvatarLink = function () {
            // Add link to open dialog if necessary
            if ($('changeAvatarLink').length === 0) {
                $('.fs-rs-logout-row').append(
                    $('<form>').attr('id', 'changeAvatarForm')
                               .attr('method', 'post')
                               .attr('action', 'http://dom.retrobox.eu/setavatar.php')
                                .append(
                        $('<div>').addClass('fs-lg-settings-btn')
                                  .attr('id', 'changeAvatarLink')
                                  .text('Change Avatar')
                                  .click(function () {
                                      $('#changeAvatarId').val(mtgRoom.conn.connInfo.playerId);
                                      $('#changeAvatarForm').submit();
                                  })
                               .append(
                        $('<input>').attr('type', 'text')
                                    .attr('hidden', 'true')
                                    .attr('name', 'id')
                                    .attr('id', 'changeAvatarId')
                                    .attr('value', 'x'))
                                  ));
            }
        };

        var setLoginScreenAvatar = function () {
            var myPlayerId = mtgRoom.conn.connInfo.playerId;
            var myAvatarURL = "http://dom.retrobox.eu/avatars/" + myPlayerId + ".png";
			$.ajax({
                url: myAvatarURL,
                type: 'HEAD',
                error: function() {
                    myAvatarURL = null;
                    //console.log('User does not have a custom avatar');
                },
                success: function() {
                    $('#fs-player-pad-avatar img').attr('src', myAvatarURL);
                    $('.player-info-avatar img').attr('src', myAvatarURL);
                    //console.log('Settings custom avatar');
                    //console.log($('#fs-player-pad-avatar img').attr('src'));
                }
            });

        };

        GS.alsoDo(FS.LaunchScreen.View.Container, '_gameBackgroundCallback',
                  null, setLoginScreenAvatar);
        GS.alsoDo(FS.LaunchScreen.View.Container, '_gameBackgroundCallback',
                  null, addChangeAvatarLink);
        try {
            addChangeAvatarLink();
            setLoginScreenAvatar();
        } catch (e) { }
    };
}());
