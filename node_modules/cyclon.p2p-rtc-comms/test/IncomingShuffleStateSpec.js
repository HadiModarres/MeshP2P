'use strict';

var Promise = require("bluebird");
var IncomingShuffleState = require("../lib/IncomingShuffleState.js");
var ClientMocks = require("./ClientMocks");

describe("The Incoming ShuffleState", function () {

    var SOURCE_POINTER = {id: "SOURCE_ID", age: 10};

    var LOCAL_SESSION_DESCRIPTION = "LOCAL_SESSION_DESCRIPTION";
    var REQUEST_PAYLOAD = "REQUEST_PAYLOAD";
    var RESPONSE_PAYLOAD = "RESPONSE_PAYLOAD";
    var TIMEOUT_ID = "TIMEOUT_ID";

    var localCyclonNode,
        asyncExecService,
        loggingService,
        successCallback,
        failureCallback,
        channel;

    var incomingShuffleState;

    beforeEach(function () {
        successCallback = ClientMocks.createSuccessCallback();
        failureCallback = ClientMocks.createFailureCallback();

        localCyclonNode = ClientMocks.mockCyclonNode();
        asyncExecService = ClientMocks.mockAsyncExecService();
        loggingService = ClientMocks.mockLoggingService();
        channel = ClientMocks.mockChannel();

        //
        // Mock behaviour
        //
        localCyclonNode.handleShuffleRequest.and.returnValue(RESPONSE_PAYLOAD);

        incomingShuffleState = new IncomingShuffleState(localCyclonNode, SOURCE_POINTER, asyncExecService, loggingService);
    });

    describe("when processing a shuffle request", function () {

        describe("and everything succeeds", function() {
            beforeEach(function () {
                channel.receive.and.returnValue(Promise.resolve(REQUEST_PAYLOAD));
                asyncExecService.setTimeout.and.callFake(function (callback) {
                    callback();
                });
            });

            it("delegates to the node to handle the request, then sends the response via the data channel", function (done) {
                incomingShuffleState.processShuffleRequest(channel)
                    .then(function(result) {
                        expect(localCyclonNode.handleShuffleRequest).toHaveBeenCalledWith(SOURCE_POINTER, REQUEST_PAYLOAD);
                        expect(channel.send).toHaveBeenCalledWith("shuffleResponse", RESPONSE_PAYLOAD);
                        expect(result).toBe(channel);
                        done();
                    });
            });
        });

        describe("and a timeout occurs waiting for the request", function(){
            var timeoutError;

            beforeEach(function(done) {
                timeoutError = new Promise.TimeoutError();
                channel.receive.and.returnValue(Promise.reject(timeoutError));
                incomingShuffleState.processShuffleRequest(channel)
                    .catch(Promise.TimeoutError, done);
            });

            it("does not attempt to handle the request", function() {
                expect(localCyclonNode.handleShuffleRequest).not.toHaveBeenCalled();
            });
        });

        describe("and cancel is called before the response is sent", function() {

            beforeEach(function(done) {
                asyncExecService.setTimeout.and.returnValue(TIMEOUT_ID);
                channel.receive.and.returnValue(Promise.resolve({payload: REQUEST_PAYLOAD}));
                incomingShuffleState.processShuffleRequest(channel)
                    .catch(Promise.CancellationError, done).cancel();
            });

            it("cancels the response sending", function() {
                expect(asyncExecService.clearTimeout).toHaveBeenCalledWith(TIMEOUT_ID);
            });
        });

        describe("and cancel is called before the request arrives", function() {

            var cancellationError;

            beforeEach(function(done) {
                cancellationError = new Promise.CancellationError();
                channel.receive.and.returnValue(Promise.reject(cancellationError));
                incomingShuffleState.processShuffleRequest(channel)
                    .catch(Promise.CancellationError, done).cancel();
            });

            it("doesn't call handleShuffleRequest", function() {
                expect(localCyclonNode.handleShuffleRequest).not.toHaveBeenCalled();
            });
        });
    });

    describe("when waiting for the response acknowledgement", function() {

        describe("and everything succeeds", function() {
            beforeEach(function(done) {
                channel.receive.and.returnValue(Promise.resolve(null));
                incomingShuffleState.waitForResponseAcknowledgement(channel)
                    .then(done);
            });

            it("delegates to the messaging utilities to receive the acknowledgement", function() {
                expect(channel.receive).toHaveBeenCalledWith("shuffleResponseAcknowledgement", jasmine.any(Number));
            });
        });

        describe("and a timeout occurs", function() {

            it("logs a warning and resolves", function(done) {
                channel.receive.and.returnValue(Promise.reject(new Promise.TimeoutError()));
                incomingShuffleState.waitForResponseAcknowledgement(channel)
                    .then(function() {
                        expect(loggingService.warn).toHaveBeenCalled();
                        done();
                    });
            });
        });

        describe("and cancel is called before the acknowledgement arrives", function() {
            var cancellationError;

            it("rejects with the cancellation error", function(done) {
                cancellationError = new Promise.CancellationError();
                channel.receive.and.returnValue(Promise.reject(cancellationError));
                incomingShuffleState.waitForResponseAcknowledgement(channel)
                    .catch(Promise.CancellationError, done);
            });
        });
    });

    describe("when closing", function() {

        beforeEach(function(done) {
            asyncExecService.setTimeout.and.returnValue(TIMEOUT_ID);
            channel.receive.and.returnValue(Promise.resolve({payload: REQUEST_PAYLOAD}));
            incomingShuffleState.processShuffleRequest(channel)
                .then(successCallback).catch(failureCallback);

            setTimeout(function() {
                incomingShuffleState.close();
                done();
            }, 10);
        });

        it("clears the response sending timeout", function() {
            expect(asyncExecService.clearTimeout).toHaveBeenCalledWith(TIMEOUT_ID);
        });
    });

    describe("when cancelling", function() {

        var lastOutstandingPromise;

        beforeEach(function() {
            lastOutstandingPromise = ClientMocks.mockPromise();
            channel.receive.and.returnValue(lastOutstandingPromise);
            incomingShuffleState.processShuffleRequest(channel)
                .then(successCallback).catch(failureCallback);
        });

        describe("and the last outstanding promise is pending", function() {
            beforeEach(function() {
                lastOutstandingPromise.isPending.and.returnValue(true);
                incomingShuffleState.cancel();
            });

            it("cancels the latest outstanding promise", function() {
                expect(lastOutstandingPromise.cancel).toHaveBeenCalled();
            });
        });

        describe("and the last outstanding promise is not pending", function() {
            beforeEach(function() {
                lastOutstandingPromise.isPending.and.returnValue(false);
                incomingShuffleState.cancel();
            });

            it("doesn't cancel the latest outstanding promise", function() {
                expect(lastOutstandingPromise.cancel).not.toHaveBeenCalled();
            });
        });
    });
});
