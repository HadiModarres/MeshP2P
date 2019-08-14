'use strict';

var rtc = require("../lib/index.js");
var Utils = require("cyclon.p2p-common");
var SimulatedNode = require("./SimulatedNode");
var SIGNALLING_SERVER = [
    {
        "socket": {
            "server": "http://localhost:12345"
        },
        "signallingApiBase": "http://localhost:12345/"
    }
];
var socketFactory = new rtc.SocketFactory();
var timingService = new rtc.TimingService();
var httpRequestService = new rtc.HttpRequestService();

var allNodes = [];
var startedNodes = [];
var currentNodeCounter = 0;

var args = process.argv.slice(2);

if (args.length !== 1) {
    console.log("Usage: node runsimulation.js [number_of_nodes]");
    process.exit(1);
}

var numberOfNodes = args[0];

var logger = Utils.consoleLogger();
logger.setLevelToWarning();


for (var i = 0; i < numberOfNodes; i++) {
    var currentNode = new SimulatedNode(createSignallingService(), startedNodes);
    allNodes.push(currentNode);
}

setInterval(printAverageShuffleTime, 10000);
staggeredStart();

function createSignallingService() {
    var storage = Utils.newInMemoryStorage();
    var signallingServerService = new rtc.StaticSignallingServerService(SIGNALLING_SERVER);
    var signallingServerSelector = new rtc.SignallingServerSelector(signallingServerService, storage, timingService, 5000);
    var signallingSocket = new rtc.RedundantSignallingSocket(
        signallingServerService,
        socketFactory,
        logger,
        Utils.asyncExecService(),
        signallingServerSelector);

    return new rtc.SocketIOSignallingService(
        signallingSocket,
        logger,
        httpRequestService,
        storage);
}

function staggeredStart() {
    allNodes[currentNodeCounter].start();
    startedNodes.push(allNodes[currentNodeCounter]);
    console.log("Started node " + (currentNodeCounter + 1) + " of " + allNodes.length);
    if (++currentNodeCounter < allNodes.length) {
        setTimeout(staggeredStart, Math.floor(100 * Math.random()));
    }
}

function printAverageShuffleTime() {
    var sum = 0;
    var count = 0;
    for (var i = 0; i < currentNodeCounter; i++) {
        var lastShuffleTime = allNodes[i].getLastShuffleTime();
        if (lastShuffleTime > 0) {
            sum += lastShuffleTime;
            count++;
        }
    }

    if (count > 0) {
        console.log("Average shuffle time = " + (sum / count) + " ms");
    }
}