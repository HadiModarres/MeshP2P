"use strict";

module.exports.mockLoggingService = function () {
    return jasmine.createSpyObj('loggingService', ['error', 'debug', 'info', 'warn']);
};

module.exports.mockCyclonNode = function () {
    return jasmine.createSpyObj('cyclonNode', ['getId', 'start', 'executeShuffle', 'createNewPointer', 'handleShuffleRequest', 'handleShuffleResponse', 'emit']);
};

module.exports.mockRtc = function () {
    return jasmine.createSpyObj('rtc', ['connect', 'onChannel', 'openChannel', 'on', 'createNewPointer', 'getLocalId']);
};

module.exports.mockChannel = function() {
    return jasmine.createSpyObj('channel', ['getRemotePeer', 'createOffer', 'createAnswer', 'sendAnswer', 'waitForChannelEstablishment', 'waitForIceCandidates', 'sendOffer', 'handleAnswer', 'waitForChannelToOpen', 'send', 'receive', 'close', 'cancel']);
};

module.exports.mockAsyncExecService = function () {
    return jasmine.createSpyObj('asyncExecService', ['setTimeout', 'setInterval', 'clearTimeout', 'clearInterval']);
};

module.exports.mockSignallingSocket = function () {
    return jasmine.createSpyObj('signallingSocket', ['getCurrentServerSpecs', 'initialize', 'on']);
};

module.exports.mockHttpRequestService = function () {
    return jasmine.createSpyObj('httpRequestService', ['get', 'post']);
};

module.exports.mockShuffleStateFactory = function () {
    return jasmine.createSpyObj('shuffleStateFactory', ['createOutgoingShuffleState', 'createIncomingShuffleState']);
};

module.exports.mockOutgoingShuffleState = function (name) {
    return jasmine.createSpyObj(name || 'outgoingShuffleState', ['sendShuffleRequest', 'processShuffleResponse', 'sendResponseAcknowledgement', 'close', 'cancel']);
};

module.exports.mockIncomingShuffleState = function () {
    return jasmine.createSpyObj('incomingShuffleState', ['processShuffleRequest', 'waitForResponseAcknowledgement', 'close', 'cancel']);
};

module.exports.mockNeighbourSet = function () {
    return jasmine.createSpyObj('neighbourSet', ['contains', 'insert', 'remove', 'get', 'size', 'selectShuffleSet', 'findOldestId', 'randomSelection', 'incrementAges', 'resetAge', 'mergeNodePointerIfNewer']);
};

module.exports.mockComms = function () {
    return jasmine.createSpyObj('comms', ['sendShuffleRequest', 'sendShuffleResponse', 'getPointerData']);
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
    return jasmine.createSpy('failureCallback').and.callFake(function (error) {
        //console.error("Error occurred!", error);
    });
};

module.exports.mockPromise = function() {
    var mockPromise = jasmine.createSpyObj('mockPromise', ['isPending', 'close', 'cancel', 'then', 'catch', 'cancellable']);
    mockPromise.then.and.returnValue(mockPromise);
    mockPromise.cancellable.and.returnValue(mockPromise);
    mockPromise.catch.and.returnValue(mockPromise);
    return mockPromise;
};
