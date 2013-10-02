/*jslint devel:true, vars:true, regexp:true */
/*globals test, asyncTest, start, ok, equal, GS, setTimeout */

(function () {
    "use strict";

    var toggle;
    //var testDelayedActions = true;
    var testDelayedActions = false;
    var consoleLogging = false;

    var log = function (msg) {
        if (consoleLogging) {
            console.log(msg);
        }
    };

    // GS object stub. GS.VPToggle expects to use these methods.
    GS.debug = function (arg) {
        log(arg);
    };
    GS.showRoomChat = function (msg) {
        log('Show chat: ' + msg);
        toggle.shownChat.push(msg);
    };
    GS.sendRoomChat = function (msg) {
        log('Send chat: ' + msg);
        toggle.sentChat.push(msg);
        // TODO: add random delays
        toggle.onMyChat(msg);
    };
    GS.resizeSidebar = function () {};
    GS.sendScores = function () {
        GS.sendRoomChat('me: 5, opp: 7');
    };

    var botSetup = function (request, refuse, title) {
        log('---');
        if (typeof title === 'undefined') {
            title = 'my game';
        }
        toggle = new GS.VPToggle(request, refuse, title, 'me', ['me', 'opp'], [false, true]);
        toggle.shownChat = [];
        toggle.sentChat = [];
        toggle.init();
    };

    var humanSetup = function (request, refuse, title) {
        log('---');
        if (typeof title === 'undefined') {
            title = 'my game';
        }
        toggle = new GS.VPToggle(request, refuse, title, 'me', ['me', 'opp'], [false, false]);
        toggle.shownChat = [];
        toggle.sentChat = [];
        toggle.init();
    };

    var setState = function (vpon, locked, whyLocked) {
        toggle.vpon = vpon;
        toggle.locked = locked;
        toggle.whyLocked = whyLocked;
    };

    var state = function (vpon, locked, whyLocked) {
        equal(toggle.vpon, vpon);
        equal(toggle.locked, locked);
        if (whyLocked === null) {
            equal(toggle.whyLocked, null);
        } else {
            ok(toggle.whyLocked.match(whyLocked));
            if (!toggle.whyLocked.match(whyLocked)) {
                console.log('WHY LOCKED: ' + toggle.whyLocked);
            }
        }
    };

    var sentChats = function () {
        ok(toggle.sentChat.length >= arguments.length);
        if (toggle.sentChat.length >= arguments.length) {
            var i;
            for (i = 0; i < arguments.length; i += 1) {
                var j = toggle.sentChat.length - arguments.length + i;
                ok(toggle.sentChat[j].match(arguments[i]));
                if (toggle.sentChat[j].match(arguments[i]) === null) {
                    console.log("SHOWN CHAT: " + toggle.sentChat);
                }
            }
        }
    };

    var shownChats = function () {
        ok(toggle.shownChat.length >= arguments.length);
        if (toggle.shownChat.length >= arguments.length) {
            var i;
            for (i = 0; i < arguments.length; i += 1) {
                var j = toggle.shownChat.length - arguments.length + i;
                ok(toggle.shownChat[j].match(arguments[i]));
                if (toggle.shownChat[j].match(arguments[i]) === null) {
                    console.log("SHOWN CHAT: " + toggle.shownChat);
                }
            }
        }
    };

    test("default - init", function () {
        humanSetup(false, false);
        state(false, false, null);
        shownChats(/is available/, /#vphelp/);
    });

    test("default - Opp #vpon", function () {
        humanSetup(false, false);
        toggle.onOppChat('opp', '#vpon');
        state(true, false, null);
    });

    asyncTest("default - My #vpon", function () {
        humanSetup(false, false);
        toggle.onMyChat('#vpon');
        state(true, false, null);
        if (testDelayedActions) {
            setTimeout(function () {
                sentChats(/^I'd like to use a VP counter/);
                start();
            }, 3000);
        } else {
            start();
        }
    });
    
    test("default - My #vpoff", function () {
        humanSetup(false, false);
        toggle.onMyChat('#vpoff');
        state(false, true, /me said #vpoff/);
        shownChats(/now locked to OFF/);
    });

    test("default - Opp #vpoff", function () {
        humanSetup(false, false);
        toggle.onOppChat('opp', '#vpoff');
        state(false, true, /opp said #vpoff/);
        sentChats(/Ok, my VP counter is off/);
    });

    asyncTest("default - My #vpon, Opp #vpon", function () {
        humanSetup(false, false);
        toggle.onMyChat('#vpon');
        toggle.onOppChat('opp', '#vpon');
        state(true, true, /all players said #vpon/);
        var n = toggle.shownChat.length;
        if (testDelayedActions) {
            setTimeout(function () {
                ok(toggle.shownChat.length === n);
                start();
            }, 3000);
        } else {
            start();
        }
    });

    asyncTest("default - Opp #vpon, My #vpon", function () {
        humanSetup(false, false);
        toggle.onOppChat('opp', '#vpon');
        toggle.onMyChat('#vpon');
        state(true, true, /all players said #vpon/);
        var n = toggle.shownChat.length;
        if (testDelayedActions) {
            setTimeout(function () {
                ok(toggle.shownChat.length === n);
                start();
            }, 3000);
        } else {
            start();
        }
    });

    // These tests are redundant
    //test("default - Opp #vpon, My #vpon, Opp #vpoff", function () {
    //    humanSetup(false, true);
    //    toggle.onOppChat('opp', '#vpon');
    //    toggle.onMyChat('#vpon');
    //    toggle.onOppChat('me', '#vpoff');
    //    state(true, true, /all players said #vpon/);
    //    sentChats(/^Sorry\. My VP/);
    //});
    //
    //test("default - Opp #vpon, My #vpon, My #vpoff", function () {
    //    humanSetup(false, true);
    //    toggle.onOppChat('opp', '#vpon');
    //    toggle.onMyChat('#vpon');
    //    toggle.onMyChat('#vpoff');
    //    state(true, true, /all players said #vpon/);
    //    shownChats(/^Sorry\. Your VP/);
    //});

    // Without the request option, nothing should happen on Turn 2
    test("default - My Turn 2", function () {
        humanSetup(false, false);
        toggle.onTurn('me', 2);
        state(false, false, null);
        var n = toggle.shownChat.length;
        toggle.onTurn('opp', 2);
        ok(toggle.shownChat.length === n);
    });

    // Toggle should lock on first player's Turn 5
    // Nothing should happend on second player's Turn 5
    test("default - Turn 5s (me first)", function () {
        humanSetup(false, false);
        toggle.onTurn('me', 5);
        state(false, true, /Turn 5/);
        shownChats(/now LOCKED/);
        var n = toggle.shownChat.length;
        toggle.onTurn('opp', 5);
        ok(toggle.shownChat.length === n);
    });

    // Toggle should lock on first player's Turn 5
    // Nothing should happend on second player's Turn 5
    test("default - Turn 5s (opp first)", function () {
        humanSetup(false, false);
        toggle.onTurn('opp', 5);
        state(false, true, /Turn 5/);
        shownChats(/now LOCKED/);
        var n = toggle.shownChat.length;
        toggle.onTurn('me', 5);
        ok(toggle.shownChat.length === n);
    });

    test("request - init", function () {
        consoleLogging = true;
        humanSetup(true, false);
        state(true, false, null);
        shownChats(/is ON/, /#vphelp/);
        consoleLogging = false;
    });

    test("request - Opp #vpon", function () {
        humanSetup(true, false);
        toggle.onOppChat('opp', '#vpon');
        state(true, true, /all players said/);
        sentChats(/#vpon/);
        shownChats(/now locked to ON/);
    });

    // Don't respond more than once to opp's #vpon
    test("request - Opp #vpon twice", function () {
        humanSetup(true, false);
        toggle.onOppChat('opp', '#vpon');
        var n = toggle.sentChat.length;
        toggle.onOppChat('opp', '#vpon');
        equal(toggle.sentChat.length, n);
    });

    // This test is redundant
    //test("request - Opp #vpoff", function () {
    //    humanSetup(true, false);
    //    toggle.onOppChat('opp', '#vpoff');
    //    state(false, true, /opp said/);
    //    sentChats(/Ok, my VP counter is off and locked/);
    //});

    test("request - unlocked at my Turn 2", function () {
        humanSetup(true, false);
        toggle.onTurn('me', 2);
        sentChats(/#vpon/);
        state(true, false, null);
    });

    test("request - locked ON at my Turn 2", function () {
        humanSetup(true, false);
        setState(true, true, null);

        toggle.alreadyResponded = false;
        toggle.onTurn('me', 2);
        state(true, true, null);
        sentChats(/I am using/, /#vpon/);

        var n = toggle.sentChat.length;
        toggle.onTurn('me', 2);
        state(true, true, null);
        equal(toggle.sentChat.length, n);
    });

    test("request - locked OFF at my Turn 2", function () {
        humanSetup(true, false);
        setState(false, true, null);
        var n = toggle.sentChat.length;
        toggle.onTurn('me', 2);
        state(false, true, null);
        equal(toggle.sentChat.length, n);
    });


    test("refuse - init", function () {
        humanSetup(false, true);
        state(false, false, null);
        shownChats(/is OFF/, /#vphelp/);
    });

    // TODO: Is this test redundant?
    //// Don't respond to opp's #vpon if already locked
    //test("refuse - Opp #vpon when locked", function () {
    //    humanSetup(false, true);
    //    setState(false, true);
    //    var n = toggle.sentChat.length;
    //    toggle.onOppChat('opp', '#vpon');
    //    equal(toggle.sentChat.length, n);
    //});

    // Respond with #vpoff to opp's #vpon.
    // Don't respond more than once.
    test("refuse - Opp #vpon twice", function () {
        humanSetup(false, true);
        toggle.onOppChat('opp', '#vpon');
        state(false, true, /me said #vpoff/);
        toggle.onOppChat('opp', '#vpon');
        sentChats(/#vpoff/, /Sorry/);
    });

    // Should do nothing on Turn 2
    test("refuse - my Turn 2", function () {
        humanSetup(false, true);
        state(false, false, null);
        var m = toggle.shownChat.length;
        var n = toggle.sentChat.length;
        toggle.onTurn('me', 2);
        toggle.onTurn('opp', 2);
        state(false, false, null);
        equal(m, toggle.shownChat.length);
        equal(n, toggle.sentChat.length);
    });

    test("tablename #vpon - init", function () {
        humanSetup(false, false, '#vpon');
        state(true, true, /table name contained/);
        shownChats(/is ON and LOCKED/, /#vphelp/);
    });

    test("tablename #vpoff - init", function () {
        humanSetup(false, false, '#vpoff');
        state(false, true, /table name contained/);
        shownChats(/is OFF and LOCKED/, /#vphelp/);
    });

    test("tablename #vpon - Turn 2, opp #vpoff", function () {
        humanSetup(false, false, '#vpon');
        state(true, true, /table name contained/);
        shownChats(/is ON and LOCKED/, /#vphelp/);
        toggle.onTurn('me', 2);
        sentChats(/I am using/, /#vpon/);
        toggle.onOppChat('opp', '#vpoff');
        sentChats(/Sorry.*table name/);
    });

    test("locked ON - opp #vpon", function () {
        humanSetup(false, false);
        setState(true, true, 'reason');
        var n = toggle.sentChat.length;
        toggle.onOppChat('opp', '#vpon');
        state(true, true, /reason/);
        equal(toggle.sentChat.length, n);
    });

    test("locked ON - my #vpon", function () {
        humanSetup(false, false);
        setState(true, true, 'reason');
        var n = toggle.shownChat.length;
        toggle.onMyChat('#vpon');
        state(true, true, /reason/);
        equal(toggle.shownChat.length, n);
    });

    test("locked ON - opp #vpoff", function () {
        humanSetup(false, false);
        setState(true, true, 'reason');
        toggle.onOppChat('opp', '#vpoff');
        state(true, true, /reason/);
        sentChats(/locked to ON because reason/);
    });

    test("locked ON - my #vpoff", function () {
        humanSetup(false, false);
        setState(true, true, 'reason');
        toggle.onMyChat('#vpoff');
        state(true, true, /reason/);
        shownChats(/locked to ON because reason/);
    });

    test("locked OFF - opp #vpoff", function () {
        humanSetup(false, false);
        setState(false, true, 'reason');
        toggle.onOppChat('opp', '#vpoff');
        state(false, true, /reason/);
    });

    test("locked OFF - my #vpoff", function () {
        humanSetup(false, false);
        setState(false, true, 'reason');
        toggle.onMyChat('#vpoff');
        state(false, true, /reason/);
        shownChats(/already/);
    });

    test("locked OFF - opp #vpon", function () {
        humanSetup(false, false);
        setState(false, true, 'reason');
        toggle.onOppChat('opp', '#vpon');
        state(false, true, /reason/);
        sentChats(/locked to OFF because reason/);
    });

    test("locked OFF - my #vpon", function () {
        humanSetup(false, false);
        setState(false, true, 'reason');
        toggle.onMyChat('#vpon');
        state(false, true, /reason/);
        shownChats(/locked to OFF because reason.*#vpx/);
    });

    test("locked ON - My #vpx, Opp #vpx", function () {
        humanSetup(false, false);
        setState(true, true, 'reason');
        toggle.onMyChat('#vpx');
        sentChats(/but I'd like to turn it off/);
        toggle.onOppChat('opp', '#vpx');
        state(false, true, /all players said #vpx/);
        sentChats(/is now off/);
    });

    test("locked ON - Opp #vpx, My #vpx", function () {
        humanSetup(false, false);
        setState(true, true, 'reason');
        toggle.onOppChat('opp', '#vpx');
        toggle.onMyChat('#vpx');
        state(false, true, /all players said #vpx/);
        sentChats(/is now off/);
    });

    test("locked OFF - My #vpx, Opp #vpx", function () {
        humanSetup(false, false);
        setState(false, true, 'reason');
        toggle.onMyChat('#vpx');
        sentChats(/but I'd like to turn it on/);
        toggle.onOppChat('opp', '#vpx');
        state(true, true, /all players said #vpx/);
        sentChats(/is now on/);
    });

    test("locked OFF - Opp #vpx, My #vpx", function () {
        humanSetup(false, false);
        setState(false, true, 'reason');
        toggle.onOppChat('opp', '#vpx');
        toggle.onMyChat('#vpx');
        state(true, true, /all players said #vpx/);
        sentChats(/is now on/);
    });

    test("OFF - My #vp?", function () {
        humanSetup(false, false);
        setState(false, false, 'reason');
        toggle.onMyChat('#vp?');
        shownChats(/Cannot show scores/);
    });

    test("OFF - Opp #vp?", function () {
        humanSetup(false, false);
        setState(false, false, 'reason');
        toggle.onOppChat('opp', '#vp?');
        sentChats(/Cannot show scores/);
    });

    test("ON - My #vp?", function () {
        humanSetup(false, false);
        setState(true, false, 'reason');
        toggle.onOppChat('opp', '#vp?');
        sentChats(/me:.*opp:.*/);
    });

    test("ON - Opp #vp?", function () {
        humanSetup(false, false);
        setState(true, false, 'reason');
        toggle.onOppChat('opp', '#vp?');
        sentChats(/me:.*opp:.*/);
    });

    test("vs Bots, default - My #vpon/#vpoff", function () {
        botSetup(false, false);
        state(true, false, null);
        toggle.onMyChat("#vpoff");
        state(false, false, null);
        toggle.onMyChat("#vpon");
        state(true, false, null);
        toggle.onMyChat("#vpoff");
        state(false, false, null);
    });

    test("vs Bots, request - My #vpon/#vpoff", function () {
        botSetup(true, false);
        state(true, false, null);
        toggle.onMyChat("#vpoff");
        state(false, false, null);
        toggle.onMyChat("#vpon");
        state(true, false, null);
        toggle.onMyChat("#vpoff");
        state(false, false, null);
    });

    test("vs Bots, refuse - My #vpon/#vpoff", function () {
        botSetup(false, true);
        state(true, false, null);
        toggle.onMyChat("#vpoff");
        state(false, false, null);
        toggle.onMyChat("#vpon");
        state(true, false, null);
        toggle.onMyChat("#vpoff");
        state(false, false, null);
    });

    test("vs Bots, request - Turn 2", function () {
        botSetup(true, false);
        var n = toggle.shownChat.length;
        toggle.onTurn('me', 2);
        equal(toggle.shownChat.length, n);
    });

    test("vs Bots - Turn 5", function () {
        botSetup(true, false);
        var n = toggle.shownChat.length;
        toggle.onTurn('me', 5);
        equal(toggle.shownChat.length, n);
        state(true, false, null);
    });
}());
