var Promise = require("bluebird");
var Utils = require("cyclon.p2p-common");

function Channel(remotePeer, correlationId, peerConnection, signallingService, logger, channelStateTimeoutMs) {

    Utils.checkArguments(arguments, 6);

    var channelType = null;
    var rtcDataChannel = null;
    var messages = null;
    var self = this;
    var resolvedCorrelationId = correlationId;
    var lastOutstandingPromise = null;
    var channelEstablishedEventEmitter = new Utils.BufferingEventEmitter();

    peerConnection.on("channelCreated", function (channel) {
        rtcDataChannel = channel;
        addMessageListener();
        channelEstablishedEventEmitter.emit("channelEstablished");
    });

    function remoteCandidatesEventId() {
        return "candidates-" + remotePeer.id + "-" + resolvedCorrelationId;
    }

    function correlationIdIsResolved() {
        return typeof (resolvedCorrelationId) == "number";
    }

    function verifyCorrelationId() {
        if (!correlationIdIsResolved()) {
            throw new Error("Correlation ID is not resolved");
        }
    }

    this.startListeningForRemoteIceCandidates = function () {
        verifyCorrelationId();

        signallingService.on(remoteCandidatesEventId(), function (message) {
            try {
                peerConnection.processRemoteIceCandidates(message.iceCandidates);
            } catch (error) {
                logger.error("Error handling peer candidates", error);
            }
        });
    };

    this.getRemotePeer = function () {
        return remotePeer;
    };

    this.createOffer = function (type) {
        channelType = type;
        return peerConnection.createOffer();
    };

    this.createAnswer = function (remoteDescription) {
        return peerConnection.createAnswer(remoteDescription);
    };

    this.sendAnswer = function () {
        verifyCorrelationId();

        lastOutstandingPromise = signallingService.sendAnswer(
            remotePeer,
            resolvedCorrelationId,
            peerConnection.getLocalDescription(),
            peerConnection.getLocalIceCandidates());
        return lastOutstandingPromise;
    };

    this.waitForChannelEstablishment = function () {
        lastOutstandingPromise = new Promise(function (resolve) {
            channelEstablishedEventEmitter.once('channelEstablished', function () {
                resolve(self);
            });
        }).timeout(channelStateTimeoutMs, "Data channel establishment timeout exceeded");
        return lastOutstandingPromise;
    };

    this.startSendingIceCandidates = function () {
        verifyCorrelationId();

        peerConnection.on("iceCandidates", function (candidates) {
            signallingService.sendIceCandidates(remotePeer, resolvedCorrelationId, candidates).catch(function (error) {
                logger.warn("An error occurred sending ICE candidates to " + remotePeer.id, error);
            });
        });
        peerConnection.startEmittingIceCandidates();
    };

    this.stopSendingIceCandidates = function () {
        peerConnection.removeAllListeners("iceCandidates");
        return self;
    };

    this.sendOffer = function () {
        lastOutstandingPromise = signallingService.sendOffer(
            remotePeer,
            channelType,
            peerConnection.getLocalDescription())
            .then(function (correlationId) {
                resolvedCorrelationId = correlationId;
            });
        return lastOutstandingPromise;
    };

    this.waitForAnswer = function () {
        lastOutstandingPromise = signallingService.waitForAnswer(resolvedCorrelationId);
        return lastOutstandingPromise;
    };

    this.handleAnswer = function (answerMessage) {
        return peerConnection.handleAnswer(answerMessage);
    };

    this.waitForChannelToOpen = function () {
        return peerConnection.waitForChannelToOpen();
    };

    function addMessageListener() {
        messages = new Utils.BufferingEventEmitter();
        rtcDataChannel.onmessage = function (messageEvent) {
            const parsedMessage = parseMessage(messageEvent.data);
            messages.emit(parsedMessage.type, parsedMessage.payload);
        };
    }

    function parseMessage(message) {
        try {
            return JSON.parse(message);
        } catch (e) {
            throw new Error("Bad message received from " + remotePeer.id + " : '" + message + "'");
        }
    }

    /**
     * Send a message
     *
     * @param type the type of message to send
     * @param message The message to send
     */
    this.send = function (type, message) {
        if (rtcDataChannel === null) {
            throw new Error("Data channel has not yet been established!");
        }
        var channelState = String(rtcDataChannel.readyState);
        if ("open" !== channelState) {
            throw new Error("Data channel must be in 'open' state to send messages (actual state: " + channelState + ")");
        }
        rtcDataChannel.send(JSON.stringify({
            type: type,
            payload: message || {}
        }));
    };

    /**
     * Wait an amount of time for a particular type of message on a data channel
     *
     * @param messageType
     * @param timeoutInMilliseconds
     */
    this.receive = function (messageType, timeoutInMilliseconds) {
        var handlerFunction = null;

        lastOutstandingPromise = new Promise(function (resolve, reject) {

            if (rtcDataChannel === null || "open" !== String(rtcDataChannel.readyState)) {
                reject(new Error("Data channel must be in 'open' state to receive " + messageType + " message"));
            }

            //
            // Add the handler
            //
            handlerFunction = function (message) {
                resolve(message);
            };

            messages.once(messageType, handlerFunction);
        })
        .timeout(timeoutInMilliseconds, "Timeout reached waiting for '" + messageType + "' message (from " + remotePeer.id + ")")
        .catch(Promise.TimeoutError, Promise.CancellationError, function (e) {
            //
            // If cancel or timeout occurs, remove the message listener
            //
            messages.removeListener(messageType, handlerFunction);
            throw e;
        });

        return lastOutstandingPromise;
    };

    this.cancel = function () {
        if (lastOutstandingPromise !== null && lastOutstandingPromise.isPending()) {
            lastOutstandingPromise.cancel();
        }
    };

    this.close = function () {
        if (signallingService !== null) {
            if (correlationIdIsResolved()) {
                signallingService.removeAllListeners(remoteCandidatesEventId());
            }
            signallingService = null;
        }

        if (messages !== null) {
            messages.removeAllListeners();
            messages = null;
        }

        if (peerConnection) {
            peerConnection.removeAllListeners();
            peerConnection.close();
            peerConnection = null;
        }

        rtcDataChannel = null;
    };
}

module.exports = Channel;
