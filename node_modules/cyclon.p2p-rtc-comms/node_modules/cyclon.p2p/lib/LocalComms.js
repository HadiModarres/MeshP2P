'use strict';

var Promise = require("bluebird");
var Utils = require("cyclon.p2p-common");

function LocalComms (localId, allNodes) {

    Utils.checkArguments(arguments, 2);
    var __localNode = null;

    this.initialize = function (localNode, metadataProviders) {
        __localNode = localNode;
        allNodes[__localNode.getId()] = __localNode;
    };

    /**
     * Send a shuffle request to another node
     *
     * @param destinationNodePointer
     * @param shuffleSet
     */
    this.sendShuffleRequest = function (destinationNodePointer, shuffleSet) {
        var responseSet = allNodes[destinationNodePointer.id].handleShuffleRequest(null, shuffleSet);
        allNodes[__localNode.getId()].handleShuffleResponse(destinationNodePointer, responseSet);
        return Promise.resolve();
    };

    this.getLocalId = function () {
        return localId;
    };

    this.createNewPointer = function () {
        return {
            id: localId,
            metadata: {},
            age: 0
        }
    }
}

module.exports = LocalComms;
