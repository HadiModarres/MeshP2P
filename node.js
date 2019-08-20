var cyclon = require('cyclon.p2p');
var cyclonRtc = require('cyclon.p2p-rtc-client');
var cyclonRtcComms = require('cyclon.p2p-rtc-comms');
var Utils = require("cyclon.p2p-common");
var ClientInfoService = require("./services/ClientInfoService");
let ProximityList = require("./proximity/ProximityList");
let stringSimilarity = require("string-similarity");
let faker = require("faker");
var Promise = require("bluebird");




let name = faker.name.firstName("male");
let cInfo = function () {
    return name;
};

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
let cyclonNode = cyclon.builder(comms, bootStrap)
    .withNumNeighbours(5)
    .withMetadataProviders({
            "clientInfo": cInfo,
        }
    )
    .withShuffleSize(5)
    .withTickIntervalMs(6000)
    .withStorage(persistentStorage).build();

console.log("starting node");
cyclonNode.start();




let proximityList = new ProximityList(6, cyclonNode.createNewPointer(), (a, b) => {
    return stringSimilarity.compareTwoStrings(a["metadata"]["clientInfo"],b["metadata"]["clientInfo"]);
});
proximityList.uniqueElements((a, b) => {
    return a["id"] === b["id"];
});

// let proximityList = new ProximityList(5, {index: cyclonNode.getId()}, (a, b) => {
//     return stringSimilarity.compareTwoStrings(a.id, b.id);
// });


// let clientInfoService = new ClientInfoService(persistentStorage);
let neighbourSet = cyclonNode.getNeighbourSet();

let currWindow = [];
cyclonNode.on("neighbours_updated", function () {
    let set = cyclonNode.getNeighbourSet().getContents();
    proximityList.addElements(Object.values(set));
    let proximityInfo = proximityList.getAllElements().map((value) => {
        return "name: " + value["metadata"]["clientInfo"];
    });
    if (document.getElementById("new_name").value !== ""){
        name = document.getElementById("new_name").value;
    }
    document.getElementById("names").innerText = proximityInfo.join("\n");
    console.info("proximity list:" + JSON.stringify(proximityInfo));
    // console.info("neighbors: "+JSON.stringify(Object.values(set)));
    document.getElementById("neighbors_previous").innerText = currWindow.sort().join("\n");
    let newWindow =  (Object.getOwnPropertyNames(set));
    let taggedWindow = [];
    for (let id of newWindow){
        if (currWindow.includes(id)) {
            taggedWindow.push(id + " *");
        }else{
            taggedWindow.push(id);
        }
    }
    currWindow = newWindow;
    document.getElementById("neighbors_current").innerText = taggedWindow.sort().join("\n");
    document.getElementById("id").innerText = cyclonNode.getId();
    document.getElementById("name").innerText = name;
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

global.runTest = function () {
    console.info("running test");
    rtc.openChannel("data", proximityList.getMostSimilarElement()).then((channel) => {
        console.info(channel);
        channel.send("data_type", "data!");
    });
};

rtc.onChannel("data", function (data) {
    data.receive("data_type",10000).then((message)=>{
        console.info(message);
    });
});












