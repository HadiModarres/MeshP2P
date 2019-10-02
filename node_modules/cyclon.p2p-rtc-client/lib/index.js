'use strict';

var Utils = require("cyclon.p2p-common");
var StaticSignallingServerService = require("./StaticSignallingServerService");
var TimingService = require("./TimingService");
var SocketFactory = require("./SocketFactory");
var HttpRequestService = require("./HttpRequestService");
var RedundantSignallingSocket = require("./RedundantSignallingSocket");
var SocketIOSignallingService = require("./SocketIOSignallingService");
var IceCandidateBatchingSignallingService = require("./IceCandidateBatchingSignallingService");
var NativeRTCObjectFactory = require("./NativeRTCObjectFactory");
var AdapterJsRTCObjectFactory = require("./AdapterJsRTCObjectFactory");
var ChannelFactory = require("./ChannelFactory");
var PeerConnectionFactory = require("./PeerConnectionFactory");
var RTC = require("./rtc");
var SignallingServerSelector = require("./SignallingServerSelector");

/*
 * Default values
 */
var DEFAULT_BATCHING_DELAY_MS = 300;
var DEFAULT_SIGNALLING_SERVERS = [
    {
        "socket": {
            "server": "http://cyclon-js-ss-one.herokuapp.com"
        },
        "signallingApiBase": "http://cyclon-js-ss-one.herokuapp.com"
    },
    {
        "socket": {
            "server": "http://cyclon-js-ss-two.herokuapp.com"
        },
        "signallingApiBase": "http://cyclon-js-ss-two.herokuapp.com"
    },
    {
        "socket": {
            "server": "http://cyclon-js-ss-three.herokuapp.com"
        },
        "signallingApiBase": "http://cyclon-js-ss-three.herokuapp.com"
    }
];
var DEFAULT_ICE_SERVERS = [
    // The public Google STUN server
    {urls: ['stun:stun.l.google.com:19302']},
];
var DEFAULT_CHANNEL_STATE_TIMEOUT_MS = 30000;
var DEFAULT_SIGNALLING_SERVER_RECONNECT_DELAY_MS = 5000;

module.exports.RTC = RTC;
module.exports.ChannelFactory = ChannelFactory;
module.exports.AdapterJsRTCObjectFactory = AdapterJsRTCObjectFactory;
module.exports.NativeRTCObjectFactory = NativeRTCObjectFactory;
module.exports.NodeJsRTCObjectFactory = require("./NodeJsRTCObjectFactory");
module.exports.TimingService = TimingService;
module.exports.HttpRequestService = HttpRequestService;
module.exports.RedundantSignallingSocket = RedundantSignallingSocket;
module.exports.SignallingServerSelector = SignallingServerSelector;
module.exports.StaticSignallingServerService = StaticSignallingServerService;
module.exports.SocketIOSignallingService = SocketIOSignallingService;
module.exports.SocketFactory = SocketFactory;
module.exports.PeerConnectionFactory = PeerConnectionFactory;
module.exports.IceCandidateBatchingSignallingService = IceCandidateBatchingSignallingService;

/**
 * Build the angular cyclon-rtc module
 *
 * @param angular The angular core module
 */
module.exports.buildAngularModule = function(angular) {
    var rtcModule = angular.module("cyclon-rtc", []);

    rtcModule.service("RTC", ["IceCandidateBatchingSignallingService", "ChannelFactory", RTC]);
    rtcModule.service("ChannelFactory", ["PeerConnectionFactory", "IceCandidateBatchingSignallingService", "$log", "ChannelStateTimeout", ChannelFactory]);
    rtcModule.service("PeerConnectionFactory", ["RTCObjectFactory", "$log", "IceServers", "ChannelStateTimeout", PeerConnectionFactory]);
    rtcModule.service("RTCObjectFactory", ["$log", NativeRTCObjectFactory]);
    rtcModule.factory("AsyncExecService", Utils.asyncExecService);
    rtcModule.service("IceCandidateBatchingSignallingService", ["AsyncExecService", "SignallingService", "IceCandidateBatchingDelay", IceCandidateBatchingSignallingService]);
    rtcModule.service("SignallingService", ["SignallingSocket", "$log", "HttpRequestService", "StorageService", SocketIOSignallingService]);
    rtcModule.service("SignallingSocket", ["SignallingServerService", "SocketFactory", "$log", "AsyncExecService", "SignallingServerSelector", RedundantSignallingSocket]);
    rtcModule.service("SignallingServerSelector", ["SignallingServerService", "StorageService", "TimingService", "SignallingServerReconnectDelay", SignallingServerSelector]);
    rtcModule.service("HttpRequestService", HttpRequestService);
    rtcModule.service("SignallingServerService", ["SignallingServers", StaticSignallingServerService]);
    rtcModule.service("SocketFactory", SocketFactory);
    rtcModule.service("TimingService", TimingService);
    rtcModule.factory("StorageService", sessionStorage);

    /**
     * Default config values
     */
    rtcModule.value("IceServers", DEFAULT_ICE_SERVERS);
    rtcModule.value("ChannelStateTimeout", DEFAULT_CHANNEL_STATE_TIMEOUT_MS);
    rtcModule.value("IceCandidateBatchingDelay", DEFAULT_BATCHING_DELAY_MS);
    rtcModule.value("SignallingServers", DEFAULT_SIGNALLING_SERVERS);
    rtcModule.value("SignallingServerReconnectDelay", DEFAULT_SIGNALLING_SERVER_RECONNECT_DELAY_MS);

    return rtcModule;
};