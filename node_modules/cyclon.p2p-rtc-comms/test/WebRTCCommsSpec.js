'use strict';

var Promise = require("bluebird");
var WebRTCComms = require("../lib/WebRTCComms");
var ClientMocks = require("./ClientMocks");
var events = require("events");

describe("The WebRTC Comms layer", function () {

    var WAIT_FOR_CHANNEL_TO_OPEN_RESULT = "WAIT_FOR_CHANNEL_TO_OPEN_RESULT",
        SEND_SHUFFLE_REQUEST_RESULT = "SEND_SHUFFLE_REQUEST_RESULT",
        PROCESS_SHUFFLE_RESPONSE_RESULT = "PROCESS_SHUFFLE_RESULT_RESULT",
        SEND_RESPONSE_ACKNOWLEDGEMENT_RESULT = "SEND_RESPONSE_ACKNOWLEDGEMENT_RESULT",
        PROCESS_SHUFFLE_REQUEST_RESULT = "PROCESS_SHUFFLE_REQUEST_RESULT",
        WAIT_FOR_RESPONSE_ACKNOWLEDGEMENT_RESULT = "WAIT_FOR_RESPONSE_ACKNOWLEDGEMENT_RESULT",
        CREATE_NEW_POINTER_RESULT = "CREATE_NEW+POINTER_RESULT",
        LOCAL_ID = "LOCAL_ID";

    var CYCLON_SHUFFLE_CHANNEL_TYPE = "cyclonShuffle";
    var REMOTE_POINTER = "REMOTE_POINTER";
    var INCOMING_ERROR = "INCOMING_ERROR";

    var comms,
        channel,
        rtc,
        shuffleStateFactory,
        outgoingShuffleState,
        localCyclonNode,
        destinationNodePointer,
        shuffleSet,
        incomingShuffleState,
        logger,
        successCallback,
        failureCallback,
        metadataProviders;

    beforeEach(function () {
        successCallback = ClientMocks.createSuccessCallback();
        failureCallback = ClientMocks.createFailureCallback();

        // Create mocks
        rtc = ClientMocks.mockRtc();
        channel = ClientMocks.mockChannel();
        shuffleStateFactory = ClientMocks.mockShuffleStateFactory();
        localCyclonNode = ClientMocks.mockCyclonNode();
        outgoingShuffleState = createSucceedingOutgoingShuffleState();
        incomingShuffleState = createSucceedingIncomingShuffleState();
        logger = ClientMocks.mockLoggingService();
        metadataProviders = {something : function() {return ""}};

        destinationNodePointer = createCacheEntry("destinationNodePointer", 12);
        shuffleSet = [createCacheEntry("a", 456), createCacheEntry("b", 123), createCacheEntry("c", 222)];

        //
        // Mock behaviour
        //
        rtc.openChannel.and.returnValue(Promise.resolve(WAIT_FOR_CHANNEL_TO_OPEN_RESULT));
        rtc.createNewPointer.and.returnValue(CREATE_NEW_POINTER_RESULT);
        rtc.getLocalId.and.returnValue(LOCAL_ID);
        channel.getRemotePeer.and.returnValue(destinationNodePointer);
        shuffleStateFactory.createOutgoingShuffleState.and.returnValue(outgoingShuffleState);
        shuffleStateFactory.createIncomingShuffleState.and.returnValue(incomingShuffleState);

        comms = new WebRTCComms(rtc, shuffleStateFactory, logger);
    });

    describe("when initializing", function () {

        beforeEach(function() {
            comms.initialize(localCyclonNode, metadataProviders);
        });

        it("should initialize the RTC layer", function () {
            expect(rtc.connect).toHaveBeenCalledWith(metadataProviders, ["CyclonWebRTC"]);
        });

        it("should add a listener for incoming shuffle channels", function() {
            expect(rtc.onChannel).toHaveBeenCalledWith("cyclonShuffle", comms.handleIncomingShuffle);
        });
    });

    describe("when cyclon shuffle errors occur on the RTC service", function() {

        beforeEach(function() {
            rtc = new events.EventEmitter();
            rtc.onChannel = jasmine.createSpy();
            rtc.connect = jasmine.createSpy();
            comms = new WebRTCComms(rtc, shuffleStateFactory, logger);
            comms.initialize(localCyclonNode, metadataProviders);
        });

        describe("on incomingTimeout", function() {

            it("emits an incoming shuffle timeout event for cyclon channels", function() {
                rtc.emit("incomingTimeout", CYCLON_SHUFFLE_CHANNEL_TYPE, REMOTE_POINTER);
                expect(localCyclonNode.emit).toHaveBeenCalledWith("shuffleTimeout", "incoming", REMOTE_POINTER);
            });

            it("emits no incoming shuffle timeout event for non-cyclon channels", function() {
                rtc.emit("incomingTimeout", "otherChannelType", REMOTE_POINTER);
                expect(localCyclonNode.emit).not.toHaveBeenCalled();
            });
        });

        describe("on incomingError", function() {

            it("emits an incoming shuffleError event for cyclon channels", function() {
                rtc.emit("incomingError", CYCLON_SHUFFLE_CHANNEL_TYPE, REMOTE_POINTER, INCOMING_ERROR);
                expect(localCyclonNode.emit).toHaveBeenCalledWith("shuffleError", "incoming", REMOTE_POINTER, INCOMING_ERROR);
            });

            it("emits no incoming shuffleError event for non-cyclon channels", function() {
                rtc.emit("incomingError", "otherChannelType", REMOTE_POINTER, INCOMING_ERROR);
                expect(localCyclonNode.emit).not.toHaveBeenCalled();
            });
        });

        describe("on offerReceived", function() {

            it("emits an incoming shuffleStarted event for cyclon channels", function() {
                rtc.emit("offerReceived", CYCLON_SHUFFLE_CHANNEL_TYPE, REMOTE_POINTER);
                expect(localCyclonNode.emit).toHaveBeenCalledWith("shuffleStarted", "incoming", REMOTE_POINTER);
            });

            it("emits no incoming shuffleStarted event for non-cyclon channels", function() {
                rtc.emit("offerReceived", "otherChannelType", REMOTE_POINTER);
                expect(localCyclonNode.emit).not.toHaveBeenCalled();
            });
        });
    });

    describe("before sending a shuffle request", function () {

        beforeEach(function () {
            comms.initialize(localCyclonNode, metadataProviders);
            comms.sendShuffleRequest(destinationNodePointer, shuffleSet);
        });

        it("should create a new outgoing shuffle state", function () {
            expect(shuffleStateFactory.createOutgoingShuffleState).toHaveBeenCalledWith(localCyclonNode, destinationNodePointer, shuffleSet);
        });
    });

    describe("when sending a shuffle request", function () {

        beforeEach(function() {
            comms.initialize(localCyclonNode, metadataProviders);
        });

        describe("and everything succeeds", function () {
            it("should perform the peer exchange then cleanup resources when the offer is created successfully", function (done) {
                comms.sendShuffleRequest(destinationNodePointer, shuffleSet)
                    .then(function(result) {
                        expect(result).toBe(SEND_RESPONSE_ACKNOWLEDGEMENT_RESULT);

                        // The exchange occurred
                        expect(rtc.openChannel).toHaveBeenCalledWith("cyclonShuffle", destinationNodePointer);
                        expect(outgoingShuffleState.sendShuffleRequest).toHaveBeenCalledWith(WAIT_FOR_CHANNEL_TO_OPEN_RESULT);
                        expect(outgoingShuffleState.processShuffleResponse).toHaveBeenCalledWith(SEND_SHUFFLE_REQUEST_RESULT);
                        expect(outgoingShuffleState.sendResponseAcknowledgement).toHaveBeenCalledWith(PROCESS_SHUFFLE_RESPONSE_RESULT);

                        // Clean up occurred
                        expect(outgoingShuffleState.close).toHaveBeenCalled();

                        done();
                    });
            });
        });

        it("should not send the request when the channel does not open successfully", function (done) {

            rtc.openChannel.and.returnValue(Promise.reject(new Error("bad")));
            comms.sendShuffleRequest(localCyclonNode, destinationNodePointer, shuffleSet)
                .catch(function() {
                    expect(outgoingShuffleState.sendShuffleRequest).not.toHaveBeenCalled();
                    // Clean up occurred
                    expect(outgoingShuffleState.close).toHaveBeenCalled();
                    done();
                });
        });

        it("should cause the resources from the previous shuffle to be cleaned up when the next one starts and it has not completed successfully", function (done) {

            var firstOutgoingState = createSucceedingOutgoingShuffleState("firstOutgoingState");
            var secondOutgoingState = createSucceedingOutgoingShuffleState("secondOutgoingState");
            var secondFailureCallback = jasmine.createSpy('secondFailureCallback');

            // Start the first shuffle (it gets stuck at waiting for the channel to open)
            var firstWaitForChannelToOpenPromise = new Promise(function () {
            }).cancellable();

            rtc.openChannel.and.returnValue(firstWaitForChannelToOpenPromise);   // it gets held up at waiting for the channel to open
            firstOutgoingState.cancel.and.callFake(function () {
                firstWaitForChannelToOpenPromise.cancel();
            });

            shuffleStateFactory.createOutgoingShuffleState.and.returnValue(firstOutgoingState);
            comms.sendShuffleRequest(localCyclonNode, destinationNodePointer, shuffleSet)
                .catch(Promise.CancellationError, function() {
                    expect(firstOutgoingState.sendShuffleRequest).not.toHaveBeenCalled();
                    expect(firstOutgoingState.cancel).toHaveBeenCalled();
                    expect(firstOutgoingState.close).toHaveBeenCalled();

                    setTimeout(function() {
                        expect(secondFailureCallback).not.toHaveBeenCalled();
                        done();
                    }, 100);
                });

            setTimeout(function() {
                // Start the second shuffle (also gets stuck waiting for the channel to open)
                var secondWaitForChannelToOpenPromise = new Promise(function () {
                }).cancellable();
                rtc.openChannel.and.returnValue(secondWaitForChannelToOpenPromise);   // it gets held up at waiting for the channel to open
                secondOutgoingState.cancel.and.callFake(function () {
                    secondWaitForChannelToOpenPromise.cancel();
                });
                shuffleStateFactory.createOutgoingShuffleState.and.returnValue(secondOutgoingState);
                comms.sendShuffleRequest(localCyclonNode, destinationNodePointer, shuffleSet)
                    .catch(secondFailureCallback);
            }, 10);
        });
    });

    describe("when creating a new pointer", function() {

        it("delegates to the RTC service", function() {
            expect(comms.createNewPointer()).toBe(CREATE_NEW_POINTER_RESULT);
        });
    });

    describe("when getting the local ID", function() {

        it("delegates to the RTC service", function() {
            expect(comms.getLocalId()).toBe(LOCAL_ID);
        });
    });

    describe("when handling an incoming shuffle", function () {

        beforeEach(function() {
            comms.initialize(localCyclonNode, metadataProviders);
        });

        describe("before processing the shuffle request", function () {
            beforeEach(function () {
                comms.handleIncomingShuffle(channel).then(successCallback).catch(failureCallback);
            });

            it("should create a new incoming shuffle state", function () {
                expect(shuffleStateFactory.createIncomingShuffleState).toHaveBeenCalledWith(localCyclonNode, destinationNodePointer);
            });
        });

        describe("and everything succeeds", function () {

            var incomingShufflePromise;

            beforeEach(function () {
                incomingShufflePromise = comms.handleIncomingShuffle(channel);
            });

            it("should perform the exchange with the source peer then clean up when an answer is created successfully", function (done) {

                incomingShufflePromise.then(function () {
                    expect(incomingShuffleState.processShuffleRequest).toHaveBeenCalledWith(channel);
                    expect(incomingShuffleState.waitForResponseAcknowledgement).toHaveBeenCalledWith(PROCESS_SHUFFLE_REQUEST_RESULT);

                    // and cleanup
                    expect(incomingShuffleState.close).toHaveBeenCalled();
                    done();
                });
            });
        });

        describe("and a timeout occurs waiting for the shuffle request", function () {

            var incomingShufflePromise;

            beforeEach(function () {
                incomingShuffleState.processShuffleRequest.and.returnValue(Promise.reject(new Promise.TimeoutError()));
                incomingShufflePromise = comms.handleIncomingShuffle(channel);
            });

            it("should clean up it state and not wait for the acknowledgement", function (done) {
                incomingShufflePromise.then(function() {
                    expect(incomingShuffleState.waitForResponseAcknowledgement).not.toHaveBeenCalled();

                    // Close should still be called
                    expect(incomingShuffleState.close).toHaveBeenCalled();
                    done();
                });
            });
        });
    });

    function createSucceedingOutgoingShuffleState(name) {
        var outgoingShuffleState = ClientMocks.mockOutgoingShuffleState(name);
        outgoingShuffleState.sendShuffleRequest.and.returnValue(Promise.resolve(SEND_SHUFFLE_REQUEST_RESULT));
        outgoingShuffleState.processShuffleResponse.and.returnValue(Promise.resolve(PROCESS_SHUFFLE_RESPONSE_RESULT));
        outgoingShuffleState.sendResponseAcknowledgement.and.returnValue(Promise.resolve(SEND_RESPONSE_ACKNOWLEDGEMENT_RESULT));
        return outgoingShuffleState;
    }

    function createSucceedingIncomingShuffleState() {
        var incomingShuffleState = ClientMocks.mockIncomingShuffleState();
        incomingShuffleState.processShuffleRequest.and.returnValue(Promise.resolve(PROCESS_SHUFFLE_REQUEST_RESULT));
        incomingShuffleState.waitForResponseAcknowledgement.and.returnValue(Promise.resolve(WAIT_FOR_RESPONSE_ACKNOWLEDGEMENT_RESULT));
        return incomingShuffleState;
    }

    /**
     * Create a cache entry
     *
     * @param id
     * @param age
     * @returns {{id: *, age: *}}
     */
    function createCacheEntry(id, age) {
        return {
            id: id,
            age: age
        };
    }
});
