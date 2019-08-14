'use strict';

var cyclon = require("./lib");

var NUM_NODES = 50;
var REPORT_INTERVAL_MS = 1000;
var round = 0;

var localSimulation = new cyclon.LocalSimulation(NUM_NODES);

console.log("Starting Cyclon.p2p simulation of " + NUM_NODES + " nodes");
console.log("Ideal entropy is " + localSimulation.getIdealEntropy());

localSimulation.startSimulation();

/**
 * Start reporting
 */
setInterval(dumpNetworkStats, REPORT_INTERVAL_MS);

function dumpNetworkStats() {
    round++;
    var networkStats = localSimulation.getNetworkStatistics();

    console.log(round + ": entropy (min=" + networkStats.entropy.min + ", mean=" + networkStats.entropy.mean + ", max=" + networkStats.entropy.max + "), "
        + "in-degree (mean=" + networkStats.inDegree.mean + ", std.dev=" + networkStats.inDegree.standardDeviation + "), "
        + "orphans=" + networkStats.orphanCount);
}
