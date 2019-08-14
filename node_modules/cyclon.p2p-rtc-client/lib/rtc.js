'use strict';

var Promise = require("bluebird");
var EventEmitter = require("events").EventEmitter;
var Utils = require("cyclon.p2p-common");

function RTC(signallingService, channelFactory) {

    Utils.checkArguments(arguments, 2);

    this._signallingService = signallingService;
    this._channelFactory = channelFactory;
    this._channelListeners = {};
    this._connected = false;
}

RTC.prototype = Object.create(EventEmitter.prototype);

RTC.prototype.connect = function (metadataProviders, rooms) {
    var self = this;
    if (!this._connected) {
        this._signallingService.connect(metadataProviders, rooms);
        this._signallingService.on("offer", function (message) {
            self.__handleOffer(message);
        });
        this._connected = true;
    }
};

RTC.prototype.createNewPointer = function () {
    return this._signallingService.createNewPointer();
};

RTC.prototype.getLocalId = function () {
    return this._signallingService.getLocalId();
};

RTC.prototype.onChannel = function (type, callback) {
    this._channelListeners[type] = callback;
};

RTC.prototype.openChannel = function (type, remotePointer) {
    var channel = this._channelFactory.createChannel(remotePointer);

    return channel.createOffer(type)
        .then(channel.sendOffer)
        .then(channel.startListeningForRemoteIceCandidates)
        .then(channel.waitForAnswer)
        .then(channel.handleAnswer)
        .then(channel.startSendingIceCandidates)
        .then(channel.waitForChannelToOpen)
        .then(channel.stopSendingIceCandidates)
        .catch(function (error) {
            // If an error occurs here, cleanup our attempted channel
            // establishment resources before continuing
            channel.close();
            throw error;
        });
};

RTC.prototype.__handleOffer = function (offerMessage) {
    var self = this;
    var channelType = offerMessage.channelType;
    var listener = this._channelListeners[channelType];
    var remotePointer = offerMessage.sourcePointer;
    var correlationId = offerMessage.correlationId;

    self.emit("offerReceived", channelType, offerMessage.sourcePointer);

    if (listener) {
        var channel = this._channelFactory.createChannel(remotePointer, correlationId);

        channel.createAnswer(offerMessage.sessionDescription)
            .then(channel.startListeningForRemoteIceCandidates)
            .then(channel.sendAnswer)
            .then(channel.startSendingIceCandidates)
            .then(channel.waitForChannelEstablishment)
            .then(channel.waitForChannelToOpen)
            .then(channel.stopSendingIceCandidates)
            .then(listener)
            .catch(Promise.TimeoutError, function () {
                self.emit("incomingTimeout", channelType, offerMessage.sourcePointer);
                channel.close();
            })
            .catch(function (e) {
                self.emit("incomingError", channelType, offerMessage.sourcePointer, e);
                channel.close();
            });
    }
    else {
        console.warn("No listener for channel type " + channelType + ", ignoring offer!");
    }
};

module.exports = RTC;
