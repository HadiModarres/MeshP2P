'use strict';

var Promise = require("bluebird");
var events = require("events");
var SocketIOSignallingService = require("../lib/SocketIOSignallingService");
var ClientMocks = require("./ClientMocks");
var UnreachableError = require("cyclon.p2p-common").UnreachableError;

describe("The socket.io signalling service", function () {

    var signallingService,
        loggingService,
        signallingSocket,
        httpRequestService,
        successCallback,
        failureCallback,
        capSuccess,
        capFailure,
        storage;

    var STORED_ID_STORAGE_KEY = "cyclon-rtc-local-node-id";
    var LOCAL_ID = "LOCAL_ID";
    var REMOTE_ID = "REMOTE_ID";
    var SIGNALLING_BASE = "http://signalling-base.com/path/to/";
    var DESTINATION_NODE = {
        id: REMOTE_ID,
        signalling: [
            {
                signallingApiBase: SIGNALLING_BASE
            }
        ]
    };
    var SESSION_DESCRIPTION = "SESSION_DESCRIPTION";
    var ICE_CANDIDATES = ["a", "b", "c"];
    var NODE_POINTER = "NODE_POINTER";
    var TYPE = "TYPE";
    var CORRELATION_ID = "CORRELATION_ID";
    var LOCAL_SERVER_SPECS = [
        {signallingApiBase: "http://signalling.api/base"}
    ];
    var METADATA_PROVIDERS = [function () {
    }, function () {
    }];
    var ROOMS = ["room", "otherRoom"];

    beforeEach(function () {
        successCallback = ClientMocks.createSuccessCallback();
        failureCallback = ClientMocks.createFailureCallback();

        loggingService = ClientMocks.mockLoggingService();
        signallingSocket = ClientMocks.mockSignallingSocket();
        httpRequestService = ClientMocks.mockHttpRequestService();
        storage = ClientMocks.mockStorage();

        storage.getItem.and.callFake(function (itemId) {
            if (itemId === STORED_ID_STORAGE_KEY) {
                return LOCAL_ID;
            }
            return null;
        });

        signallingSocket.getCurrentServerSpecs.and.returnValue(LOCAL_SERVER_SPECS);

        // Capture success/failure callbacks when post is called
        httpRequestService.post.and.callFake(function () {
            return Promise.resolve({});
        });
        capSuccess = capFailure = null;

        signallingService = new SocketIOSignallingService(signallingSocket, loggingService, httpRequestService, storage);
    });

    describe("in construction", function () {
        it("should add a listener to propagate 'answer' events", function () {
            expect(signallingSocket.on).toHaveBeenCalledWith("answer", jasmine.any(Function));
        });

        it("should add a listener to propagate 'offer' events", function () {
            expect(signallingSocket.on).toHaveBeenCalledWith("offer", jasmine.any(Function));
        });

        it("should add a listener to propagate 'candidates' events", function () {
            expect(signallingSocket.on).toHaveBeenCalledWith("candidates", jasmine.any(Function));
        });
    });

    describe("when connecting", function () {

        beforeEach(function () {
            signallingService.connect(METADATA_PROVIDERS, ROOMS);
        });

        it("should call connect on the underlying signalling socket", function () {
            expect(signallingSocket.connect).toHaveBeenCalledWith(signallingService, ROOMS);
        });
    });

    describe("when creating a new pointer", function () {

        it("should delegate to the signalling socket for signalling data", function () {
            var SERVER_SPECS = "SERVER_SPECS";
            signallingSocket.getCurrentServerSpecs.and.returnValue(SERVER_SPECS);
            var pointer = signallingService.createNewPointer();
            expect(pointer.signalling).toBe(SERVER_SPECS);
        });

        it("should populate the metadata from the providers", function () {
            var metadataProviders = {
                one: function () {
                    return "oneValue";
                },
                two: function () {
                    return "twoValue";
                }
            };
            signallingService.connect(metadataProviders);

            expect(signallingService.createNewPointer().metadata).toEqual({
                one: "oneValue",
                two: "twoValue"
            });
        });
    });

    describe("when sending messages", function () {

        beforeEach(function () {
            signallingService.connect();
        });

        it("should emit a correctly structured offer message and return the correlation ID", function (done) {

            signallingService.sendOffer(DESTINATION_NODE, TYPE, SESSION_DESCRIPTION)
                .then(function (result) {
                    expect(httpRequestService.post).toHaveBeenCalledWith(SIGNALLING_BASE + "api/offer", {
                        channelType: TYPE,
                        sourceId: LOCAL_ID,
                        correlationId: 0,
                        sourcePointer: {
                            id: LOCAL_ID,
                            age: 0,
                            seq: 0,
                            signalling: LOCAL_SERVER_SPECS,
                            metadata: {}
                        },
                        destinationId: DESTINATION_NODE.id,
                        sessionDescription: SESSION_DESCRIPTION
                    });

                    expect(result).toBe(0);
                    done();
                });
        });

        it("should emit a correctly structured answer message", function (done) {

            signallingService.sendAnswer(DESTINATION_NODE, CORRELATION_ID, SESSION_DESCRIPTION)
                .then(function () {
                    expect(httpRequestService.post).toHaveBeenCalledWith(SIGNALLING_BASE + "api/answer", {
                        sourceId: LOCAL_ID,
                        correlationId: CORRELATION_ID,
                        destinationId: DESTINATION_NODE.id,
                        sessionDescription: SESSION_DESCRIPTION
                    });
                    done();
                });
        });

        it("should throw an UnreachableError when the peer has no signalling servers specified", function (done) {

            var destinationNodeWithNoSignallingServers = {
                id: "DESTINATION_ID",
                signalling: []
            };

            signallingService.sendAnswer(destinationNodeWithNoSignallingServers, SESSION_DESCRIPTION)
                .catch(UnreachableError, done);
        });

        it("should throw an UnreachableError when the peer is no longer connected to any of its signalling servers", function (done) {

            httpRequestService.post.and.returnValue(Promise.reject(new Error("404 received")));

            signallingService.sendAnswer(DESTINATION_NODE, SESSION_DESCRIPTION, ICE_CANDIDATES)
                .then(successCallback)
                .catch(UnreachableError, done);
        });
    });

    describe("when waiting for an answer", function () {

        beforeEach(function () {
            signallingSocket = new events.EventEmitter();
            signallingSocket.connect = jasmine.createSpy('connect');

            signallingService = new SocketIOSignallingService(signallingSocket, loggingService, httpRequestService, storage);
            signallingService.connect();
        });

        it("resolves with the answer message when the correlated answer arrives", function () {

            var message = {
                sourceId: REMOTE_ID,
                correlationId: CORRELATION_ID
            };

            signallingService.waitForAnswer(CORRELATION_ID).then(function (result) {
                expect(result).toBe(message);
            });

            signallingSocket.emit("answer", message);
        });

        it("ignores non-correlated answers", function (done) {

            var message = {
                sourceId: REMOTE_ID,
                correlationId: "OTHER_" + CORRELATION_ID
            };

            signallingService.waitForAnswer(CORRELATION_ID).then(successCallback).catch(failureCallback);
            signallingSocket.emit("answer", message);

            setTimeout(function () {
                expect(successCallback).not.toHaveBeenCalled();
                expect(failureCallback).not.toHaveBeenCalled();
                done();
            }, 10);
        });

        describe("and cancel is called", function () {

            beforeEach(function (done) {
                signallingService.waitForAnswer(CORRELATION_ID)
                    .then(successCallback)
                    .catch(Promise.CancellationError, done)
                    .cancel();
            });

            it("stops listening for the answer message", function (done) {

                var message = {
                    sourceId: REMOTE_ID,
                    correlationId: CORRELATION_ID
                };

                signallingSocket.emit("answer", message);

                setTimeout(function () {
                    expect(successCallback).not.toHaveBeenCalled();
                    done();
                }, 100);
            });
        });
    });

    describe("when an offer is received", function () {

        var offerHandler;

        beforeEach(function () {
            offerHandler = jasmine.createSpy('offerHandler');

            signallingSocket = new events.EventEmitter();
            signallingSocket.connect = jasmine.createSpy('connect');

            signallingService = new SocketIOSignallingService(signallingSocket, loggingService, httpRequestService, storage);
            signallingService.connect();
        });

        it("emits an offer event with the message", function () {

            var message = {
                sourceId: REMOTE_ID,
                correlationId: CORRELATION_ID
            };

            signallingService.on("offer", offerHandler);
            signallingSocket.emit("offer", message);

            expect(offerHandler).toHaveBeenCalledWith(message);
        });
    });

    describe("when ICE candidates are received", function () {

        var candidatesHandler;

        beforeEach(function () {
            candidatesHandler = jasmine.createSpy('candidatesHandler');

            signallingSocket = new events.EventEmitter();
            signallingSocket.connect = jasmine.createSpy('connect');

            signallingService = new SocketIOSignallingService(signallingSocket, loggingService, httpRequestService, storage);
            signallingService.connect();
        });

        it("emits an candidates event with the message", function () {

            var message = {
                sourceId: REMOTE_ID,
                correlationId: 1,
                iceCandidates: [
                    {signallingApiBase: "aaa"},
                    {signallingApiBase: "bbb"}
                ]
            };

            signallingService.on("candidates-" + REMOTE_ID + "-1", candidatesHandler);
            signallingSocket.emit("candidates", message);

            expect(candidatesHandler).toHaveBeenCalledWith(message);
        });
    });

    describe("when getting the local ID", function () {

        describe("and it has been previously generated and stored", function () {

            it("returns the stored ID", function () {
                storage.getItem.and.returnValue("STORED_KEY");
                expect(signallingService.getLocalId()).toBe("STORED_KEY");
            });
        });

        describe("and no key has been previously generated", function () {

            it("generates a new ID", function () {
                storage.getItem.and.returnValue(null);
                expect(signallingService.getLocalId()).toMatch(/^[\da-f]{8}\-[\da-f]{4}\-4[\da-f]{3}\-[\da-f]{4}\-[\da-f]{12}$/);
            });
        });
    });

    describe("when sending ICE candidates", function () {
        beforeEach(function () {
            signallingService.connect();
        });

        it("should emit a correctly structured ICE candidate message", function (done) {

            signallingService.sendIceCandidates(DESTINATION_NODE, CORRELATION_ID, ICE_CANDIDATES).then(function () {

                expect(httpRequestService.post).toHaveBeenCalledWith(SIGNALLING_BASE + "api/candidates", {
                    sourceId: LOCAL_ID,
                    correlationId: CORRELATION_ID,
                    destinationId: DESTINATION_NODE.id,
                    iceCandidates: ICE_CANDIDATES
                });
                done();
            });
        });
    });
});