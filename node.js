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
let SearchRelay = require("./controllers/SearchRelay");
const ListManager = require("./proximity/ListManager");


const constants = require("./constants");
// let logger = {info: (msg)=>{console.info(msg)},log:()=>{},debug:()=>{},warn:()=>{},error:()=>{}};
let logger = console;
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
        this.__controllers = [];
        this.listManager = new ListManager();
        this.name = '';
        this.__initCyclonNode();
        this.__initSearchControllers();
    }

    /**
     * Register a global list on this node
     * @param list
     * @param proximityFunction (a,b)->float 0 to 1, 1 being identical and 0 least similar
     *
     */
    registerList(list,proximityFunction){
        this.listManager.addGlobalList(list, proximityFunction);
    }

    /**
     * Set the entries for the global list
     * @param list
     * @param entries
     */
    setEntries(list,entries){
        for (let entry of entries) {
            this.listManager.addEntry(list,{key:entry});
        }
    }

    /**
     * Search the global list <list> for the object <query>, searchResultCallback is called with the corresponding result
     * every time a response is received.
     *
     * @param list
     * @param query
     * @param searchResultCallback
     */
    search(list,query,searchResultCallback){

    }

    /**
     * Connects to the node determined by nodePointer and returns an rtc data channel
     * @param nodePointer
     */
    connectToNode(nodePointer){

    }

    __initSearchControllers() {
        let searchResponder = new SearchResponder(this);
        this.attachController(searchResponder);
        let searchRelay = new SearchRelay(this);
        this.attachController(searchRelay);
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
//         let rtcObjectFactory = new cyclonRtc.AdapterJsRTCObjectFactory(logger);
        let rtcObjectFactory = new cyclonRtc.NativeRTCObjectFactory(logger);
        let signallingSocket = new cyclonRtc.RedundantSignallingSocket(signallingServerService, socketFactory, logger, Utils.asyncExecService(), signallingServerSelector);
        let httpRequestService = new cyclonRtc.HttpRequestService();


//level3
        let signallingService = new cyclonRtc.SocketIOSignallingService(signallingSocket, logger, httpRequestService, persistentStorage);
        let peerConnectionFactory = new cyclonRtc.PeerConnectionFactory(rtcObjectFactory, logger, DEFAULT_ICE_SERVERS, DEFAULT_CHANNEL_STATE_TIMEOUT_MS);


//level 2
        let iceCandidateBatchingSignalling = new cyclonRtc.IceCandidateBatchingSignallingService(Utils.asyncExecService(),
            signallingService, DEFAULT_BATCHING_DELAY_MS);
        let channelFactory = new cyclonRtc.ChannelFactory(peerConnectionFactory, iceCandidateBatchingSignalling, logger);
        let shuffleStateFactory = new cyclonRtcComms.ShuffleStateFactory(logger, Utils.asyncExecService());


// level 1
        this.rtc = new cyclonRtc.RTC(iceCandidateBatchingSignalling, channelFactory);
        this.comms = new cyclonRtcComms.WebRTCComms(this.rtc, shuffleStateFactory, logger);
        this.bootStrap = new cyclonRtcComms.SignallingServerBootstrap(signallingSocket, httpRequestService);


// level 0


    }

    startNode(){
        this.__cyclonNode = cyclon.builder(this.comms, this.bootStrap)
            .withNumNeighbours(5)
            .withMetadataProviders({
                    "clientInfo": () => {
                        return this.listManager.getAllLocalEntries();
                    },
                }
            )
            .withShuffleSize(5)
            .withTickIntervalMs(20000)
            .build();

        this.__cyclonNode.on("shuffleCompleted",(direction)=>{
            console.info("shuffle completed");
        });

        this.__cyclonNode.on("shuffleError", (direction) => {
            console.error("shuffle error");
        });

        this.__cyclonNode.on("shuffleTimeout", (direction) => {
            console.error("shuffle timeout");
        });

        console.info("starting node");
        this.__cyclonNode.start();
        console.info(this.__cyclonNode.createNewPointer());
        this.__setupHandlerForNewNeighborSet();
        this.__listenForPackets();
    }

    /**
     *
     * @param nodePointers these are pointers defined in cyclon.p2p
     * @private
     */
    __extractListEntriesFromPointers(nodePointers){
       let listEntries = [];
        for (let pointer of nodePointers){
            let entries = pointer["metadata"]["clientInfo"].map((value) => {
                return {key:value.key ,list:value.list ,pointer:pointer}
            });
            listEntries.push(...entries);
        }
        return listEntries;
    }

    __getRandomEntriesForList(list){
        let randomPointers = this.getRandomSamplePointers();
        let randomEntries = this.__extractListEntriesFromPointers(randomPointers);
        return randomEntries.filter((value => {
            if (value.list === list) {
                return true;
            } else {
                return false;
            }
        }));
    }

    __setupHandlerForNewNeighborSet(){
        this.__cyclonNode.on("neighbours_updated", ()=> {
            let pointerSet = this.getRandomSamplePointers();
            let entries = this.__extractListEntriesFromPointers(pointerSet);
            this.__incorporateNeighbourList(entries);
            this.__sendNeighborsToStatsServer();
        });
    }

    __incorporateNeighbourList(neighbourList) {
        for (let neighbor of neighbourList){
            this.__removeNeighbour(neighbor);
            this.listManager.addElementToAllProximityLists(neighbor.list,
                {key:neighbor.key,value:neighbor.pointer})
        }
    }

    __removeNeighbour(neighbour){
        let filterFunc = function (elem) {
            return (neighbour.pointer.id !== elem.value.id);
        };
        this.listManager.removeAllRecordsFromAllLists(filterFunc);
    }

    __sendNeighborsToStatsServer(){

        let httpReq = new cyclonRtc.HttpRequestService();

        let proxList = this.listManager.getAllProximityLists("list#name")[0];
        let neighbors = proxList.getAllElements();
        neighbors = neighbors.map((value) => {
            return `"${value.key}"`;
        });

        let localEntry = this.listManager.getAllLocalEntries()[0].key;
        httpReq.get(`http://localhost:3500/stats/neighbors_updated?json={"id":"${localEntry}","neighbors":[${neighbors}]}`);

    }


    __listenForPackets(){
        let self =this;
        this.rtc.onChannel("search", function (data) {
            data.receive("unionp2p", 30000).then((message) => {
                console.info("data received!");
                console.info(message);
                self.__handleReceivedPacket(message.data);
                data.close();
                self.__listenForPackets();
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
        let httpReq = new cyclonRtc.HttpRequestService();
        httpReq.get(`http://localhost:3500/stats/search_discarded?id=${packet[constants.PACKET_FIELD.PACKET_ID]}&node_name=${this.name}`);
    }

    /**
     *
     * @param obj
     * @param {uuid} targetNodeId
     */
    sendObjectToNode(obj, targetNodePointer) {
        // let targetPointer = this.__getNodePointerForNodeUUID(targetNodeId);
        // if (!targetPointer)
        //     throw new Error(`pointer with id ${targetNodeId} doesnt exist`);
        this.rtc.openChannel("search", targetNodePointer).then((channel) => {
            // console.info(channel);
            console.error("before send");
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
        console.info(id);
        return undefined;
    }


    attachController(controller) {
        this.__controllers.push(controller);
    }

    getRandomSamplePointers(){
        return Object.values(this.__cyclonNode.getNeighbourSet().getContents());
    }
    getRandomSampleIds(){
        return Object.values(this.__cyclonNode.getNeighbourSet().getContents()).map((value => {
            return value.id;
        }));
    }
    getId() {
        return this.__cyclonNode.getId();
    }

}

module.exports = Node;
