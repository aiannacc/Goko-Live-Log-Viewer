/*jslint browser: true, devel: true, indent: 4, vars: true, nomen: true, regexp: true, forin: true, white:true */
/*global $, _, */

/*
 * Saving table name and settings module
 */
var loadTableSavingModule = function (gs, etv, detv) {
    "use strict";

    etv.prototype.old_modifyDOM = etv.prototype.modifyDOM;
    etv.prototype.modifyDOM = function () {
        var create = !_.isNumber(this.tableIndex);
        var lasttablename = this.$tableName.val() || gs.get_option('lasttablename');
        gs.set_option('lasttablename', lasttablename);
        etv.prototype.old_modifyDOM.call(this);
        if (create && lasttablename) {
            this.$tableName.val(lasttablename);
        }
    };

    var firstCreateTable = true;
    detv.prototype.old_modifyDOM = detv.prototype.modifyDOM;
    detv.prototype.modifyDOM = function () {
        var create = !_.isNumber(this.tableIndex);
        if (create && firstCreateTable) {
            if (gs.get_option('cacheSettings')) {
                this.cacheSettings = gs.get_option('cacheSettings');
            }
            firstCreateTable = false;
        }
        detv.prototype.old_modifyDOM.call(this);
    };

    detv.prototype.old_retriveDOM = detv.prototype.retriveDOM;
    detv.prototype.retriveDOM = function () {
        var ret = detv.prototype.old_retriveDOM.call(this);
        if (ret) {
            gs.set_option('cacheSettings', this.cacheSettings);
        }
        return ret;
    };
};

window.GokoSalvager.depWait(
    ['GokoSalvager',
     'FS.EditTableView',
     'FS.DominionEditTableView'],
    100, loadTableSavingModule, this, 'Table Saving Module'
);
