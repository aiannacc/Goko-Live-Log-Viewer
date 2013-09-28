/*jslint browser: true, devel: true, indent: 4, vars: true, nomen: true, regexp: true, forin: true, white:true */
/*global $, _, GS, FS */

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
(function () {
    "use strict";

    var mod = GS.modules.lobbyRatings = new GS.Module('Lobby Ratings');
    mod.dependencies = [
        'FS.RatingHelper',
        'FS.ClassicRoomView',
        'FS.MeetingRoomSetting'
    ];
    mod.load = function () {
        var insertInPlace, getSortablePlayerObjectFromElement;
    
        FS.RatingHelper.prototype.old_getRating = FS.RatingHelper.prototype.getRating;
        FS.RatingHelper.prototype.getRating = function (opts, callback) {
            var newCallback = callback, playerElement;
            if (opts.$el && opts.$el.hasClass('player-rank')) {
                playerElement = opts.$el.closest('li')[0];
                newCallback = function (resp) {
                    callback(resp);
                    if (GS.get_option('sortrating')) {
                        insertInPlace(playerElement);
                    }
                    if (GS.get_option('blacklist').indexOf(playerElement.querySelector('.fs-mtrm-player-name>strong').innerHTML) > -1) {
                        $(playerElement).hide();
                    } else {
                        $(playerElement).show();
                    }
                };
                if (GS.get_option('proranks')) {
                    opts.$elPro = opts.$el;
                    opts.$elQuit = $(document.createElement('div'));
                    delete opts.$el;
                }
            }
            FS.RatingHelper.prototype.old_getRating.call(this, opts, newCallback);
        };
    
        FS.ClassicRoomView.prototype.old_modifyDOM = FS.ClassicRoomView.prototype.modifyDOM;
        FS.ClassicRoomView.prototype.modifyDOM = function () {
            var originalRating = this.meetingRoom.options.ratingSystemId;
            if (GS.get_option('proranks')) {
                this.meetingRoom.options.ratingSystemId = FS.MeetingRoomSetting.ratingSystemPro;
            }
            FS.ClassicRoomView.prototype.old_modifyDOM.call(this);
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
}());
