var cyclon = require('cyclon.p2p');
var cyclonRtc = require('cyclon.p2p-rtc-client');
var cyclonRtcComms = require('cyclon.p2p-rtc-comms');
var Utils = require("cyclon.p2p-common");
var ClientInfoService = require("./services/ClientInfoService");

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
    }
];
var DEFAULT_ICE_SERVERS = [
    // The public Google STUN server
    {urls: ['stun:stun.l.google.com:19302']},
];
var DEFAULT_CHANNEL_STATE_TIMEOUT_MS = 30000;
var DEFAULT_SIGNALLING_SERVER_RECONNECT_DELAY_MS = 5000;

let persistentStorage = sessionStorage;
let inMemoryStorage = Utils.newInMemoryStorage();
let timingService = new cyclonRtc.TimingService();

//level 5
let signallingServerService = new cyclonRtc.StaticSignallingServerService(DEFAULT_SIGNALLING_SERVERS);
let socketFactory = new cyclonRtc.SocketFactory();
let signallingServerSelector = new cyclonRtc.SignallingServerSelector(signallingServerService,persistentStorage,timingService,DEFAULT_SIGNALLING_SERVER_RECONNECT_DELAY_MS);


//level4
let rtcObjectFactory = new cyclonRtc.AdapterJsRTCObjectFactory(logger);
let signallingSocket = new cyclonRtc.RedundantSignallingSocket(signallingServerService,socketFactory,logger,Utils.asyncExecService(),signallingServerSelector);
let httpRequestService = new cyclonRtc.HttpRequestService();


//level3
let signallingService = new cyclonRtc.SocketIOSignallingService(signallingSocket,logger,httpRequestService,persistentStorage);
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
let cyclonNode = cyclon.builder(comms, bootStrap).withNumNeighbours(5).withShuffleSize(5).withStorage(persistentStorage).build();

console.log("starting node");
cyclonNode.start();

// let clientInfoService = new ClientInfoService(persistentStorage);
let neighbourSet = cyclonNode.getNeighbourSet();
cyclonNode.on("neighbours_updated", function () {
    let set = cyclonNode.getNeighbourSet().getContents();
    document.getElementById("neighbors_previous").innerText = '' + document.getElementById("neighbors_current").innerText;
    document.getElementById("neighbors_current").innerText = (Object.getOwnPropertyNames(set)).sort().join("\n");
});
    neighbourSet.on("change", function (change) {
        console.warn("Changed!!: "+change);
    });
//
// setupNeighbourCacheSessionPersistence(neighbourSet);
//
// function setupNeighbourCacheSessionPersistence(neighbourSet) {
//     let storedNeighbourCache = clientInfoService.getStoredNeighbourCache();
//     if (storedNeighbourCache) {
//         for (let nodeId in storedNeighbourCache) {
//             neighbourSet.insert(storedNeighbourCache[nodeId]);
//         }
//     }
//
//     neighbourSet.on("change", function (change) {
//         console.warn("Changed!!: "+change);
//         clientInfoService.setStoredNeighbourCache(neighbourSet.getContents());
//     });
// }

global.neighbors = function () {
    return ;
    let set = cyclonNode.getNeighbourSet().getContents();
    let ids = [];
    // for (let key of set.getOwnPropertyNames()){
    //     ids.push(key);
    // }
    document.getElementById("neighbors").innerText = (Object.getOwnPropertyNames(set)).join("<br>");
};












