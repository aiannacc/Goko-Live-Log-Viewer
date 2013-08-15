/*jslint browser: true, devel: true, indent: 4, vars: true, nomen: true, regexp: true, forin: true */
/*global $, _, FS, Goko */

/*
 * Saving table name and settings module
 */
(function () {
    "use strict";

    window.GokoSalvager = window.GokoSalvager || {};
    window.GokoSalvager.options = {};

    FS.EditTableView.prototype.old_modifyDOM = FS.EditTableView.prototype.modifyDOM;
    FS.EditTableView.prototype.modifyDOM = function () {
        var create = !_.isNumber(this.tableIndex);
        var lasttablename = this.$tableName.val() || window.GokoSalvager.options.lasttablename;
        window.GokoSalvager.options.lasttablename = lasttablename;
        window.GokoSalvager.options_save();
        FS.EditTableView.prototype.old_modifyDOM.call(this);
        if (create && lasttablename) {
            this.$tableName.val(lasttablename);
        }
    };

    var firstCreateTable = true;
    FS.DominionEditTableView.prototype.old_modifyDOM = FS.DominionEditTableView.prototype.modifyDOM;
    FS.DominionEditTableView.prototype.modifyDOM = function () {
        var create = !_.isNumber(this.tableIndex);
        if (create && firstCreateTable) {
            if (window.GokoSalvager.options.cacheSettings) {
                this.cacheSettings = window.GokoSalvager.options.cacheSettings;
            }
            firstCreateTable = false;
        }
        FS.DominionEditTableView.prototype.old_modifyDOM.call(this);
    };

    FS.DominionEditTableView.prototype.old_retriveDOM = FS.DominionEditTableView.prototype.retriveDOM;
    FS.DominionEditTableView.prototype.retriveDOM = function () {
        var ret = FS.DominionEditTableView.prototype.old_retriveDOM.call(this);
        if (ret) {
            window.GokoSalvager.options.cacheSettings = this.cacheSettings;
            window.GokoSalvager.options_save();
        }
        return ret;
    };
}());

/*
 * GokoSalvager Configuration module
 *
 * Exports: 'options' object, options_save function.
 * Goko dependencies:
 *   - Format of the main screen layout template: FS.Templates.LaunchScreen.MAIN
 * Internal dependencies: none
 */
