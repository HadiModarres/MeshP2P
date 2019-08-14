'use strict';

var RTC_LOCAL_ID_STORAGE_KEY = "cyclon-rtc-local-node-id";
var POINTER_SEQUENCE_STORAGE_KEY = "cyclon-rtc-pointer-sequence-counter";

var EventEmitter = require("events").EventEmitter;
var Promise = require("bluebird");
var url = require('url');
var Utils = require("cyclon.p2p-common");

function SocketIOSignallingService (signallingSocket, logger, httpRequestService, storage) {

    Utils.checkArguments(arguments, 4);

    var myself = this;
    var localId = null;
    var correlationIdCounter = 0;
    var answerEmitter = new EventEmitter();
    var pointerCounter = 0;
    var metadataProviders = {};

    // Listen for signalling messages
    signallingSocket.on("answer", function(message) {
        logger.debug("Answer received from: " + message.sourceId + " (correlationId " + message.correlationId + ")");
        answerEmitter.emit("answer-" + message.correlationId, message);
    });
    signallingSocket.on("offer", function (message) {
        logger.debug("Offer received from: " + message.sourceId + " (correlationId " + message.correlationId + ")");
        myself.emit("offer", message);
    });
    signallingSocket.on("candidates", function (message) {
        logger.debug(message.iceCandidates.length + " ICE Candidates received from: " + message.sourceId + " (correlationId " + message.correlationId + ")");
        myself.emit("candidates-" + message.sourceId + "-" + message.correlationId, message);
    });

    /**
     * Connect to the signalling server(s)
     */
    this.connect = function (sessionMetadataProviders, rooms) {
        metadataProviders = sessionMetadataProviders || {};
        signallingSocket.connect(this, rooms);
    };

    /**
     * Send an offer message over the signalling channel
     *
     * @param destinationNode
     * @param type
     * @param sessionDescription
     */
    this.sendOffer = function (destinationNode, type, sessionDescription) {
        logger.debug("Sending offer SDP to " + destinationNode.id);

        var correlationId = correlationIdCounter++;
        var localPointer = this.createNewPointer();

        return postToFirstAvailableServer(destinationNode, randomiseServerOrder(destinationNode), "./api/offer", {
            channelType: type,
            sourceId: localPointer.id,
            correlationId: correlationId,
            sourcePointer: localPointer,
            destinationId: destinationNode.id,
            sessionDescription: sessionDescription
        })
        .then(function() {
            return correlationId;
        });
    };

    this.waitForAnswer = function (correlationId) {
        return new Promise(function(resolve) {
            answerEmitter.once("answer-" + correlationId, function(answer) {
                resolve(answer);
            });
        })
        .cancellable()
        .catch(Promise.CancellationError, function(e) {
            logger.warn("Clearing wait listener for correlation ID " + correlationId);
            answerEmitter.removeAllListeners("answer-" + correlationId);
            throw e;
        });
    };

    /**
     * Create a new pointer to this RTC node
     */
    this.createNewPointer = function () {
        var pointer = {
            id: this.getLocalId(),
            age: 0,
            seq: getNextPointerSequenceNumber(),
            metadata: {}
        };

        if (metadataProviders) {
            for (var metaDataKey in metadataProviders) {
                try {
                    pointer.metadata[metaDataKey] = metadataProviders[metaDataKey]();
                }
                catch(e) {
                    logger.error("An error occurred generating metadata (key: " + metaDataKey + ")", e);
                }
            }
        }

        // Populate current signalling details
        pointer.signalling = signallingSocket.getCurrentServerSpecs();
        return pointer;
    };

    /**
     * Get the next pointer sequence number (restoring from storage if it's present)
     */
    function getNextPointerSequenceNumber () {
        if (pointerCounter === 0) {
            var storedSequenceNumber = storage.getItem(POINTER_SEQUENCE_STORAGE_KEY);
            pointerCounter = typeof(storedSequenceNumber) === "number" ? storedSequenceNumber : 0;
        }
        var returnValue = pointerCounter++;
        storage.setItem(POINTER_SEQUENCE_STORAGE_KEY, pointerCounter);
        return returnValue;
    }

    /**
        Get the local node ID
    */
    this.getLocalId = function () {
        if(localId === null) {
            var storedId = storage.getItem(RTC_LOCAL_ID_STORAGE_KEY);
            if(storedId !== null) {
                localId = storedId;
            }
            else {
                localId = Utils.generateGuid();
                storage.setItem(RTC_LOCAL_ID_STORAGE_KEY, localId);
            }
        }
        return localId;
    };

    /**
     * Send an answer message over the signalling channel
     *
     * @param destinationNode
     * @param correlationId
     * @param sessionDescription
     */
    this.sendAnswer = function (destinationNode, correlationId, sessionDescription) {
        logger.debug("Sending answer SDP to " + destinationNode.id);

        return postToFirstAvailableServer(destinationNode, randomiseServerOrder(destinationNode), "./api/answer", {
            sourceId: this.getLocalId(),
            correlationId: correlationId,
            destinationId: destinationNode.id,
            sessionDescription: sessionDescription
        });
    };

    /**
     * Send an array of one or more ICE candidates
     */
    this.sendIceCandidates = function (destinationNode, correlationId, iceCandidates) {
        iceCandidates.forEach(function(candidate) {
            logger.debug("Sending ice candidate: " + candidate.candidate + " to " + destinationNode.id);
        });

        return postToFirstAvailableServer(destinationNode, randomiseServerOrder(destinationNode), "./api/candidates", {
            sourceId: this.getLocalId(),
            correlationId: correlationId,
            destinationId: destinationNode.id,
            iceCandidates: iceCandidates
        });
    };

    /**
     * Post an object to the first available signalling server
     *
     * @param destinationNode
     * @param signallingServers
     * @param path
     * @param message
     * @returns {Promise}
     */
    function postToFirstAvailableServer (destinationNode, signallingServers, path, message) {

        return new Promise(function (resolve, reject) {
            if (signallingServers.length === 0) {
                reject(new Utils.UnreachableError(createUnreachableErrorMessage(destinationNode)));
            }
            else {
                //noinspection JSCheckFunctionSignatures
                httpRequestService.post(url.resolve(signallingServers[0].signallingApiBase, path), message)
                    .then(resolve)
                    .catch(function (error) {
                        logger.warn("An error occurred sending signalling message using " + signallingServers[0].signallingApiBase + " trying next signalling server", error);
                        postToFirstAvailableServer(destinationNode, signallingServers.slice(1), path, message).then(resolve, reject);
                    });
            }
        });
    }

    function createUnreachableErrorMessage(destinationNode) {
        return "Unable to contact node " + destinationNode.id + " using signalling servers: " + JSON.stringify(destinationNode.signalling.map(function (server) {
            return server.signallingApiBase
        }));
    }

    function randomiseServerOrder(destinationNode) {
        return Utils.shuffleArray(destinationNode.signalling.slice(0));
    }
}

SocketIOSignallingService.prototype = Object.create(EventEmitter.prototype);

module.exports = SocketIOSignallingService;
