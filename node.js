var cyclon = require('cyclon.p2p');
var cyclonRtc = require('cyclon.p2p-rtc-client');
var cyclonRtcComms = require('cyclon.p2p-rtc-comms');
var Utils = require("cyclon.p3p-common");
var ClientInfoService = require("./services/ClientInfoService");
let ProximityList = require("./proximity/ProximityList");
let stringSimilarity = require("string-similarity");
var Promise = require("bluebird");

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

class Node {
    constructor() {
        this.__initCyclonNode();
        this.__initProximityList();
    }

    __initProximityList(){
        this.proximityList = new ProximityList(6, this.__cyclonNode.createNewPointer(), (a, b) => {
            return stringSimilarity.compareTwoStrings(a["metadata"]["clientInfo"],b["metadata"]["clientInfo"]);
        });
        this.proximityList.uniqueElements((a, b) => {
            return a["id"] === b["id"];
        });
    }
    __initCyclonNode(){
        let persistentStorage = sessionStorage;
        let inMemoryStorage = Utils.newInMemoryStorage();
        let timingService = new cyclonRtc.TimingService();

//level 5
        let signallingServerService = new cyclonRtc.StaticSignallingServerService(DEFAULT_SIGNALLING_SERVERS);
        let socketFactory = new cyclonRtc.SocketFactory();
        let signallingServerSelector = new cyclonRtc.SignallingServerSelector(signallingServerService,persistentStorage,timingService,DEFAULT_SIGNALLING_SERVER_RECONNECT_DELAY_MS);


//level4
        let rtcObjectFactory = new cyclonRtc.AdapterJsRTCObjectFactory(console);
        let signallingSocket = new cyclonRtc.RedundantSignallingSocket(signallingServerService,socketFactory,console,Utils.asyncExecService(),signallingServerSelector);
        let httpRequestService = new cyclonRtc.HttpRequestService();


//level3
        let signallingService = new cyclonRtc.SocketIOSignallingService(signallingSocket,console,httpRequestService,persistentStorage);
        let peerConnectionFactory = new cyclonRtc.PeerConnectionFactory(rtcObjectFactory,console,DEFAULT_ICE_SERVERS,DEFAULT_CHANNEL_STATE_TIMEOUT_MS);



//level 2
        let iceCandidateBatchingSignalling = new cyclonRtc.IceCandidateBatchingSignallingService(Utils.asyncExecService(),
            signallingService,DEFAULT_BATCHING_DELAY_MS);
        let channelFactory = new cyclonRtc.ChannelFactory(peerConnectionFactory,iceCandidateBatchingSignalling,console);
        let shuffleStateFactory = new cyclonRtcComms.ShuffleStateFactory(console, Utils.asyncExecService());


// level 1
        let rtc = new cyclonRtc.RTC(iceCandidateBatchingSignalling,channelFactory);
        let comms = new cyclonRtcComms.WebRTCComms(rtc,shuffleStateFactory,console);
        let bootStrap = new cyclonRtcComms.SignallingServerBootstrap(signallingSocket,httpRequestService);


// level 0
        this.__cyclonNode = cyclon.builder(comms, bootStrap)
            .withNumNeighbours(5)
            .withMetadataProviders({
                    "clientInfo": cInfo,
                }
            )
            .withShuffleSize(5)
            .withTickIntervalMs(6000)
            .withStorage(persistentStorage).build();
    }

    start(){
        console.info("starting node");
        this.__cyclonNode.start();
    }

    setSearchableHeader(header){

    }
    setSearchable(bool){

    }

    attachController(controller){

    }
    getController(type){

    }

}

module.exports = Node;
