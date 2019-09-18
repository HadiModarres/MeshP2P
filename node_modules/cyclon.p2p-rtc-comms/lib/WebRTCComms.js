'use strict';

var CYCLON_SHUFFLE_CHANNEL_TYPE = "cyclonShuffle";

var Promise = require("bluebird");
var Utils = require("cyclon.p2p-common");

function WebRTCComms(rtc, shuffleStateFactory, logger) {

    Utils.checkArguments(arguments, 3);

    var __localNode = null;
    var __currentOutgoingShuffle = null;
    var __lastShuffleNode = null;

    /**
     * Initialize the Comms object
     *
     * @param localNode The local Cyclon node
     * @param metadataProviders
     */
    this.initialize = function (localNode, metadataProviders) {

        Utils.checkArguments(arguments, 2);

        __localNode = localNode;
        rtc.connect(metadataProviders, ["CyclonWebRTC"]);
        rtc.onChannel("cyclonShuffle", this.handleIncomingShuffle);
        rtc.on("incomingTimeout", function(channelType, sourcePointer) {
            if(channelType === CYCLON_SHUFFLE_CHANNEL_TYPE) {
                __localNode.emit("shuffleTimeout", "incoming", sourcePointer);
            }
        });
        rtc.on("incomingError", function(channelType, sourcePointer, error) {
            if(channelType === CYCLON_SHUFFLE_CHANNEL_TYPE) {
                logger.error("An error occurred on an incoming shuffle", error);
                __localNode.emit("shuffleError", "incoming", sourcePointer, error);
            }
        });
        rtc.on("offerReceived", function(channelType, sourcePointer) {
            if(channelType === CYCLON_SHUFFLE_CHANNEL_TYPE) {
                logger.debug("Incoming shuffle starting with " + sourcePointer.id);
                __localNode.emit("shuffleStarted", "incoming", sourcePointer);
            }
        });
    };

    /**
     * Send a shuffle request to another node
     *
     * @param destinationNodePointer
     * @param shuffleSet
     */
    this.sendShuffleRequest = function (destinationNodePointer, shuffleSet) {

        if (__currentOutgoingShuffle !== null && __currentOutgoingShuffle.isPending()) {
            logger.warn("Previous outgoing request timed out (to " + __lastShuffleNode.id + ")");
            __currentOutgoingShuffle.cancel();
        }

        __lastShuffleNode = destinationNodePointer;
        __currentOutgoingShuffle = createOutgoingShuffle(
            shuffleStateFactory.createOutgoingShuffleState(__localNode, destinationNodePointer, shuffleSet),
            destinationNodePointer);

        return __currentOutgoingShuffle;
    };

    function createOutgoingShuffle(outgoingState, destinationNodePointer) {
        return rtc.openChannel(CYCLON_SHUFFLE_CHANNEL_TYPE, destinationNodePointer)
            .then(outgoingState.storeChannel)
            .then(outgoingState.sendShuffleRequest)
            .then(outgoingState.processShuffleResponse)
            .then(outgoingState.sendResponseAcknowledgement)
            .cancellable()
            .catch(Promise.CancellationError, function (e) {
                outgoingState.cancel();
                throw e;
            })
            .finally(function() {
                outgoingState.close();
                outgoingState = null;
            });
    }

    this.createNewPointer = function(metaData) {
        return rtc.createNewPointer(metaData);
    };

    this.getLocalId = function() {
        return rtc.getLocalId();
    };

    /**
     * Handle an incoming shuffle
     */
    this.handleIncomingShuffle = function (channel) {
        var remotePeer = channel.getRemotePeer();

        var incomingShuffleState = shuffleStateFactory.createIncomingShuffleState(__localNode, remotePeer);

        return incomingShuffleState.processShuffleRequest(channel)
            .then(incomingShuffleState.waitForResponseAcknowledgement)
            .then(function() {
                __localNode.emit("shuffleCompleted", "incoming", remotePeer);
            })
            .catch(Promise.TimeoutError, function (e) {
                logger.warn(e.message);
                __localNode.emit("shuffleTimeout", "incoming", remotePeer);
            })
            .catch(function (error) {
                logger.error("An unknown error occurred on an incoming shuffle", error);
                __localNode.emit("shuffleError", "incoming", remotePeer, "unknown");
            })
            .finally(function () {
                incomingShuffleState.close();
                channel.close();
            });
    };
}

module.exports = WebRTCComms;
