/*jslint browser: true, devel: true, indent: 4, es5: true, vars: true, nomen: true, regexp: true, forin: true */

(function () {
    "use strict";

    window.GokoSalvager = window.GokoSalvager || {};

    window.GokoSalvager.alsoDo = function (object, methodname, fnBefore, fnAfter) {

        // If we've already overridden this method, then override the
        // overriding method instead
        var methodname_o = '_' + methodname + '_orig';
        if (object.prototype.hasOwnProperty(methodname_o)) {
            return window.GokoSalvager.alsoDo(object, methodname_o, fnBefore, fnAfter);
        }

        // Cache original method
        object.prototype[methodname_o] = object.prototype[methodname];
    
        // Replace original method with a method sandwich
        object.prototype[methodname] = function () {

            // Run fnBefore
            if (typeof fnBefore !== 'undefined' && fnBefore !== null) {
                fnBefore.apply(this, arguments);
            }

            // Run the original method
            var out = this[methodname_o].apply(this, arguments);

            // Run fnAfter
            if (typeof fnAfter !== 'undefined' && fnAfter !== null) {
                fnAfter.apply(this, arguments);
            }

            // Return the result of the original method
            return out;
        };
    };

    window.GokoSalvager.depWait = function (argNames, waitPeriod, callback, context, name) {
        function index(obj, i) { return obj[i]; }
        if (typeof name === 'undefined') { name = null; }

        var waitLoop;
        var exists = function (y) {
            return typeof y !== 'undefined' && y !== null;
        };
        var depTry = function () {
            var x;

            try {
                if (name) { console.log('Checking deps for ' + name); }
                x = argNames.map(function (argName) {
                    return argName.split('.').reduce(index, window);
                });
            } catch (e) {
                if (name) { console.log('Error while looking for deps for ' + name); }
                return;
            }
                
            if (x.every(exists)) {
                if (name) { console.log('Found deps for ' + name); }
                callback.apply(null, x);
                clearInterval(waitLoop);
                if (name) { console.log('Found deps and ran ' + name); }
            } else if (name) {
                var i;
                for (i = 0; i < x.length; i += 1) {
                    if (!exists(x[i])) {
                        console.log(name + ' is missing dependency: ' + argNames[i]);
                    }
                }
            }

        };
        waitLoop = setInterval(depTry, waitPeriod);
    };
}());
