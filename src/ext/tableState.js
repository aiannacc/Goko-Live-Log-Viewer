(function () {
    "use strict";

    var mod = GS.modules.tableState = new GS.Module('Table State');
    mod.dependencies = ['FS.EditTableView', 'FS.DominionEditTableView'];
    mod.load = function () {
        // First provide our cacheSettings (# of players, rating mode, etc) to the
        // function that populates the Create Table dialog. Let it do its thing and
        // then override the table name it chooses (which is always "X's game")
        GS.alsoDo(FS.DominionEditTableView, 'modifyDOM', function () {
            this.cacheSettings = GS.get_option('cacheSettings') || this.cacheSettings;
        }, function () {
            this.$tableName.val(GS.get_option('lasttablename'));
        });

        // Cache table settings whenever a table is created manually.
        // Note that this does not trigger when automatch creates a table.
        GS.alsoDo(FS.DominionEditTableView, 'onClickCreateTable', function () {
            if (this.retriveDOM()) {
                GS.set_option('cacheSettings', this.cacheSettings);
                GS.set_option('lasttablename', JSON.parse(this.tableSetting).name);
            }
        });
    };
}());
