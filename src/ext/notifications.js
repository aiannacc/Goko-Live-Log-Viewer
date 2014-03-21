/*jslint vars:true, nomen:true, forin:true, regexp:true, browser:true, devel:true */
/*globals _, $, GS, Notification */

(function () {
    "use strict";

    var chromeUnblock = 'Settings/advanced settings/Privacy/Content Settings/Notifications/Manage Exceptions/';
    var firefoxUnblock = 'Tools/Page Info/Permissions/Show Notifications';

    console.log('Loading Notifications Module');

    GS.modules.notifications = new GS.Module('Notifications');
    GS.modules.notifications.dependencies = [
        '#desktopnotificationcheckbox'
    ];
    GS.modules.notifications.load = function () {
        var openNotifications = [];

        var requestNotificationPermission = function () {
            switch (GS.getBrowser()) {
            case 'Firefox':
                Notification.requestPermission();
                break;
            case 'Chrome':
                window.webkitNotifications.requestPermission();
                break;
            case 'Safari':
                GS.set_option('desktop_notifications', false);
                $('#settingsDialog').scope().$digest();
                alert('Sorry. Safari does not support HTML5 desktop notifications yet.');
                break;
            default:
                throw 'Unknown browser ' + GS.getBrowser();
            }
        };

        var ALLOWED = 0;
        var NOT_SET = 1;
        var BLOCKED = 2;
        var getNotificationPermission = function () {
            switch (GS.getBrowser()) {
            case 'Firefox':
                switch (Notification.permission) {
                case 'granted':
                    return 0;
                case 'default':
                    return 1;
                case 'denied':
                    return 2;
                default:
                    throw 'Impossible Firefox Notification.permission value: '
                        + Notification.permission;
                }
            case 'Chrome':
                return window.webkitNotifications.checkPermission();
            case 'Safari':
                return 1;
            default:
                throw 'Unknown browser ' + GS.getBrowser();
            }
        };

        $('#desktopnotificationcheckbox').click(function () {
            if ($(this).is(':checked')) {
                var p = getNotificationPermission();
                if (p === NOT_SET) {
                    $('#notificationdialog').dialog('open');
                } else if (p === BLOCKED) {
                    alert('Your browser settings block desktop '
                        + 'notifications from play.goko.com. You must '
                        + 'remove this block manually before enabling '
                        + 'Salvager desktop notifications.');
                    GS.set_option('desktop_notifications', false);
                    $('#settingsDialog').scope().$digest();
                }
            }
        });

        $('<div>').attr('id', 'notificationdialog')
            .append('<div>').text('Your browser is blocking Salvager from '
                                + 'desktop notifications. Unblock?')
            .append('<br>')
            .append($('<button>').attr('id', 'nonotifications')
                                 .text('No'))
            .append($('<button>').attr('id', 'yesnotifications')
                                 .text('Yes'))
            .dialog({
                modal: true,
                width: 500,
                title: 'Desktop notification blocked',
                draggable: false,
                resizeable: false,
                autoOpen: false
            });
        $('#yesnotifications').click(function () {
            GS.set_option('desktop_notifications', true);
            $('#settingsDialog').scope().$digest();
            requestNotificationPermission();
            $('#notificationdialog').dialog('close');
        });
        $('#nonotifications').click(function () {
            GS.set_option('desktop_notifications', false);
            $('#settingsDialog').scope().$digest();
            $('#notificationdialog').dialog('close');
        });

        var createDesktopNotification = function (message) {
            var n;
            switch (GS.getBrowser()) {
            case 'Firefox':
                n = new Notification(message, {icon: GS.salvagerIconURL});
                openNotifications.push(n);
                break;
            case 'Chrome':
                n = window.webkitNotifications.createNotification(GS.salvagerIconURL,
                        'Goko Salvager', message);
                n.show();
                openNotifications.push(n);
                break;
            case 'Safari':
                throw 'Impossible to reach this code.';
            default:
                throw 'Unknown browser ' + GS.getBrowser();
            }
        };

        // Close notifications whenever user clicks anywhere
        $('body').click(function () {
            var i, temp = openNotifications.slice(0);
            openNotifications = [];
            for (i = 0; i < temp.length; i += 1) {
                // Firefox needs "close."  Chrome needs "cancel."  This should blast both to hell.
                try {
                    temp[i].close();
                } catch (e) { }
                try {
                    temp[i].cancel();
                } catch (e2) { }
            }
        });

        var n;
        GS.notifyUser = function (message, sound) {
            if (GS.get_option('audio_notifications')) {
                if (typeof sound !== 'undefined') {
                    sound.play();
                }
            }
            if (GS.get_option('popup_notifications')) {
                if (GS.get_option('audio_notifications')) {
                    setTimeout(function () {
                        alert(message);
                    }, 500);
                } else {
                    alert(message);
                }
            } else if (GS.get_option('desktop_notifications')) {
                var p = getNotificationPermission();
                if (p === ALLOWED) {
                    createDesktopNotification(message);
                } else if (p === NOT_SET) {
                    GS.set_option('desktop_notifications', false);
                    $('#settingsDialog').scope().$digest();
                    $('#notificationdialog').dialog('open');
                } else if (p === BLOCKED) {
                    alert('Your browser settings block desktop '
                        + 'notifications from play.goko.com. You must '
                        + 'remove this block manually before enabling '
                        + 'Salvager desktop notifications.');
                    GS.set_option('desktop_notifications', false);
                    $('#settingsDialog').scope().$digest();
                } else {
                    throw 'Impossible permission setting: ' + p;
                }
            }
        };
    };
}());
