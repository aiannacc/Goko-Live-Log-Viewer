(function () {
    "use strict";

    console.log('Loading autokick');

    var mod = GS.modules.speedTweak = new GS.Module('speedTweak');
    mod.dependencies = [
        'Dom.GlobalLayout.animationTiming',
        'Dom.GlobalLayout.animationTimings'
    ];
    mod.load = function () {

        var defTimings = Dom.GlobalLayout.animationTimings;

        // Apply current speed tweak settings.
        GS.tweakAnimationSpeeds = function () {
            console.log('Tweaking animation speeds.');

            // These are Goko's speed factors for each mode, except for the
            // fact that they are applied inconsistently (e.g. the purchase
            // delay remains unchanged in all modes except veryFast.
            var factors = {
                normal: 2,
                fast: 4,
                veryFast: 16
            };

            // Make normal and fast faster
            if (GS.get_option('speed_tweak_faster')) {
                factors = {
                    normal: 3,
                    fast: 9,
                    veryFast: 16
                };
            }

            // Apply speed factor uniformly to all animation speeds
            if (GS.get_option('speed_tweak_uniform')) {
                _.each(factors, function (fac, mode) {
                    Dom.GlobalLayout.animationTimings[mode] = {
                        name: mode,
                        factor : 1 / fac,
                        boltSpeed : 1000 * fac,
                        trailDuration : 500 / fac,
                        finalDuration : 500 / fac,
                        moveCardsMaxDurationBetweenCards : 50 / fac,
                        moveCardsMaxDuration : 500 / fac,
                        purchaseCardPauseDuration : 1000 / fac,
                        statusMessageDurationFactor : 1 / fac,
                        moveCardMinDuration : 300 / fac,
                        moveCardAnimationSpeed : 1000 * fac
                    };
                });
            } else {
                Dom.GlobalLayout.animationTimings = defTimings;
            }

            // Reload timing to acquire changes
            Dom.GlobalLayout.animationTiming =
                Dom.GlobalLayout.animationTimings[Dom.GlobalLayout.animationSpeed];
        };

        // Apply current settings immediately
        GS.tweakAnimationSpeeds();
    };
}());
