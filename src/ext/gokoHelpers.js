var defineGokoHelperFunctions = function() {
    if (typeof AM === 'undefined') {
       AM = {};
    };

    AM.getGameOwnedBy = function(hostname) {
        return mtgRoom.helpers.ZoneClassicHelper.currentTableList.models
                                                .filter( function(t) {
            return t.get('owner') && 
                   (t.get('owner').get('player').get('playerName') === hostname);
        })[0];
    }

    // Asynchronously join a game at the first empty seat
    AM.joinGame = function(tableModel) { 
        // Get the table index and first open seat
        opts = {table: tableModel.get('number'),
                seat: tableModel.get('seats').filter(function(s) {
                    return s.getOccAddr() === null;
                })[0].get('number'),
                ready: true};

        // Join, sit, and tell Goko that we're ready (async)
        conn.joinAndSit(opts, function () {
            conn.setReady(opts);
        });
    }

    AM.getRoom = function(roomName) {
        return mtgRoom.roomList.models.filter(function(m) {
            return m.get('name') == roomName;
        })[0];
    };

    AM.getAllTables = function() {
      return mtgRoom.helpers.ZoneClassicHelper
                    .currentRoom.attributes.tableList.models;
    }

    AM.getRealTables = function() {
        return AM.getAllTables().filter(
            function(m) { return m.get('owner') != null; }
        );
    };

    AM.makeGame = function(kingdom) {
        var testKingdom = kingdom.split(',');
        var testSettings = {name: "test",
                            seatsState: [true, true, false, false, false, false],
                            gameData: {uid: ""},
                            kingdomCards: testKingdom,
                            platinumColony: false,
                            useShelters: false,
                            ratingType: "casual"};
        var testOpts = {settings: JSON.stringify(testSettings),
                        isLock: false,
                        isRequestJoin: false,
                        isRequestSit: false,
                        tableIndex: null};
        console.log(testOpts);
        mtgRoom.helpers.ZoneClassicHelper.createTable(testOpts);
    };

    AM.makeTestgame1 = function() {
        AM.makeGame('cellar,warehouse,forager,scavenger,scheme,rebuild,tunnel,hamlet,goons,oracle');
    };

    AM.createGame = function(opps, rsys) {

        // Name the table like "AM for <opp1>, <opp2>, ..., <oppN>"
        var title = 'AM for ' + opps.join(',');

        // Goko's unfathomably stupid seatState option property
        var ss = [];
        for (i = 0; i < 6; i++) { ss.push(i < opps.length + 1); }

        // NOTE: Goko will ignore the kingdom, platinum, and shelters properties.
        // TODO: Do I need to enter any of these settings at all?
        // TODO: Is there a helper method for creating a table?
        var testKingdom = ["gardens", "cellar", "smithy", "village", "councilRoom",
                           "bureaucrat", "chapel", "workshop", "festival", "market"];
        var testSettings = {name: title,
                            seatsState: ss,
                            gameData: {uid: ""},
                            kingdomCards: testKingdom,
                            platinumColony: false,
                            useShelters: false,
                            ratingType: rsys};
        var testOpts = {settings: JSON.stringify(testSettings),
                        isLock: false,
                        isRequestJoin: true,
                        isRequestSit: false,
                        tableIndex: null};

        // Finally create the table and hide the game announcement 
        console.log(testOpts);
        mtgRoom.helpers.ZoneClassicHelper.createTable(testOpts);
    };

    // Disable/reenable the join request dialog. When disabled, accept the
    // Automatch game's opponents and reject all others.
    AM.setAutoaccept = function(enabled, opps) {
        if (enabled) {
            // Disable the original dialog. Enable auto-accept.

            // Cache the Goko function that shows a request dialog
            AM.sbrTemp = mtgRoom.views.ClassicRoomsPermit.showByRequest;

            // Replace it with automatic accept/reject
            mtgRoom.views.ClassicRoomsPermit.showByRequest = function(req) {
                var joiner = mtgRoom.playerList
                                    .findByAddress(req.data.playerAddress)
                                    .get('playerName');
                console.log('Received join request from ' + joiner);
                var jopts = {tag: req, playerAddress: req.data.playerAddress }
                if (opps.indexOf(joiner) >= 0) {
                    this.helper.allowPlayerToJoin(jopts);
                    console.log('... allowed');
                } else {
                    this.helper.denyPlayerToJoin(jopts);
                    console.log('... rejected');
                }
            };

        } else {

            // Reenable the original dialog. Disable auto-accept.
            mtgRoom.views.ClassicRoomsPermit.showByRequest = AM.sbrTemp;
            delete AM.sbrTemp;
        } 
    };

    AM.getHost = function(match) {
        return match.seeks.filter( function(s) {
            return s.player.pname == match.hostname;
        })[0].player;
    }

    AM.getNames = function(match) {
        return match.seeks.map(function(s) {
            return s.player.pname;
        });
    }

    AM.getOppnames = function(match, myName) {
        return AM.getNames(match).filter(function(p) {
            return p !== myName;
        });
    }
};

// Execute our code in Goko's JS context by appending it to the document
var script = document.createElement('script');
script.textContent = '(' + defineGokoHelperFunctions + ')();';
document.body.appendChild(script);
