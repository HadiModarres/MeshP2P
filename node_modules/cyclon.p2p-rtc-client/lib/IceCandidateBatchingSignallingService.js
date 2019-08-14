'use strict';

var Utils = require("cyclon.p2p-common");
var Promise = require("bluebird");

/**
 * A decorator for a signalling service that batches ICE candidate messages to
 * reduce candidate messages when the transport is expensive
 *
 * @param asyncExecService
 * @param signallingService
 * @param batchingDelayMs
 * @constructor
 */
function IceCandidateBatchingSignallingService(asyncExecService, signallingService, batchingDelayMs) {

    Utils.checkArguments(arguments, 3);

    var queuedCandidates = {};
    var deliveryPromises = {};

    this.on = function () {
        return signallingService.on.apply(signallingService, arguments);
    };

    this.removeAllListeners = function () {
        return signallingService.removeAllListeners.apply(signallingService, arguments);
    };

    this.connect = function () {
        return signallingService.connect.apply(signallingService, arguments);
    };

    this.sendOffer = function () {
        return signallingService.sendOffer.apply(signallingService, arguments);
    };

    this.waitForAnswer = function (correlationId) {
        return signallingService.waitForAnswer.apply(signallingService, arguments);
    };

    this.createNewPointer = function () {
        return signallingService.createNewPointer.apply(signallingService, arguments);
    };

    this.getLocalId = function () {
        return signallingService.getLocalId.apply(signallingService, arguments);
    };

    this.sendAnswer = function () {
        return signallingService.sendAnswer.apply(signallingService, arguments);
    };

    this.sendIceCandidates = function (destinationNode, correlationId, iceCandidates) {
        var newQueue = iceCandidates;
        var existingQueue = getQueue(destinationNode.id, correlationId);
        if (existingQueue) {
            newQueue = existingQueue.concat(iceCandidates);
        }
        else {
            // This is the first set of candidates to be queued for the destination/correlationId combo, schedule their delivery
            setPromise(destinationNode.id, correlationId, scheduleCandidateDelivery(destinationNode, correlationId));
        }
        setQueue(destinationNode.id, correlationId, newQueue);
        return getPromise(destinationNode.id, correlationId);
    };

    function getPromise(destinationNodeId, correlationId) {
        if (deliveryPromises.hasOwnProperty(destinationNodeId) && deliveryPromises[destinationNodeId].hasOwnProperty(correlationId)) {
            return deliveryPromises[destinationNodeId][correlationId];
        }
        else {
            throw new Error("Couldn't locate promise for send?! (this should never happen)");
        }
    }

    function setPromise(nodeId, correlationId, newPromise) {
        if (!deliveryPromises.hasOwnProperty(nodeId)) {
            deliveryPromises[nodeId] = {};
        }
        deliveryPromises[nodeId][correlationId] = newPromise;
    }

    function deletePromise(nodeId, correlationId) {
        delete deliveryPromises[nodeId][correlationId];
        if (Object.keys(deliveryPromises[nodeId]).length === 0) {
            delete deliveryPromises[nodeId];
        }
    }

    function getQueue(nodeId, correlationId) {
        if (queuedCandidates.hasOwnProperty(nodeId) && queuedCandidates[nodeId].hasOwnProperty(correlationId)) {
            return queuedCandidates[nodeId][correlationId];
        }
        return null;
    }

    function setQueue(nodeId, correlationId, newQueue) {
        if (!queuedCandidates.hasOwnProperty(nodeId)) {
            queuedCandidates[nodeId] = {};
        }
        queuedCandidates[nodeId][correlationId] = newQueue;
    }

    function deleteQueue(nodeId, correlationId) {
        delete queuedCandidates[nodeId][correlationId];
        if (Object.keys(queuedCandidates[nodeId]).length === 0) {
            delete queuedCandidates[nodeId];
        }
    }

    function scheduleCandidateDelivery(destinationNode, correlationId) {
        return new Promise(function (resolve, reject) {
            asyncExecService.setTimeout(function () {
                var queueToSend = getQueue(destinationNode.id, correlationId);
                deleteQueue(destinationNode.id, correlationId);
                deletePromise(destinationNode.id, correlationId);
                signallingService.sendIceCandidates(destinationNode, correlationId, queueToSend)
                    .then(resolve, reject);
            }, batchingDelayMs);
        });
    }
}

module.exports = IceCandidateBatchingSignallingService;