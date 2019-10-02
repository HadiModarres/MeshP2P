'use strict';

const Promise = require("bluebird");
const OutgoingShuffleState = require("../lib/OutgoingShuffleState");
const ClientMocks = require("./ClientMocks");

describe("The Outgoing ShuffleState", function () {

    const TIMEOUT_ID = 12345;
    const SHUFFLE_SET = ["a", "b", "c"];
    const DESTINATION_NODE_POINTER = {
        id: "OTHER_NODE_ID"
    };
    const RESPONSE_PAYLOAD = "RESPONSE_PAYLOAD";

    let localCyclonNode,
        asyncExecService,
        loggingService,
        channel;

    let successCallback, failureCallback;

    let outgoingShuffleState;

    beforeEach(function () {
        successCallback = ClientMocks.createSuccessCallback();
        failureCallback = ClientMocks.createFailureCallback();

        localCyclonNode = ClientMocks.mockCyclonNode();
        asyncExecService = ClientMocks.mockAsyncExecService();
        loggingService = ClientMocks.mockLoggingService();
        channel = ClientMocks.mockChannel();

        //
        // Mock behaviours
        //
        asyncExecService.setTimeout.and.returnValue(TIMEOUT_ID);

        outgoingShuffleState = new OutgoingShuffleState(localCyclonNode, DESTINATION_NODE_POINTER, SHUFFLE_SET, asyncExecService, loggingService);
    });

    describe("after channel establishment", function() {

        beforeEach(function() {
            outgoingShuffleState.storeChannel(channel);
        });

        describe("when sending a shuffle request", function () {

            beforeEach(function () {
                outgoingShuffleState.sendShuffleRequest();
            });

            it("should send the message over the data channel", function () {
                expect(channel.send).toHaveBeenCalledWith("shuffleRequest", SHUFFLE_SET);
            });
        });

        describe("when processing a shuffle response", function () {

            describe("and a response is not received before the timeout", function () {

                beforeEach(function (done) {
                    channel.receive.and.returnValue(Promise.reject(new Promise.TimeoutError()));
                    outgoingShuffleState.processShuffleResponse()
                        .catch(Promise.TimeoutError, done);
                });

                it("should not attempt to handle a response", function () {
                    expect(localCyclonNode.handleShuffleResponse).not.toHaveBeenCalled();
                });
            });

            describe("and a response is received before timeout", function () {

                beforeEach(function (done) {
                    channel.receive.and.returnValue(Promise.resolve(RESPONSE_PAYLOAD));
                    outgoingShuffleState.processShuffleResponse().then(done);
                });

                it("should delegate to the local node to handle the response", function () {
                    expect(localCyclonNode.handleShuffleResponse).toHaveBeenCalledWith(DESTINATION_NODE_POINTER, RESPONSE_PAYLOAD);
                });
            });
        });

        describe("when sending a response acknowledgement", function () {

            describe("and everything succeeds", function () {
                beforeEach(function (done) {
                    asyncExecService.setTimeout.and.callFake(function(callback) {
                        callback();
                    });
                    outgoingShuffleState.sendResponseAcknowledgement().then(done);
                });

                it("sends the acknowledgement over the channel", function () {
                    expect(channel.send).toHaveBeenCalledWith("shuffleResponseAcknowledgement");
                });
            });

            describe("and cancel is called before the resolve happens", function() {
                beforeEach(function(done) {
                    outgoingShuffleState.sendResponseAcknowledgement()
                        .catch(Promise.CancellationError, done)
                        .cancel();
                });

                it("clears the resolve timeout", function() {
                    expect(asyncExecService.clearTimeout).toHaveBeenCalledWith(TIMEOUT_ID);
                });
            });
        });

        describe("when closing", function() {

            let channelClosingTimeoutId = "channelClosingTimeoutId";

            beforeEach(function() {
                asyncExecService.setTimeout.and.returnValue(channelClosingTimeoutId);
                outgoingShuffleState.sendResponseAcknowledgement();

                outgoingShuffleState.close();
            });

            it("clears the channel closing timeout", function() {
                expect(asyncExecService.clearTimeout).toHaveBeenCalledWith(channelClosingTimeoutId);
            });
        });

        describe("when cancelling", function() {

            let lastOutstandingPromise;

            beforeEach(function() {
                lastOutstandingPromise = ClientMocks.mockPromise();
                channel.receive.and.returnValue(lastOutstandingPromise);
                outgoingShuffleState.processShuffleResponse();
            });

            describe("and the last outstanding promise is pending", function() {
                beforeEach(function() {
                    lastOutstandingPromise.isPending.and.returnValue(true);
                    outgoingShuffleState.cancel();
                });

                it("cancels the latest outstanding promise", function() {
                    expect(lastOutstandingPromise.cancel).toHaveBeenCalled();
                });
            });

            describe("and the last outstanding promise is not pending", function() {
                beforeEach(function() {
                    lastOutstandingPromise.isPending.and.returnValue(false);
                    outgoingShuffleState.cancel();
                });

                it("doesn't cancel the latest outstanding promise", function() {
                    expect(lastOutstandingPromise.cancel).not.toHaveBeenCalled();
                });
            });
        });
    });
});
