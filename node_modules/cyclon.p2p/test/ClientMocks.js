"use strict";

module.exports.mockLoggingService = function () {
    return jasmine.createSpyObj('loggingService', ['error', 'debug', 'info', 'warn']);
};

module.exports.mockCyclonNode = function () {
    return jasmine.createSpyObj('cyclonNode', ['getId', 'start', 'executeShuffle', 'createNewPointer', 'handleShuffleRequest', 'handleShuffleResponse', 'emit']);
};

module.exports.mockAsyncExecService = function () {
    return jasmine.createSpyObj('asyncExecService', ['setTimeout', 'setInterval', 'clearTimeout', 'clearInterval']);
};

module.exports.mockNeighbourSet = function () {
    return jasmine.createSpyObj('neighbourSet', ['contains', 'insert', 'remove', 'get', 'size', 'selectShuffleSet', 'findOldestId', 'randomSelection', 'incrementAges', 'resetAge', 'mergeNodePointerIfNewer']);
};

module.exports.mockComms = function () {
    return jasmine.createSpyObj('comms', ['sendShuffleRequest', 'sendShuffleResponse', 'createNewPointer', 'getLocalId', 'initialize']);
};

module.exports.mockBootstrap = function() {
    return jasmine.createSpyObj('bootstrap', ['getInitialPeerSet']);
};

module.exports.mockStorage = function() {
    return jasmine.createSpyObj('storage', ['getItem', 'setItem']);
};

//
// Success/failure callbacks for testing
//
module.exports.createSuccessCallback = function () {
    return jasmine.createSpy('successCallback');
};

module.exports.createFailureCallback = function () {
    return jasmine.createSpy('failureCallback').andCallFake(function (error) {
        //console.error("Error occurred!", error);
    });
};

module.exports.mockPromise = function() {
    var mockPromise = jasmine.createSpyObj('mockPromise', ['isPending', 'close', 'cancel', 'then', 'catch', 'cancellable']);
    mockPromise.then.andReturn(mockPromise);
    mockPromise.cancellable.andReturn(mockPromise);
    mockPromise.catch.andReturn(mockPromise);
    return mockPromise;
};




