/*jslint vars:true, nomen:true, forin:true, regexp:true, browser:true, devel:true */
/*globals _, $, GS, mtgRoom, Dom */

// TODO: Immediately send Turn 2 messages when opponents have all joined the game.

(function () {
    "use strict";

    var pname2pclass;

    GS.modules.chatbox = new GS.Module('Chat Box');
    GS.modules.chatbox.dependencies = [
        'mtgRoom.conn',
        '#chatdiv',
        'Dom.DominionWindow.prototype._createChatManager'
    ];
    GS.modules.chatbox.load = function () {

        var onGameSetup, onRoomChat, checkGameOver;

        Dom.DominionWindow.prototype._createChatManager = function () {
		    var dominionWindow = this;
		    var chatManager = {
                destroy: function () {},
                addChat: function () {
                },
                setVisible: function () {}
            };
		    this.chatManager = chatManager;
	    };

        $('#chatdiv')
            .append($('<textarea>').attr('id', 'chatarea')
                                   .attr('readonly', 'readonly'))
            .append($('<input>').attr('id', 'chatline')
                                .attr('type', 'text'));

        $('#chatline').on('keyup', function (e) {
            if (e.which === 13) {
                e.preventDefault();
                var text = $('#chatline').val();
                $('#chatline').val('');
                console.log('sending chat: ' + text);
                GS.sendRoomChat(text);
            }
        });

        onGameSetup = function (gameData, domClient) {
            GS.debug('Game Setup (chatbox)');
            pname2pclass = {};
            gameData.playerInfos.map(function (pinfo) {
                pname2pclass[pinfo.name] = 'p' + pinfo.playerIndex;
            });
            $('#chatbox').empty();
            $('#chatline').empty();
            $('#chatline').focus();
            //GS.getGameClient().playerController.dominionWindow.chatManager.destroy();
        };

        onRoomChat = function (data) {
            var speaker = mtgRoom.playerList
                                 .findByAddress(data.data.playerAddress)
                                 .get('playerName');
            GS.debug("Room Chat: " + speaker + ': ' + data.data.text);
            var oldText = $('#chatarea').val();
            var newText = oldText + '\n' + speaker + ': ' + data.data.text;
            $('#chatarea').val(newText);
            $('#chatarea').scrollTop(99999999);
        };

        // Listen to VP toggle events in room chat and when the game starts
        mtgRoom.conn.bind('roomChat', onRoomChat);
        mtgRoom.conn.bind('gameServerHello', function (msg) {
            GS.debug('Binding for chatbox');
            GS.getGameClient().bind('incomingMessage:gameSetup', onGameSetup);
            GS.getGameClient().bind('incomingMessage', checkGameOver);
        });

        // Stop listening at the end of the game
        checkGameOver = function (msg) {
            if (msg !== 'gameOver') { return; }
            GS.debug('Unbinding for chatbox');
            GS.getGameClient().unbind('incomingMessage:gameSetup', onGameSetup);
            GS.getGameClient().unbind('incomingMessage', checkGameOver);
        };
    };
}());
