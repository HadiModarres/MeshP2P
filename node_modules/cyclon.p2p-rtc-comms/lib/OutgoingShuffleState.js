'use strict';

const Promise = require("bluebird");
const Utils = require("cyclon.p2p-common");

function OutgoingShuffleState(fromNode, destinationNodePointer, shuffleSet, asyncExecService, logger) {

    Utils.checkArguments(arguments, 5);

    const SHUFFLE_RESPONSE_TIMEOUT_MS = 30000;
    let lastOutstandingPromise = null;
    let channelClosingTimeoutId = null;
    let sendingRequestTimeoutId = null;
    let channel = null;

    /**
     * Store the channel for later use
     */
    this.storeChannel = function(theChannel) {
        channel = theChannel;
    };

    /**
     * Send a shuffle request
     *
     * @returns {Promise}
     */
    this.sendShuffleRequest = function () {
        checkThatChannelIsSet();
        channel.send("shuffleRequest", shuffleSet);
        logger.debug("Sent shuffle request to " + destinationNodePointer.id + " : " + JSON.stringify(shuffleSet));
    };

    /**
     * Receive and process a shuffle response
     */
    this.processShuffleResponse = function () {
        checkThatChannelIsSet();

        lastOutstandingPromise = channel.receive("shuffleResponse", SHUFFLE_RESPONSE_TIMEOUT_MS)
            .then(function (shuffleResponseMessage) {
                logger.debug("Received shuffle response from " + destinationNodePointer.id + " : " + JSON.stringify(shuffleResponseMessage));
                fromNode.handleShuffleResponse(destinationNodePointer, shuffleResponseMessage);
            });

        return lastOutstandingPromise;
    };

    /**
     * Send an acknowledgement we received the response
     */
    this.sendResponseAcknowledgement = function () {
        checkThatChannelIsSet();

        lastOutstandingPromise = new Promise(function (resolve) {
            channel.send("shuffleResponseAcknowledgement");

            //
            // Delay closing connection to allow acknowledgement to be sent (?)
            //
            channelClosingTimeoutId = asyncExecService.setTimeout(function () {
                resolve();
            }, 3000);
        })
        .cancellable()
        .catch(Promise.CancellationError, function (e) {
            asyncExecService.clearTimeout(channelClosingTimeoutId);
            throw e;
        });

        return lastOutstandingPromise;
    };

    /**
     * Cleanup any resources
     */
    this.close = function () {
        if(channel !== null) {
            channel.close();
        }

        asyncExecService.clearTimeout(sendingRequestTimeoutId);
        asyncExecService.clearTimeout(channelClosingTimeoutId);
        lastOutstandingPromise = null;
        fromNode = null;
        destinationNodePointer = null;
        shuffleSet = null;
    };

    /**
     * Cancel any currently outstanding promises
     */
    this.cancel = function () {
        if (lastOutstandingPromise !== null && lastOutstandingPromise.isPending()) {
            lastOutstandingPromise.cancel();
        }
    };

    function checkThatChannelIsSet() {
        if(channel === null) {
            throw new Error("Channel must have been stored first!");
        }
    }
}


module.exports = OutgoingShuffleState;
