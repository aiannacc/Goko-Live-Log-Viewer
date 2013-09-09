/*jslint browser: true, devel: true, indent: 4, vars: true, nomen: true, regexp: true, forin: true, white:true */
/*global $, _, */

/*
 * Save table settings module
 */
var loadTableSavingModule = function (gs, editTableView, domEditTableView) {
    "use strict";

    // First provide our cacheSettings (# of players, rating mode, etc) to the
    // function that populates the Create Table dialog. Let it do its thing and
    // then override the table name it chooses (which is always "X's game")
    gs.alsoDo(domEditTableView, 'modifyDOM', function () {
        this.cacheSettings = gs.get_option('cacheSettings') || this.cacheSettings;
    }, function () {
        this.$tableName.val(gs.get_option('lasttablename'));
    });

    // Cache table settings whenever a table is created manually.
    // Note that this does not trigger when automatch creates a table.
    gs.alsoDo(domEditTableView, 'onClickCreateTable', function () {
        if (this.retriveDOM()) {
            gs.set_option('cacheSettings', this.cacheSettings);
            gs.set_option('lasttablename', JSON.parse(this.tableSetting).name);
        }
    });
};

window.GokoSalvager.depWait(
    ['GokoSalvager',
     'FS.EditTableView',
     'FS.DominionEditTableView'],
    100, loadTableSavingModule, this, 'Table Settings Module'
);
