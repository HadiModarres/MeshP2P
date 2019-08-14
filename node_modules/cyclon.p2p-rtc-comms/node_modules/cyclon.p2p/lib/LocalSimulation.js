'use strict';

var gauss = require("gauss");
var cyclon = require("./index");
var Util = require("cyclon.p2p-common");

/**
 * A local Cyclon.p2p simulation
 *
 * @param numberOfNodes The number of nodes to simulate
 */
function LocalSimulation(numberOfNodes) {

    var allNodes = {};
    var localBootstrap = new cyclon.LocalBootstrap(numberOfNodes);
    var logger = Util.consoleLogger();
    logger.setLevelToWarning();
    var nodes = [];
    var neighbourSets = [];
    var peerSequences = {};
    var idealSequence = [];
    var idealEntropy;

    for (var nodeId = 0; nodeId < numberOfNodes; nodeId++) {
        var nodeIdString = String(nodeId);
        idealSequence.push(nodeIdString);
        var cyclonNode = cyclon.builder(new cyclon.LocalComms(nodeIdString, allNodes), localBootstrap)
            .withTickIntervalMs(1000)
            .withLogger(logger)
            .build();

        nodes.push(cyclonNode);
        var neighbourSet = cyclonNode.getNeighbourSet();
        neighbourSets.push(neighbourSet);

        // Peer sequence recorder
        neighbourSet.on("change", peerSequenceAppenderFor(nodeIdString));
    }

    idealEntropy = calculateEntropy(idealSequence.slice(1));

    /**
     * Get the "ideal" entropy for a peer sequence given the number of nodes in the simulation
     */
    this.getIdealEntropy = function () {
        return idealEntropy;
    };

    /**
     * Start the simulation
     */
    this.startSimulation = function () {
        nodes.forEach(function (node) {
            node.start();
        });
    };

    /**
     * Get the stats for the current state of the network
     */
    this.getNetworkStatistics = function () {
        var entropyValuesVector = getEntropyValues();
        var inDegreeVector = getInDegreeValues();

        return {
            entropy: {
                min: entropyValuesVector.min(),
                mean: entropyValuesVector.mean(),
                max: entropyValuesVector.max()
            },
            inDegree: {
                mean: inDegreeVector.mean(),
                standardDeviation: inDegreeVector.stdev()
            },
            orphanCount: inDegreeVector.frequency(0)
        };
    };

    /**
     * Get a vector containing the in-degree of every node in the network
     */
    function getInDegreeValues() {
        var inDegrees = {};

        neighbourSets.forEach(function (neighbourSet) {
            for (var id in allNodes) {
                var increment = neighbourSet.contains(id) ? 1 : 0;
                inDegrees[id] = inDegrees[id] === undefined ? increment : inDegrees[id] + increment;
            }
        });

        var inDegreesArray = [];
        for (var key in inDegrees) {
            var countForKey = inDegrees[key];
            inDegreesArray.push(countForKey);
        }

        return new gauss.Vector(inDegreesArray);
    }

    /**
     * Get a vector containing the peer stream entropy of every node in the network
     */
    function getEntropyValues() {
        var entropyValues = [];

        for (nodeId in peerSequences) {
            entropyValues.push(calculateEntropyForNode(nodeId));
        }

        return new gauss.Vector(entropyValues);
    }

    /**
     * Create a peer sequence appender for a particular node
     *
     * @param nodeId The ID of the node whose sequence to append to
     */
    function peerSequenceAppenderFor(nodeId) {
        return function (type, neighbour) {
            if (type === "insert") {
                appendPeerToSequence(nodeId, neighbour);
            }
        };
    }

    /**
     * Append a peer's ID to the sequence for a particular node
     *
     * @param nodeId The ID of the node whose sequence to append
     * @param nextPointer The pointer to the peer to append
     */
    function appendPeerToSequence(nodeId, nextPointer) {
        if (!peerSequences.hasOwnProperty(nodeId)) {
            peerSequences[nodeId] = [];
        }
        peerSequences[nodeId].push(nextPointer.id);
    }

    /**
     * Calculate the entropy of the peer sequence for a node
     *
     * @param nodeId The node whose sequence to analyse
     */
    function calculateEntropyForNode(nodeId) {
        return calculateEntropy(peerSequences[nodeId]);
    }

    function calculateEntropy(peerSequence) {
        var sequenceLength = peerSequence.length;

        var counts = new gauss.Collection(peerSequence).distribution();
        var distinctIds = Object.keys(counts);
        var entropy = 0;
        for (var i = 0, distinctIdCount = distinctIds.length; i < distinctIdCount; i++) {
            var currentId = distinctIds[i];
            var probability = counts[currentId] / sequenceLength;
            entropy = entropy + (probability * log2(probability));
        }

        return -1 * entropy;
    }

    function log2(number) {
        return Math.log(number) / Math.log(2);
    }
}

module.exports = LocalSimulation;