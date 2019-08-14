'use strict';

var Promise = require("bluebird");
var Utils = require("cyclon.p2p-common");

function OutgoingShuffleState(fromNode, destinationNodePointer, shuffleSet, asyncExecService, logger) {

    Utils.checkArguments(arguments, 5);

    var SHUFFLE_RESPONSE_TIMEOUT_MS = 30000;
    var lastOutstandingPromise = null;
    var channelClosingTimeoutId = null;
    var sendingRequestTimeoutId = null;
    var channel = null;

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

        lastOutstandingPromise = new Promise(function (resolve) {

            /**
             * We need to delay the sending of the request because the messages seem to go missing when sent
             * immediately on the RTCDataChannel.onopen event, and even seem a bit flaky when only a short
             * delay (e.g. 1ms) is implemented. Not sure how long we need to wait, but 1 second seems
             * to reduce the number of lost messages to a negligible level.
             */
            sendingRequestTimeoutId = asyncExecService.setTimeout(function () {
                channel.send("shuffleRequest", shuffleSet);
                logger.debug("Sent shuffle request to " + destinationNodePointer.id + " : " + JSON.stringify(shuffleSet));
                resolve();
            }, 1000);
        })
        .cancellable()
        .catch(Promise.CancellationError, function (e) {
            asyncExecService.clearTimeout(sendingRequestTimeoutId);
            throw e;
        });

        return lastOutstandingPromise;
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
