"use strict";

var Promise = require("bluebird");
var MessagingUtilities = require("../lib/MessagingUtilities");
var ClientMocks = require("./ClientMocks");

var TIMEOUT_MS = 101,
    TIMEOUT_ID = 99999,
    SOURCE_POINTER = {
        id: "sourcePointer'sId"
    },
    successCallback,
    failureCallback,
    asyncExecService,
    loggingService,
    messagingUtilities,
    dataChannel;

describe("The MessagingUtilities", function() {

    beforeEach(function() {
        successCallback = ClientMocks.createSuccessCallback();
        failureCallback = ClientMocks.createFailureCallback();

        asyncExecService = ClientMocks.mockAsyncExecService();
        loggingService = ClientMocks.mockLoggingService();
        dataChannel = ClientMocks.mockRtcDataChannel();

        asyncExecService.setTimeout.and.returnValue(TIMEOUT_ID);

        dataChannel.readyState = "open";

        messagingUtilities = new MessagingUtilities(asyncExecService, loggingService);
    });

    describe("when waiting for a message", function() {

        it("will fail if the data channel readyState is not open", function() {

            runs(function() {
                dataChannel.readyState = "closing";
                messagingUtilities.waitForChannelMessage("someType", dataChannel, TIMEOUT_MS, SOURCE_POINTER)
                    .then(successCallback).catch(failureCallback);
            });

            waits(10);

            runs(function() {
                expect(successCallback).not.toHaveBeenCalled();
                expect(failureCallback).toHaveBeenCalled();
            });
        });

        describe("on an open channel", function() {

            beforeEach(function() {
                runs(function() {
                    messagingUtilities.waitForChannelMessage("someType", dataChannel, TIMEOUT_MS, SOURCE_POINTER)
                        .then(successCallback).catch(failureCallback);
                });

                waits(10);
            });

            it("will set a listener on the onmessage event for the arrival of the message", function() {
                expect(dataChannel.onmessage).toEqual(jasmine.any(Function))
            });

            it("will schedule a timeout callback for the number of milliseconds specified", function() {
                expect(asyncExecService.setTimeout).toHaveBeenCalledWith(jasmine.any(Function), TIMEOUT_MS);
            });

            it("will stay unresolved until a timeout occurs or the message is received", function() {
                expect(successCallback).not.toHaveBeenCalled();
                expect(failureCallback).not.toHaveBeenCalled();
            });
        });
    });

    describe("when a message arrives", function() {

        beforeEach(function() {
            runs(function() {
                messagingUtilities.waitForChannelMessage("someType", dataChannel, TIMEOUT_MS, SOURCE_POINTER)
                    .then(successCallback).catch(failureCallback);
            });

            waits(10);
        });

        describe("and it cannot be parsed", function() {

            it("is ignored and an error logged", function() {
                dataChannel.onmessage({data: "notAJSONString"});

                expect(loggingService.error).toHaveBeenCalled();
                expect(successCallback).not.toHaveBeenCalled();
                expect(failureCallback).not.toHaveBeenCalled();
            });
        });

        describe("of the incorrect type", function() {
            it("is ignored and an error logged", function() {

                dataChannel.onmessage({data: JSON.stringify({type: "someOtherType"})});

                expect(loggingService.error).toHaveBeenCalled();
                expect(successCallback).not.toHaveBeenCalled();
                expect(failureCallback).not.toHaveBeenCalled();
            });
        });

        describe("of the correct type", function() {

            var message = {type: "someType", payload: "PAYLOAD"};

            beforeEach(function() {
                runs(function() {
                    dataChannel.onmessage({data: JSON.stringify(message)});
                });

                waits(10);
            });

            it("will clear the timeout callback timer", function() {
                expect(asyncExecService.clearTimeout).toHaveBeenCalledWith(TIMEOUT_ID);
            });

            it("will clear the onmessage listener", function() {
                expect(dataChannel.onmessage).toBeNull();
            });

            it("will pass the message to resolve", function() {
                expect(successCallback).toHaveBeenCalledWith(message);
                expect(failureCallback).not.toHaveBeenCalled();
            });
        });
    });

    describe("when a timeout occurs waiting for a message", function() {

        beforeEach(function() {
            asyncExecService.setTimeout.and.callFake(function(callback) {
                callback();
            });

            runs(function() {
                messagingUtilities.waitForChannelMessage("someType", dataChannel, TIMEOUT_MS, SOURCE_POINTER)
                    .then(successCallback).catch(failureCallback);
            });

            waits(10);
        });

        it("clears the onmessage handler", function() {
            expect(dataChannel.onmessage).toBeNull();
        });

        it("rejects with a TimeoutError", function() {
            expect(failureCallback).toHaveBeenCalledWith(jasmine.any(Promise.TimeoutError));
        });
    });

    describe("when cancel is called", function() {

        var waitForMessagePromise;

        beforeEach(function() {
            runs(function() {
                waitForMessagePromise = messagingUtilities.waitForChannelMessage("someType", dataChannel, TIMEOUT_MS, SOURCE_POINTER)
                    .then(successCallback).catch(failureCallback);
            });

            waits(10);

            runs(function() {
                waitForMessagePromise.cancel();
            });

            waits(100);
        });

        it("clears the timeout timer", function() {
            expect(asyncExecService.clearTimeout).toHaveBeenCalledWith(TIMEOUT_ID);
        });

        it("rejects with a CancellationError", function() {
            expect(failureCallback).toHaveBeenCalledWith(jasmine.any(Promise.CancellationError));
            expect(successCallback).not.toHaveBeenCalled();
        });
    });

});