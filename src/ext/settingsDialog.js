/*jslint browser:true, devel:true, white:true, es5:true */
/*globals $ */

window.GokoSalvager.createSettingsDialog = function () {
    "use strict";

    return $('\
<div id="usDialog" title="User Settings" \
  ng:app ng:controller="gokoSalvagerUserSettingsController" >\
  <input type="checkbox" ng:model="us.autokick" ng:click="save(us)" />Autokick<br />\
  <input type="checkbox" ng:model="us.generator" ng:click="save(us)" />Kingdom Generator<br />\
  <input type="checkbox" ng:model="us.proranks" ng:click="save(us)" />Display pro ratings<br />\
  <input type="checkbox" ng:model="us.sort_rating" ng:click="save(us)" />Sort by rating<br />\
  <input type="checkbox" ng:model="us.vp_enabled" ng:click="save(us)" />Enable VP Counter<br />\
  <div ng:show="us.vp_enabled">\
    &nbsp;&nbsp;&nbsp;\
    <input type="checkbox" ng:model="us.vp_always_on" ng:click="save(us)" >\
    Enable by default (unless #vpoff in title)\
  </div>\
  <div ng:hide="us.vp_enabled" >\
    &nbsp;&nbsp;&nbsp;\
    <input type="checkbox" ng:model="us.vp_always_off" ng:click="save(us)">\
    Disable for opponents (unless #vpon in title)\
  </div>\
  <div ng:show="us.vp_enabled">\
    &nbsp;&nbsp;&nbsp;\
    <input type="checkbox" ng:model="us.adventurevp" ng:click="save(us)">\
    Use in adventures\
  </div>\
  <input type="checkbox" ng:model="us.always_stack" ng:click="save(us)"/>\
    Stack duplicate cards<br />\
  Blacklist (noplay + censor):\
  <table>\
    <tr ng:repeat="pname in us.blacklist">\
      <td><label style="color:red" ng:click="rem_from_blacklist(pname)">X</label> </td>\
      <td>{{pname}}</td>\
      <td></td>\
    </tr>\
    <tr>\
      <td></td>\
      <td><input type="text" ng:model="temp_bl" /></td>\
      <td><button ng:click="add_to_blacklist(temp_bl)" >Add</button></td>\
    <tr>\
  </table>\
</div>');
};
