(function () {
    'use strict';

    console.log('Loading Always Stack');

    var mod = GS.modules.alwaysStack = new GS.Module('Always Stack');
    mod.dependencies = ['GS', 'FS.Cards.CardStackPanel'];
    mod.load = function () {
        var alwaysStack;

        GS.whenGameClientReady(function (gameClient) {
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
