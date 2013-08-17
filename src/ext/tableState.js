/*jslint browser: true, devel: true, indent: 4, vars: true, nomen: true, regexp: true, forin: true */
/*global $, _, */

var loadTableSavingModule;
(function () {
    "use strict";

    console.log('Preparing to load table state module');

    var exists = function (obj) {
        return (typeof obj !== 'undefined' && obj !== null);
    };

    // Wait (non-blocking) until the required objects have been instantiated
    var waitLoop = setInterval(function () {
        var gs, gso, etv, detv;

        try {
            gs = window.GokoSalvager;
            gso = gs.get_option;
            etv = window.FS.EditTableView;
            detv = window.FS.DominionEditTableView;
        } catch (e) {}

        if ([gso, etv, detv].every(exists)) {
            console.log('Loading table state module');
            loadTableSavingModule(gs, etv, detv);
            clearInterval(waitLoop);
        }
    }, 100);
}());

/*
 * Saving table name and settings module
 */
loadTableSavingModule = function (gs, etv, detv) {
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
