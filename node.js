var cyclon = require('cyclon.p2p');
var cyclonRtc = require('cyclon.p2p-rtc-client');
var cyclonRtcComms = require('cyclon.p2p-rtc-comms');
var Utils = require("cyclon.p2p-common");
var ClientInfoService = require("./services/ClientInfoService");
let ProximityList = require("./proximity/ProximityList");
let stringSimilarity = require("string-similarity");
var Promise = require("bluebird");
let SearchRequest = require("./controllers/SearchRequest");
let SearchResponder = require("./controllers/SearchResponder");

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
        this.header = "N/A";
        this.__controllers = [];
        this.__initCyclonNode();
        this.__initProximityList();
        this.__initSearchControllers();
    }

    __initSearchControllers() {
        let searchResponder = new SearchResponder(this);
        this.attachController(searchResponder);
    }

    __initProximityList() {
        this.proximityList = new ProximityList(6, this.__cyclonNode.createNewPointer(), (a, b) => {
            return stringSimilarity.compareTwoStrings(a["metadata"]["clientInfo"], b["metadata"]["clientInfo"]);
        });
        this.proximityList.uniqueElements((a, b) => {
            return a["id"] === b["id"];
        });
    }

    __initCyclonNode() {
        let self = this;
        let persistentStorage = sessionStorage;
        let inMemoryStorage = Utils.newInMemoryStorage();
        let timingService = new cyclonRtc.TimingService();

//level 5
        let signallingServerService = new cyclonRtc.StaticSignallingServerService(DEFAULT_SIGNALLING_SERVERS);
        let socketFactory = new cyclonRtc.SocketFactory();
        let signallingServerSelector = new cyclonRtc.SignallingServerSelector(signallingServerService, persistentStorage, timingService, DEFAULT_SIGNALLING_SERVER_RECONNECT_DELAY_MS);


//level4
        let rtcObjectFactory = new cyclonRtc.AdapterJsRTCObjectFactory(console);
        let signallingSocket = new cyclonRtc.RedundantSignallingSocket(signallingServerService, socketFactory, console, Utils.asyncExecService(), signallingServerSelector);
        let httpRequestService = new cyclonRtc.HttpRequestService();


//level3
        let signallingService = new cyclonRtc.SocketIOSignallingService(signallingSocket, console, httpRequestService, persistentStorage);
        let peerConnectionFactory = new cyclonRtc.PeerConnectionFactory(rtcObjectFactory, console, DEFAULT_ICE_SERVERS, DEFAULT_CHANNEL_STATE_TIMEOUT_MS);


//level 2
        let iceCandidateBatchingSignalling = new cyclonRtc.IceCandidateBatchingSignallingService(Utils.asyncExecService(),
            signallingService, DEFAULT_BATCHING_DELAY_MS);
        let channelFactory = new cyclonRtc.ChannelFactory(peerConnectionFactory, iceCandidateBatchingSignalling, console);
        let shuffleStateFactory = new cyclonRtcComms.ShuffleStateFactory(console, Utils.asyncExecService());


// level 1
        this.rtc = new cyclonRtc.RTC(iceCandidateBatchingSignalling, channelFactory);
        let comms = new cyclonRtcComms.WebRTCComms(this.rtc, shuffleStateFactory, console);
        let bootStrap = new cyclonRtcComms.SignallingServerBootstrap(signallingSocket, httpRequestService);


// level 0
        this.__cyclonNode = cyclon.builder(comms, bootStrap)
            .withNumNeighbours(5)
            .withMetadataProviders({
                    "clientInfo": () => {
                        return self.header
                    },
                }
            )
            .withShuffleSize(5)
            .withTickIntervalMs(20000)
            .withStorage(persistentStorage).build();

        // this.__cyclonNode.on("neighbours_updated", function () {
        //     let set = self.__cyclonNode.getNeighbourSet().getContents();
        //     self.proximityList.addElements(Object.values(set));
        // });
        console.info("starting node");
        this.__cyclonNode.start();


        this.rtc.onChannel("search", function (data) {
            data.receive("unionp2p", 30000).then((message) => {
                console.info("data received!");
                console.info(message);
                self.__handleReceivedPacket(message.data);
            });
        });
    }

    __handleReceivedPacket(packet) {
        console.log(this.__controllers.length);
        for (let controller of this.__controllers) {
            console.info("testing controller");
            if (controller.handlePacket(packet))
                return;
        }
    }

    /**
     *
     * @param obj
     * @param {uuid} targetNodeId
     */
    sendObjectToNode(obj, targetNodeId) {
        let targetPointer = this.__getNodePointerForNodeUUID(targetNodeId);
        if (!targetPointer)
            throw new Error(`pointer with id ${targetNodeId} doesnt exist`);
        this.rtc.openChannel("search", targetPointer).then((channel) => {
            // console.info(channel);
                channel.send("unionp2p", {
                    data: obj
                });
        });
    }

    __getNodePointerForNodeUUID(id) {
        for (let pointer of this.proximityList.getAllElements()) {
            if (pointer["id"] === id) {
                return pointer;
            }
        }
        return undefined;
    }

    setSearchableHeader(header) {
        this.header = header;
    }

    setSearchable(bool) {

    }

    attachController(controller) {
        this.__controllers.push(controller);
    }

    detachController(controller) {

    }

    getController(type) {

    }

    getNeighbourIds() {
        // return this.proximityList.getAllElements().map((value) => {
        //     return value.id;
        // });
        return this.__cyclonNode.getNeighbourSet().getContents();
    }

    getId() {
        return this.__cyclonNode.getId();
    }


}

module.exports = Node;
