/*jslint vars:true, nomen:true, forin:true, regexp:true, browser:true, devel:true */
/*globals _, $, GS, mtgRoom, Dom */

// TODO: Immediately send Turn 2 messages when opponents have all joined the game.

(function () {
    "use strict";


    GS.modules.chatbox = new GS.Module('Chat Box');
    GS.modules.chatbox.dependencies = [
        'mtgRoom.conn',
        '#chatdiv',
        'Dom.DominionWindow.prototype._createChatManager'
    ];
    GS.modules.chatbox.load = function () {

        var onGameSetup, onRoomChat;
        var pname2pclass;
        var gameClient;

        var chatHistory = [];

        // Add the chat box widget to the sidebar. The sidebar module is
        // responsible for whether to display it or not.
        $('#chatdiv')
            .append($('<div>').attr('id', 'chatarea'))
            .append($('<input>').attr('id', 'chatline')
                                .attr('type', 'text')
                                .attr('autofocus', 'autofocus'));

        // Send chat when user pressed enter
        $('#chatline').on('keyup', function (e) {
            if (e.which === 13) {
                e.preventDefault();
                var text = $('#chatline').val();
                $('#chatline').val('');
                GS.sendRoomChat(text);
            }
        });

        // Override showRoom chat with version that displays in sidebar chat
        // instead of the standard Goko chat box
        var gokoShowRoomChat = GS.showRoomChat;
        GS.showRoomChat = function (message) {
            if (GS.get_option('sidebar_chat')) {
                $('#chatarea')
                    .append($('<span>').text('***'))
                    .append($('<span>').text(' ' + message))
                    .append($('<br>'));
            } else {
                gokoShowRoomChat.apply(GS, arguments);
            }
        };

        // Prevent Goko from creating its chat dialog and intercepting chats.
        // Fake version has methods for game window destructor to call.
        var createRealGokoChatManager = Dom.DominionWindow.prototype._createChatManager;
        var createFakeGokoChatManager = function () {
		    var dominionWindow = this;
		    var chatManager = {
                destroy: function () {},
                addChat: function () {
                },
                setVisible: function () {}
            };
		    this.chatManager = chatManager;
	    };

        onGameSetup = function (gameData, domClient) {
            pname2pclass = {};
            gameData.playerInfos.map(function (pinfo) {
                pname2pclass[pinfo.name] = 'p' + pinfo.playerIndex;
            });
            $('#chatarea').empty();
            $('#chatline').empty();
            if (GS.get_option('sidebar_chat')) {
                $('#chatline').focus();
                Dom.DominionWindow.prototype._createChatManager = createFakeGokoChatManager;
            } else {
                Dom.DominionWindow.prototype._createChatManager = createRealGokoChatManager;
            }
        };

        onRoomChat = function (data) {
            var speaker = mtgRoom.playerList
                                 .findByAddress(data.data.playerAddress)
                                 .get('playerName');
            GS.debug("Room Chat: " + speaker + ': ' + data.data.text);
            $('#chatarea')
                .append($('<span>').addClass(pname2pclass[speaker])
                                   .text(speaker))
                .append($('<span>').text(' ' + data.data.text))
                .append($('<br>'));
            $('#chatarea').scrollTop(99999999);
        };

        var playersExited;
        var onOppExit = function (msg, data) {
            console.log('OPP EXIT');
            var pname = data.player.get('player').get('playerName');
            if (playersExited.indexOf(pname) === -1) {
                playersExited.push(pname);
                GS.showRoomChat(pname + ' has left the game.');
            }
        };

        // Listen to VP toggle events in room chat and when the game starts
        mtgRoom.conn.bind('roomChat', onRoomChat);
        mtgRoom.conn.bind('gameServerHello', function (msg) {
            // Stop listening to the old game client
            if (typeof gameClient !== 'undefined' && gameClient !== null) {
                gameClient.unbind('incomingMessage:gameSetup', onGameSetup);
                mtgRoom.unbind('MeetingRoom:Game:ClientExit', onOppExit);
            }
            // Start listening to the new one
            gameClient = GS.getGameClient();
            gameClient.bind('incomingMessage:gameSetup', onGameSetup);
            mtgRoom.bind('MeetingRoom:Game:ClientExit', onOppExit);
            playersExited = [];
        });
    };
}());
