'use strict';

const Utils = require("cyclon.p2p-common");
const Promise = require("bluebird");

function IncomingShuffleState(localNode, sourcePointer, asyncExecService, logger) {

    Utils.checkArguments(arguments, 4);

    const SHUFFLE_REQUEST_TIMEOUT_MS = 15000;
    const SHUFFLE_RESPONSE_ACKNOWLEDGEMENT_TIMEOUT_MS = 15000;
    let lastOutstandingPromise = null;

    /**
     * Receive an inbound shuffle
     *
     * @param channel
     */
    this.processShuffleRequest = function (channel) {

        lastOutstandingPromise = channel.receive("shuffleRequest", SHUFFLE_REQUEST_TIMEOUT_MS)
            .then(function (shuffleRequestMessage) {
                logger.debug("Received shuffle request from " + sourcePointer.id + " : " + JSON.stringify(shuffleRequestMessage));
                const response = localNode.handleShuffleRequest(sourcePointer, shuffleRequestMessage);
                channel.send("shuffleResponse", response);
                logger.debug("Sent shuffle response to " + sourcePointer.id);
                return channel;
            }).cancellable();

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