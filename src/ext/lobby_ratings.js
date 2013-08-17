/*jslint browser: true, devel: true, indent: 4, vars: true, nomen: true, regexp: true, forin: true */
/*global $, _ */

var loadLobbyRatingsModule;
(function () {
    "use strict";

    console.log('Preparing to load Lobby Ratings module');

    var exists = function (obj) {
        return (typeof obj !== 'undefined' && obj !== null);
    };

    // Wait (non-blocking) until the required objects have been instantiated
    var waitLoop = setInterval(function () {
        try {
            var gs = window.GokoSalvager;
            var gso = gs.get_option;
            var rh = window.FS.RatingHelper;
            var crv = window.FS.ClassicRoomView;
            var mrs = window.FS.MeetingRoomSetting;

            if ([gs, gso, rh, crv, mrs].every(exists)) {
                console.log('Loading Lobby Ratings module');
                clearInterval(waitLoop);
                loadLobbyRatingsModule(gs, rh, crv, mrs);
            }
        } catch (e) {}
    }, 100);
}());

/*
 * Lobby ratings module
 *
 * Goko dependencies:
 * - getRating API specifics ($elPro and $elQuit trigger getting the pro ranking)
 * - class name of the player list rank element ('player-rank')
 * - format of the text content of the player list element ('username Rating: 1000')
 * - FS.RatingHelper, FS.ClassicRoomView, FS.MeetingRoomSetting
 * Internal dependencies:
 * - option: proranks
 * - option: sortrating
 * - option: blacklist
 */
loadLobbyRatingsModule = function (gs, rh, crv, mrs) {
    "use strict";
    var insertInPlace, getSortablePlayerObjectFromElement;

    rh.prototype.old_getRating = rh.prototype.getRating;
    rh.prototype.getRating = function (opts, callback) {
        var newCallback = callback, playerElement;
        if (opts.$el && opts.$el.hasClass('player-rank')) {
            playerElement = opts.$el.closest('li')[0];
            newCallback = function (resp) {
                callback(resp);
                if (gs.get_option('sortrating')) {
                    insertInPlace(playerElement);
                }
                if (gs.get_option('blacklist').indexOf(playerElement.querySelector('.fs-mtrm-player-name>strong').innerHTML) > -1) {
                    $(playerElement).hide();
                } else {
                    $(playerElement).show();
                }
            };
            if (gs.get_option('proranks')) {
                opts.$elPro = opts.$el;
                opts.$elQuit = $(document.createElement('div'));
                delete opts.$el;
            }
        }
        rh.prototype.old_getRating.call(this, opts, newCallback);
    };

    crv.prototype.old_modifyDOM = crv.prototype.modifyDOM;
    crv.prototype.modifyDOM = function () {
        var originalRating = this.meetingRoom.options.ratingSystemId;
        if (gs.get_option('proranks')) {
            this.meetingRoom.options.ratingSystemId = mrs.ratingSystemPro;
        }
        crv.prototype.old_modifyDOM.call(this);
        this.meetingRoom.options.ratingSystemId = originalRating;
    };

    insertInPlace = function (element) {
        var list = element.parentNode;
        if (!list) {
            return; // Removed from the list before the ranking came
        }
        list.removeChild(element);

        var newEl = getSortablePlayerObjectFromElement(element),
            elements = list.children,
            b = elements.length,
            a = 0;

        while (a !== b) {
            var c = Math.floor((a + b) / 2);
            var compare = getSortablePlayerObjectFromElement(elements[c]);

            // sort first by rating, then alphabetically
            if (compare.rating < newEl.rating || (compare.rating === newEl.rating && compare.name > newEl.name)) {
                b = c;
            } else {
                a = c + 1;
            }
        }
        list.insertBefore(element, elements[a] || null);
    };

    getSortablePlayerObjectFromElement = function (element) {
        var rankSpan = element.querySelector('.player-rank>span');
        return {
            name: element.querySelector('.fs-mtrm-player-name>strong').innerHTML,
            rating: rankSpan ? parseInt(rankSpan.innerHTML, 10) : -1
        };
    };
};
