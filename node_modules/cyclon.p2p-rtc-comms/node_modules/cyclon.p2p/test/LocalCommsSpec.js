'use strict';

var ClientMocks = require("./ClientMocks");
var LocalComms = require("../lib/LocalComms");

describe("The LocalComms", function() {

    var LOCAL_ID = "LOCAL_ID";
    var REMOTE_ID = "REMOTE_ID";
    var METADATA_PROVIDERS = "METADATA_PROVIDERS";
    var SHUFFLE_RESPONSE = "SHUFFLE_RESPONSE";
    var DESTINATION_NODE_POINTER = {
        id: REMOTE_ID
    };
    var SHUFFLE_SET = "SHUFFLE_SET";

    var localNode,
        remoteNode;

    var comms,
        remoteComms,
        allNodes;

    beforeEach(function () {
        allNodes = {};
        localNode = ClientMocks.mockCyclonNode();
        localNode.getId.and.returnValue(LOCAL_ID);
        remoteNode = ClientMocks.mockCyclonNode();
        remoteNode.getId.and.returnValue(REMOTE_ID);
        comms = new LocalComms(LOCAL_ID, allNodes);
        remoteComms = new LocalComms(REMOTE_ID, allNodes);
        comms.initialize(localNode, METADATA_PROVIDERS);
        remoteComms.initialize(remoteNode, METADATA_PROVIDERS);
    });

    describe("when initializing", function () {

        it("adds the node to the allNodes array", function () {
            expect(allNodes[LOCAL_ID]).toBe(localNode);
        });
    });

    describe("when sending a shuffle request", function() {

        beforeEach(function() {
            remoteNode.handleShuffleRequest.and.returnValue(SHUFFLE_RESPONSE);
        });

        it("executes the shuffle on the remote node, then handles the response on the local node", function() {
            comms.sendShuffleRequest(DESTINATION_NODE_POINTER, SHUFFLE_SET);
            expect(remoteNode.handleShuffleRequest).toHaveBeenCalledWith(null, SHUFFLE_SET);
            expect(localNode.handleShuffleResponse).toHaveBeenCalledWith(DESTINATION_NODE_POINTER, SHUFFLE_RESPONSE);
        });
    });

    it("returns the local ID", function() {
        expect(comms.getLocalId()).toBe(LOCAL_ID);
    });

    it("creates new pointers", function() {
        expect(comms.createNewPointer("metadata")).toEqual({
            id: LOCAL_ID,
            metadata: {},
            age: 0
        });
    })
});