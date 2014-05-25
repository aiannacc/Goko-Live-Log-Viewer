(function () {
    "use strict";

    var mod = GS.modules.autozap = new GS.Module('autozap');
    mod.dependencies = [
        'CampaignBattleScreen.prototype.show_campaign_battle'
    ];
    mod.load = function () {
        var zapitup, i;
        zapitup = function () {
            VhonTools.zaps.total = 80;
            var j = 0;
            while (j < 4) {
                j += 1;
                i = 10;
                while (i < 30) {
                    VhonTools.gameui['card' + i].childrenList[1].actionPerformed();
                    i += 1;
                }
            }
        };

        if (GS.get_option('autozap')) {
            GS.alsoDo(CampaignBattleScreen, 'show_campaign_battle', null, zapitup);
        }
    };
}());
