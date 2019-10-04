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
let StatsRecorder = require("./stats/HTTPStatsRecorder");
var EventEmitter = require("events").EventEmitter;
let NodeStatsProbe = require("./stats/NodeStatsProbe");
let ProximityLinkChangePrope = require("./stats/ProximityLinkChangeProbe");
let NodeConfig = require("./config");
const constants = require("./constants");

let logger = console;

class Node extends EventEmitter{
    constructor() {
        super();
        this.__controllers = [];
        this.listManager = new ListManager();
        this.name = '';
        this.statsRecorder = new StatsRecorder();
        this.__initCyclonNode();
        this.statsProbe= new NodeStatsProbe(this,4000);
        this.linkChangeProbe = new ProximityLinkChangePrope(this);
        this.__initSearchControllers();
        this.__addEventListeners();
    }

    __addEventListeners(){
        for (let c of this.__controllers) {
            this.statsRecorder.addEventEmitter(c);
        }
        this.statsRecorder.addEventEmitter(this);
        this.statsRecorder.addEventEmitter(this.statsProbe);
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
        let signallingServerService = new cyclonRtc.StaticSignallingServerService(NodeConfig.DEFAULT_SIGNALLING_SERVERS);
        let socketFactory = new cyclonRtc.SocketFactory();
        let signallingServerSelector = new cyclonRtc.SignallingServerSelector(signallingServerService, persistentStorage, timingService, NodeConfig.DEFAULT_SIGNALLING_SERVER_RECONNECT_DELAY_MS);


//level4
//         let rtcObjectFactory = new cyclonRtc.AdapterJsRTCObjectFactory(logger);
        let rtcObjectFactory = new cyclonRtc.NativeRTCObjectFactory(logger);
        let signallingSocket = new cyclonRtc.RedundantSignallingSocket(signallingServerService, socketFactory, logger, Utils.asyncExecService(), signallingServerSelector);
        let httpRequestService = new cyclonRtc.HttpRequestService();


//level3
        let signallingService = new cyclonRtc.SocketIOSignallingService(signallingSocket, logger, httpRequestService, persistentStorage);
        let peerConnectionFactory = new cyclonRtc.PeerConnectionFactory(rtcObjectFactory, logger, NodeConfig.DEFAULT_ICE_SERVERS, NodeConfig.DEFAULT_CHANNEL_STATE_TIMEOUT_MS);


//level 2
        let iceCandidateBatchingSignalling = new cyclonRtc.IceCandidateBatchingSignallingService(Utils.asyncExecService(),
            signallingService, NodeConfig.DEFAULT_BATCHING_DELAY_MS);
        let channelFactory = new cyclonRtc.ChannelFactory(peerConnectionFactory, iceCandidateBatchingSignalling, logger,NodeConfig.DEFAULT_CHANNEL_STATE_TIMEOUT_MS);
        let shuffleStateFactory = new cyclonRtcComms.ShuffleStateFactory(logger, Utils.asyncExecService());


// level 1
        this.rtc = new cyclonRtc.RTC(iceCandidateBatchingSignalling, channelFactory);
        this.comms = new cyclonRtcComms.WebRTCComms(this.rtc, shuffleStateFactory, logger);
        this.bootStrap = new cyclonRtcComms.SignallingServerBootstrap(signallingSocket, httpRequestService);


// level 0

        this.__cyclonNode = cyclon.builder(this.comms, this.bootStrap)
            .withNumNeighbours(NodeConfig.NEIGHBOR_SIZE)
            .withMetadataProviders({
                    "clientInfo": () => {
                        return this.listManager.getAllLocalEntries();
                    },
                }
            )
            .withShuffleSize(NodeConfig.SHUFFLE_SIZE)
            .withTickIntervalMs(NodeConfig.TICK_INTERVAL)
            .build();


    }

    startNode(){
        // this.__cyclonNode.on("shuffleCompleted",(direction)=>{
        //     console.info("shuffle completed");
        // });

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

    __extractNodeIdsFromPointers(nodePointers){
        let nodeIds = [];
        for (let pointer of nodePointers){
            if (!nodeIds.includes(pointer.id)){
                nodeIds.push(pointer.id);
            }
        }
        return nodeIds;
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
        this.__cyclonNode.on("shuffleCompleted", (direction,pointer)=> {
            console.info("handling shuffle complete: ");
            console.info(direction);
            console.info(NodeConfig.NEIGHBOR_SIZE);
            let namesProxList = this.listManager.getAllProximityLists("list#name")[0];
            let beforeKeys = namesProxList.getAllElements().map((value) => {
                return value.key;
            });
            let pointerSet = this.getRandomSamplePointers();
            let entries = this.__extractListEntriesFromPointers(pointerSet);
            let nodeIds = this.__extractNodeIdsFromPointers(pointerSet);
            for (let nodeId of nodeIds){
                this.__removeNeighbour({pointer: {id: nodeId}});
            }
            this.__incorporateNeighbourList(entries);
            console.log(JSON.stringify(entries));
            this.__sendNeighborsToStatsServer();
            let afterKeys = namesProxList.getAllElements().map((value) => {
                return value.key;
            });
            this.emit("neighbors_updated",beforeKeys,afterKeys);
        });
    }



    __incorporateNeighbourList(neighbourList) {
        for (let neighbor of neighbourList){
            let changed = this.listManager.addElementToAllProximityLists(neighbor.list,
                {key:neighbor.key,value:neighbor.pointer});
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

        // let localEntry = this.listManager.getAllLocalEntries()[0].key;
        // httpReq.get(`http://localhost:3500/stats/neighbors_updated?json={"id":"${localEntry}","neighbors":[${neighbors}]}`);
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
        let stats_obj = {event:constants.EVENTS.SEARCH_DISCARDED,id:packet[constants.PACKET_FIELD.PACKET_ID],source_name:this.name};
        this.emit("stats", stats_obj);
        // let httpReq = new cyclonRtc.HttpRequestService();
        // httpReq.get(`http://localhost:3500/stats/search_discarded?id=${packet[constants.PACKET_FIELD.PACKET_ID]}&node_name=${this.name}`);
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
