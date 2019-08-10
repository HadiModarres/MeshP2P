var cyclon = require('cyclon.p2p');
var cyclonRtc = require('cyclon.p2p-rtc-client');
var cyclonRtcComms = require('cyclon.p2p-rtc-comms');
var Utils = require("cyclon.p2p-common");


let logger = {
    info : function (message) {
        console.info("info: " + message);
    },
    error :  function (message) {
        console.error("error: " + message);
    },
    warn :  function (message) {
        console.warn("warning: " + message);
    },
    debug :  function (message) {
        console.debug("debug: " + message);
    },
};



var DEFAULT_BATCHING_DELAY_MS = 300;
var DEFAULT_SIGNALLING_SERVERS = [
    {
        "socket": {
            "server": "http://localhost:12345"
        },
        "signallingApiBase": "http://localhost:12345"
    },
    {
        "socket": {
            "server": "http://localhost:12346"
        },
        "signallingApiBase": "http://localhost:12346"
    },
    // {
    //     "socket": {
    //         "server": "http://localhost:12347"
    //     },
    //     "signallingApiBase": "http://localhost:12347"
    // }
];
var DEFAULT_ICE_SERVERS = [
    // The public Google STUN server
    {urls: ['stun:stun.l.google.com:19302']},
];
var DEFAULT_CHANNEL_STATE_TIMEOUT_MS = 30000;
var DEFAULT_SIGNALLING_SERVER_RECONNECT_DELAY_MS = 5000;


let timingService = new cyclonRtc.TimingService();

//level 5
let signallingServerService = new cyclonRtc.StaticSignallingServerService(DEFAULT_SIGNALLING_SERVERS);
let socketFactory = new cyclonRtc.SocketFactory();
let signallingServerSelector = new cyclonRtc.SignallingServerSelector(signallingServerService,sessionStorage,timingService,DEFAULT_SIGNALLING_SERVER_RECONNECT_DELAY_MS);


//level4
let rtcObjectFactory = new cyclonRtc.AdapterJsRTCObjectFactory(logger);
let signallingSocket = new cyclonRtc.RedundantSignallingSocket(signallingServerService,socketFactory,logger,Utils.asyncExecService(),signallingServerSelector);
let httpRequestService = new cyclonRtc.HttpRequestService();


//level3
let signallingService = new cyclonRtc.SocketIOSignallingService(signallingSocket,logger,httpRequestService,sessionStorage);
let peerConnectionFactory = new cyclonRtc.PeerConnectionFactory(rtcObjectFactory,logger,DEFAULT_ICE_SERVERS,DEFAULT_CHANNEL_STATE_TIMEOUT_MS);



//level 2
let iceCandidateBatchingSignalling = new cyclonRtc.IceCandidateBatchingSignallingService(Utils.asyncExecService(),
    signallingService,DEFAULT_BATCHING_DELAY_MS);
let channelFactory = new cyclonRtc.ChannelFactory(peerConnectionFactory,iceCandidateBatchingSignalling,logger);
let shuffleStateFactory = new cyclonRtcComms.ShuffleStateFactory(logger, Utils.asyncExecService());


// level 1
let rtc = new cyclonRtc.RTC(iceCandidateBatchingSignalling,channelFactory);
let comms = new cyclonRtcComms.WebRTCComms(rtc,shuffleStateFactory,logger);
let bootStrap = new cyclonRtcComms.SignallingServerBootstrap(signallingSocket,httpRequestService);


// level 0
let cyclonNode = cyclon.builder(comms, bootStrap).build();
console.log("starting node");
cyclonNode.start();









