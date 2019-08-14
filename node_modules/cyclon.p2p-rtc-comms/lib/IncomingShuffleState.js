'use strict';

var Utils = require("cyclon.p2p-common");
var Promise = require("bluebird");

function IncomingShuffleState(localNode, sourcePointer, asyncExecService, logger) {

    Utils.checkArguments(arguments, 4);

    var SHUFFLE_REQUEST_TIMEOUT_MS = 15000;
    var SHUFFLE_RESPONSE_ACKNOWLEDGEMENT_TIMEOUT_MS = 15000;
    var lastOutstandingPromise = null;
    var responseSendingTimeoutId = null;

    /**
     * Receive an inbound shuffle
     *
     * @param channel
     */
    this.processShuffleRequest = function (channel) {

        lastOutstandingPromise = channel.receive("shuffleRequest", SHUFFLE_REQUEST_TIMEOUT_MS)
            .then(function (shuffleRequestMessage) {
                return new Promise(function (resolve) {
                    logger.debug("Received shuffle request from " + sourcePointer.id + " : " + JSON.stringify(shuffleRequestMessage));
                    var response = localNode.handleShuffleRequest(sourcePointer, shuffleRequestMessage);

                    //
                    // Not sure why but responses seem to send more reliably with a small delay
                    // between receiving the request and sending the response. Without this
                    // the sender sometimes reports they never got the response!?
                    //
                    responseSendingTimeoutId = asyncExecService.setTimeout(function () {
                        channel.send("shuffleResponse", response);
                        logger.debug("Sent shuffle response to " + sourcePointer.id);
                        resolve(channel);
                    }, 10);
                })
            }).cancellable().catch(Promise.CancellationError, function (e) {
                asyncExecService.clearTimeout(responseSendingTimeoutId);
                throw e;
            });

        return lastOutstandingPromise;
    };

    /**
     * Wait for an acknowledgment that our shuffle response
     * was received (to prevent prematurely closing the data channel)
     */
    this.waitForResponseAcknowledgement = function (channel) {

        lastOutstandingPromise = channel.receive("shuffleResponseAcknowledgement", SHUFFLE_RESPONSE_ACKNOWLEDGEMENT_TIMEOUT_MS)
            .catch(Promise.TimeoutError, function () {
                logger.warn("Timeout occurred waiting for response acknowledgement, continuing");
            })
            .then(Promise.resolve(channel));

        return lastOutstandingPromise;
    };

    /**
     * Cleanup any resources
     */
    this.close = function () {
        asyncExecService.clearTimeout(responseSendingTimeoutId);
        lastOutstandingPromise = null;
        localNode = null;
        sourcePointer = null;
    };

    /**
     * Cancel any currently outstanding promises
     */
    this.cancel = function () {

        if (lastOutstandingPromise !== null && lastOutstandingPromise.isPending()) {
            lastOutstandingPromise.cancel();
        }
    }
}

module.exports = IncomingShuffleState;