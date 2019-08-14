'use strict';

var Promise = require("bluebird");
var ClientMocks = require("./ClientMocks");
var IceCandidateBatchingSignallingService = require("../lib/IceCandidateBatchingSignallingService");

describe("The ICE candidate batching signalling service decorator", function() {

    var SESSION_METADATA_PROVIDERS = "SESSION_METADATA_PROVIDERS",
        ROOMS = "ROOMS",
        DESTINATION_NODE = {
            id: "DESTINATION_NODE_ID"
        },
        TYPE = "TYPE",
        SESSION_DESCRIPTION = "SESSION_DESCRIPTION",
        SEND_OFFER_RESULT = "SEND_OFFER_RESULT",
        CORRELATION_ID = "CORRELATION_ID",
        WAIT_FOR_ANSWER_RESULT = "WAIT_FOR_ANSWER_RESULT",
        CREATE_NEW_POINTER_RESULT = "CREATE_NEW_POINTER_RESULT",
        GET_LOCAL_ID_RESULT = "GET_LOCAL_ID_RESULT",
        SEND_ANSWER_RESULT = "SEND_ANSWER_RESULT",
        BATCHING_DELAY_MS = 200;

    var batchingService,
        wrappedService,
        asyncExecService,
        sendIceCandidatesResponse;

    beforeEach(function() {
        asyncExecService = ClientMocks.mockAsyncExecService();
        wrappedService = ClientMocks.mockSignallingService();
        sendIceCandidatesResponse = Promise.resolve({});

        wrappedService.sendOffer.and.returnValue(SEND_OFFER_RESULT);
        wrappedService.waitForAnswer.and.returnValue(WAIT_FOR_ANSWER_RESULT);
        wrappedService.createNewPointer.and.returnValue(CREATE_NEW_POINTER_RESULT);
        wrappedService.getLocalId.and.returnValue(GET_LOCAL_ID_RESULT);
        wrappedService.sendAnswer.and.returnValue(SEND_ANSWER_RESULT);
        wrappedService.sendIceCandidates.and.returnValue(sendIceCandidatesResponse);

        batchingService = new IceCandidateBatchingSignallingService(asyncExecService, wrappedService, BATCHING_DELAY_MS);
    });

    describe("when connecting", function() {

        it("delegates to the wrapped signalling service", function() {
            batchingService.connect(SESSION_METADATA_PROVIDERS, ROOMS);
            expect(wrappedService.connect).toHaveBeenCalledWith(SESSION_METADATA_PROVIDERS, ROOMS);
        });
    });

    describe("when sending an offer", function() {

        it("delegates to the wrapped signalling service", function() {
            expect(batchingService.sendOffer(DESTINATION_NODE, TYPE, SESSION_DESCRIPTION)).toBe(SEND_OFFER_RESULT);
            expect(wrappedService.sendOffer).toHaveBeenCalledWith(DESTINATION_NODE, TYPE, SESSION_DESCRIPTION);
        });
    });

    describe("when waiting for an answer", function() {

        it("delegates to the wrapped signalling service", function() {
            expect(batchingService.waitForAnswer(CORRELATION_ID)).toBe(WAIT_FOR_ANSWER_RESULT);
            expect(wrappedService.waitForAnswer).toHaveBeenCalledWith(CORRELATION_ID);
        });
    });

    describe("when creating a new pointer", function() {

        it("delegates to the wrapped signalling service", function() {
            expect(batchingService.createNewPointer()).toBe(CREATE_NEW_POINTER_RESULT);
            expect(wrappedService.createNewPointer).toHaveBeenCalledWith();
        });
    });

    describe("when getting local ID", function() {

        it("delegates to the wrapped signalling service", function() {
            expect(batchingService.getLocalId()).toBe(GET_LOCAL_ID_RESULT);
            expect(wrappedService.getLocalId).toHaveBeenCalledWith();
        });
    });

    describe("when sending an answer", function() {

        it("delegates to the wrapped signalling service", function() {
            expect(batchingService.sendAnswer(DESTINATION_NODE, CORRELATION_ID, SESSION_DESCRIPTION)).toBe(SEND_ANSWER_RESULT);
            expect(wrappedService.sendAnswer).toHaveBeenCalledWith(DESTINATION_NODE, CORRELATION_ID, SESSION_DESCRIPTION);
        });
    });

    describe("when sending ICE candidates", function() {

        describe("and it is the first set of candidates sent to the peer/correlation ID combination", function() {

            it("queues the candidates and schedules their delivery", function() {
                batchingService.sendIceCandidates(DESTINATION_NODE, CORRELATION_ID, ["one", "two"]);
                expect(wrappedService.sendIceCandidates).not.toHaveBeenCalled();
                expect(asyncExecService.setTimeout).toHaveBeenCalledWith(jasmine.any(Function), BATCHING_DELAY_MS);
            });
        });

        describe("and the batching delay is reached", function() {

            it("sends all candidates received since the queueing started", function() {
                batchingService.sendIceCandidates(DESTINATION_NODE, CORRELATION_ID, ["one", "two"]);
                var firstSendFunction = asyncExecService.setTimeout.calls.mostRecent().args[0];
                batchingService.sendIceCandidates(DESTINATION_NODE, "other_" + CORRELATION_ID, ["other_one", "other_two"]);
                var secondSendFunction = asyncExecService.setTimeout.calls.mostRecent().args[0];
                batchingService.sendIceCandidates(DESTINATION_NODE, CORRELATION_ID, ["three"]);

                expect(wrappedService.sendIceCandidates).not.toHaveBeenCalled();
                firstSendFunction();
                expect(wrappedService.sendIceCandidates).toHaveBeenCalledWith(DESTINATION_NODE, CORRELATION_ID, ["one", "two", "three"]);

                // reset the mock
                wrappedService.sendIceCandidates.calls.reset();
                secondSendFunction();
                expect(wrappedService.sendIceCandidates).toHaveBeenCalledWith(DESTINATION_NODE, "other_"+CORRELATION_ID, ["other_one", "other_two"]);
            });
        });
    });
});