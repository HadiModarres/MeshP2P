'use strict';

var Promise = require("bluebird");
var SignallingServerBootstrap = require("../lib/SignallingServerBootstrap");
var ClientMocks = require("./ClientMocks");

describe("The signalling server bootstrap", function () {

    var SIGNALLING_SERVERS = [
        {
            signallingApiBase: "http://one"
        },
        {
            signallingApiBase: "http://two"
        }
    ];

    var NODE_ID = "NODE_ID",
        LIMIT = 50;

    var bootstrap,
        signallingSocket,
        httpRequestService,
        cyclonNode,
        serverOneResponse,
        serverTwoResponse;

    var successCallback,
        failureCallback;

    beforeEach(function () {
        successCallback = ClientMocks.createSuccessCallback();
        failureCallback = ClientMocks.createFailureCallback();

        cyclonNode = ClientMocks.mockCyclonNode();
        signallingSocket = ClientMocks.mockSignallingSocket();
        httpRequestService = ClientMocks.mockHttpRequestService();

        //
        // Mock behaviour
        //
        signallingSocket.getCurrentServerSpecs.and.returnValue(SIGNALLING_SERVERS);
        cyclonNode.getId.and.returnValue(NODE_ID);
        httpRequestService.get.and.callFake(function (url) {
            if (url.indexOf("http://one/api/peers") === 0) {
                return serverOneResponse;
            }
            else if (url.indexOf("http://two/api/peers") === 0) {
                return serverTwoResponse;
            }
            throw new Error("Something weird happened");
        });

        bootstrap = new SignallingServerBootstrap(signallingSocket, httpRequestService);
    });

    describe("when fetching initial peer sets", function () {

        it("returns combined results from all servers that respond", function (done) {

            serverOneResponse = Promise.resolve({
                NODE_ID: {id: NODE_ID},
                NODE_ID_ONE: {id: "NODE_ID_ONE"}
            });
            serverTwoResponse = Promise.resolve({
                NODE_ID: {id: NODE_ID},
                NODE_ID_TWO: {id: "NODE_ID_TWO"}
            });

            bootstrap.getInitialPeerSet(cyclonNode, LIMIT).then(function(result) {
                expect(result).toEqual([
                    {id: "NODE_ID_ONE"},
                    {id: "NODE_ID_TWO"}
                ]);
                done();
            });
        });

        it("restricts the number of peers returned to that requested", function (done) {

            serverOneResponse = Promise.resolve({
                NODE_ID: {id: NODE_ID},
                NODE_ID_ONE: {id: "NODE_ID_ONE"}
            });
            serverTwoResponse = Promise.resolve({
                NODE_ID: {id: NODE_ID},
                NODE_ID_TWO: {id: "NODE_ID_TWO"}
            });

            bootstrap.getInitialPeerSet(cyclonNode, 1).then(function(result) {
                expect(result.length).toBe(1);
                done();
            });
        });

        it("returns an empty array when no results are returned", function (done) {

            serverOneResponse = Promise.reject(new Error("dumb"));
            serverTwoResponse = Promise.reject(new Error("dumber"));

            bootstrap.getInitialPeerSet(cyclonNode, LIMIT).then(function(result) {
                expect(result).toEqual([]);
                done();
            });
        });
    });
});
