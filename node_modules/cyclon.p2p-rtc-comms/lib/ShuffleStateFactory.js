'use strict';

var IncomingShuffleState = require("./IncomingShuffleState");
var OutgoingShuffleState = require("./OutgoingShuffleState");

var Utils = require("cyclon.p2p-common");

function ShuffleStateFactory(logger, asyncExecService) {

    Utils.checkArguments(arguments, 2);

    /**
     * Create a new outgoing shuffle state
     *
     * @param localNode The local Cyclon node
     * @param destinationNodePointer The pointer to the destination node
     * @param shuffleSet The set of node pointers to send in the request
     * @returns {OutgoingShuffleState}
     */
    this.createOutgoingShuffleState = function (localNode, destinationNodePointer, shuffleSet) {
        return new OutgoingShuffleState(localNode, destinationNodePointer, shuffleSet, asyncExecService, logger);
    };

    /**
     * Create a new incoming shuffle state
     *
     * @param localNode The local Cyclon node
     * @param sourcePointer The source peer's node pointer
     * @returns {IncomingShuffleState}
     */
    this.createIncomingShuffleState = function (localNode, sourcePointer) {
        return new IncomingShuffleState(localNode, sourcePointer, asyncExecService, logger);
    };
}

module.exports = ShuffleStateFactory;