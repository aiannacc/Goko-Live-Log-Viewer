(function () {
    'use strict';

    console.log('Loading Always Stack');

    var mod = GS.modules.alwaysStack = new GS.Module('Always Stack');
    mod.dependencies = ['GS'];
    mod.load = function () {
        var alwaysStack;

        // first bind to gameServerHello so an instance of DominionClient is
        // available
        mtgRoom.conn.bind('gameServerHello', function (msg) {
            var gameClient;

            gameClient = _.find(mtgRoom.games, function (game) {
                return game.gameAddress === msg.data.gameServerAddress;
            }, this);

            // bind to the native Goko event
            if (GS.get_option('always_stack')) {
                gameClient.clientConnection.bind('moveCards', alwaysStack);
            }
        });

        alwaysStack = function () {
            var dominionWindow,
                fanPanels;

            dominionWindow = this.gameInstance.playerController.dominionWindow;

            // select the panels used to display cards in a fanned-out manner,
            // i.e., the panels used to display the cards in hand
            fanPanels = _.select(dominionWindow.panels, function (panel) {
                return panel instanceof FS.Cards.FanCardStackPanel;
            }, this);

            // default value for numCardsAutoStackTrigger is 10; set to 0 so
            // auto-stacking is always triggered
            _.each(fanPanels, function (panel) {
                panel.numCardsAutoStackTrigger = 0;
            }, this);
        };

    };
}());