(function () {
    "use strict";

    var default_options = {
        version: 1,
        autokick: true,
        generator: true,
        proranks: true,
        sortrating: true,
        adventurevp: true,
        vpEnabled: true,
        vpAlwaysOn: false,
        vpAlwaysOff: false,
        alwaysStack: false,
        blacklist: [""]
    };

    // Need this to be global so that other blocks and scripts can use it
    window.GokoSalvager = (window.GokoSalvager || {});

    window.GokoSalvager.options_save = function () {
        localStorage.salvagerOptions = JSON.stringify(window.GokoSalvager.options);
    };

    window.GokoSalvager.options_load = function () {
        if (localStorage.salvagerOptions) {
            window.GokoSalvager.options = JSON.parse(localStorage.salvagerOptions);
        }
        var o;
        for (o in default_options) {
            if (!(window.GokoSalvager.options.hasOwnProperty(o))) {
                window.GokoSalvager.options[o] = default_options[o];
            }
        }
    };

    function options_window() {
        var h;
        var optwin;
        optwin = document.createElement('div');
        optwin.setAttribute("style", "position:absolute;display:none;left:0px;top:0px;height:100%;width:100%;background:rgba(0,0,0,0.5);z-index:6000;");
        optwin.setAttribute("class", "newlog");
        optwin.setAttribute("id", "usersettings");
        h = '<div style="text-align:center;position:absolute;top:50%;left:50%;height:300px;margin-top:-150px;width:40%;margin-left:-20%;background:white;"><div style="margin-top:20px">';
        h += 'User extension settings:<br>';
        h += '<form style="margin:10px;text-align:left" id="optform">';
        h += '<input name="autokick" type="checkbox">Auto kick<br>';
        h += '<input name="generator" type="checkbox">Kingdom generator (see <a target="_blank" href="http://dom.retrobox.eu/kingdomgenerator.html">instructions</a>)<br>';
        h += '<input name="proranks" type="checkbox">Show pro rankings in the lobby<br>';
        h += '<input name="sort-rating" type="checkbox">Sort players by rating<br>';
        h += '<input name="vp-enabled" id="vp-enabled" type="checkbox">Enable Victory point tracker<br>';
        h += '<span id="vp-always-on"><input name="vp-always-on" type="checkbox" style="margin-left:20px">always turn on (unless "#vpoff" in game title)<br></span>';
        h += '<span id="vp-always-off"><input name="vp-always-off" id="vp-always-off" type="checkbox" style="margin-left:20px">always turn off tracker for other extension users (unless "#vpon" in game title)<br></span>';
        h += '<input name="adventurevp" type="checkbox">Victory point tracker in Adventures<br>';
        h += '<input name="always-stack" type="checkbox">Always stack same-named cards in hand<br>';
        h += 'Personal Black List: (one player name per line)<br><textarea name="blacklist"></textarea><br>';
        //    h+= '<input name="opt" style="width:95%"><br>';
        h += '<div style="align:center;text-align:center"><input type="submit" value="Save"></div></form>';
        h += '</div></div>';
        optwin.innerHTML = h;
        document.getElementById('viewport').appendChild(optwin);
        //    $('#optform input[name="opt"]').val('Aha');
        $('#optform input[name="autokick"]').prop('checked', window.GokoSalvager.options.autokick);
        $('#optform input[name="generator"]').prop('checked', window.GokoSalvager.options.generator);
        $('#optform input[name="proranks"]').prop('checked', window.GokoSalvager.options.proranks);
        $('#optform input[name="sort-rating"]').prop('checked', window.GokoSalvager.options.sortrating);
        $('#optform input[name="always-stack"]').prop('checked', window.GokoSalvager.options.alwaysStack);
        $('#optform input[name="vp-enabled"]').prop('checked', window.GokoSalvager.options.vpEnabled);
        $('#optform input[name="vp-always-on"]').prop('checked', window.GokoSalvager.options.vpAlwaysOn);
        $('#optform input[name="vp-always-off"]').prop('checked', window.GokoSalvager.options.vpAlwaysOff);
        $('#optform input[name="adventurevp"]').prop('checked', window.GokoSalvager.options.adventurevp);
        $('#optform textarea').val(window.GokoSalvager.options.blacklist.join("\n"));
        document.getElementById('optform').onsubmit = function () {
            window.GokoSalvager.options.autokick = $('#optform input[name="autokick"]').prop('checked');
            window.GokoSalvager.options.generator = $('#optform input[name="generator"]').prop('checked');
            window.GokoSalvager.options.proranks = $('#optform input[name="proranks"]').prop('checked');
            window.GokoSalvager.options.sortrating = $('#optform input[name="sort-rating"]').prop('checked');
            window.GokoSalvager.options.alwaysStack = $('#optform input[name="always-stack"]').prop('checked');
            window.GokoSalvager.options.vpEnabled = $('#optform input[name="vp-enabled"]').prop('checked');
            window.GokoSalvager.options.vpAlwaysOn = $('#optform input[name="vp-always-on"]').prop('checked');
            window.GokoSalvager.options.vpAlwaysOff = $('#optform input[name="vp-always-off"]').prop('checked');
            window.GokoSalvager.options.adventurevp = $('#optform input[name="adventurevp"]').prop('checked');
            window.GokoSalvager.options.blacklist = $('#optform textarea[name="blacklist"]').val().split("\n");
            window.GokoSalvager.options_save();
            $('#usersettings').hide();
            return false;
        };

        var vpEnabledClicked = function () {
            var el = document.getElementById("vp-enabled"),
                alwaysOn = document.getElementById("vp-always-on"),
                alwaysOff = document.getElementById("vp-always-off"),
                vpEnabled = el.checked;
            if (vpEnabled) {
                $(alwaysOn).show();
                $(alwaysOff).hide();
                $(alwaysOff).find("input")[0].checked = false;
            } else {
                $(alwaysOn).hide();
                $(alwaysOn).find("input")[0].checked = false;
                $(alwaysOff).show();
            }
        };

        document.getElementById('vp-enabled').onclick = vpEnabledClicked;

        vpEnabledClicked();
    }
    window.GokoSalvager.options_load();
    options_window();
    FS.Templates.LaunchScreen.MAIN = FS.Templates.LaunchScreen.MAIN.replace('Logout</a>',
            'Logout</a><div onClick="$(\'#usersettings\').show()" class="fs-lg-settings-btn">User Settings</div>');
}());
