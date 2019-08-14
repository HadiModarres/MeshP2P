'use strict';

var Utils = require("cyclon.p2p-common");
var LAST_CONNECTED_SERVERS_KEY = "CyclonJSLastConnectedServerList";
var ANCIENT_TIMESTAMP_MILLISECONDS_SINCE_EPOCH = new Date("October 6, 1980 02:20:00").getTime();

function SignallingServerSelector(signallingServerService, storage, timingService, delayBeforeRetryMilliseconds) {

    Utils.checkArguments(arguments, 4);

    var randomSortValues = {};
    var lastDisconnectTimes = {};

    this.getServerSpecsInPriorityOrder = function() {
        return filterAndSortAvailableServers(signallingServerService.getSignallingServerSpecs());
    };

    /**
     * Return a copy of the known server array sorted in the order of
     * their last-disconnect-time. Due to the fact a failed connect is
     * considered a disconnect, this will cause servers to be tried in
     * a round robin pattern.
     */
    function filterAndSortAvailableServers (serverArray) {
        var copyOfServerArray = JSON.parse(JSON.stringify(serverArray));
        copyOfServerArray.sort(function (itemOne, itemTwo) {
            return sortValue(itemOne) - sortValue(itemTwo);
        });

        // Filter servers we've too-recently disconnected from
        return copyOfServerArray.filter(haveNotDisconnectedFromRecently);
    }

    function haveNotDisconnectedFromRecently(signallingServer) {
        var lastDisconnectTime = lastDisconnectTimes[signallingServer.signallingApiBase];
        return lastDisconnectTime === undefined ||
            timingService.getCurrentTimeInMilliseconds() - lastDisconnectTime > delayBeforeRetryMilliseconds;
    }

    /**
     * Return the value to be used in the ascending sort of
     * server specs. It will use the last disconnect time if it's
     * present, or a random number guaranteed to be prior to the
     * earliest disconnect time, to randomise the order servers are
     * tried initially.
     *
     * @param serverSpec
     */
    function sortValue (serverSpec) {
        var signallingApiBase = serverSpec.signallingApiBase;
        return lastDisconnectTimes[signallingApiBase] || getRandomSortValue(signallingApiBase);
    }

    /**
     * Generate a CONSISTENT (for a given signallingApiBase) random timestamp well in the past
     */
    function getRandomSortValue (signallingApiBase) {
        var value;

        // Prefer servers we were connected to before a reload
        if (getLastConnectedServers().indexOf(signallingApiBase) >= 0) {
            return 0;
        }

        if (randomSortValues.hasOwnProperty(signallingApiBase)) {
            value = randomSortValues[signallingApiBase];
        }
        else {
            value = randomSortValues[signallingApiBase] = Math.floor(Math.random() * ANCIENT_TIMESTAMP_MILLISECONDS_SINCE_EPOCH);
        }
        return value;
    }

    this.flagDisconnection = function(apiBase) {
        lastDisconnectTimes[apiBase] = timingService.getCurrentTimeInMilliseconds()
    };

    /**
     * Store the last connected signalling servers so they can be
     * re-connected to on a reload
     */
    this.setLastConnectedServers = function(apiUrls) {
        storage.setItem(LAST_CONNECTED_SERVERS_KEY, apiUrls);
    };

    /**
     * Gets the list of last connected servers (if available) from
     * session storage
     *
     * @returns {*}
     */
    function getLastConnectedServers () {
        var storedValue = storage.getItem(LAST_CONNECTED_SERVERS_KEY);
        return storedValue || [];
    }
}

module.exports = SignallingServerSelector;