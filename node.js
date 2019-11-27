var cyclon = require('cyclon.p2p');
var cyclonRtc = require('cyclon.p2p-rtc-client');
var cyclonRtcComms = require('cyclon.p2p-rtc-comms');
var Utils = require("cyclon.p2p-common");
let SearchResponder = require("./controllers/SearchResponder");
let SearchRelay = require("./controllers/SearchRelay");
let SearchRequest = require("./controllers/SearchRequest");
const ListManager = require("./proximity/ListManager");
let StatsRecorder = require("./stats/HTTPStatsRecorder");
var EventEmitter = require("events").EventEmitter;
let NodeStatsProbe = require("./stats/NodeStatsProbe");
let ProximityLinkChangePrope = require("./stats/ProximityLinkChangeProbe");
const constants = require("./constants");
let ProximityLinkBooster = require("./controllers/ProximityLinkBooster");

let logger = console;

class Node extends EventEmitter{
    constructor(inboundConnectionCallback,
        {
            NEIGHBOR_SIZE= 7,
            SHUFFLE_SIZE= 3,
            TICK_INTERVAL= 20000,
            DEFAULT_SIGNALLING_SERVERS= [
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
            ],
            DEFAULT_BATCHING_DELAY_MS= 300,
            DEFAULT_ICE_SERVERS= [
                // The public Google STUN server
                {urls: ['stun:stun.l.google.com:19302']},
            ],
            DEFAULT_CHANNEL_STATE_TIMEOUT_MS= 30000,
            DEFAULT_SIGNALLING_SERVER_RECONNECT_DELAY_MS= 5000,
            ANALYTICS= true
        }
    ) {
        super();
        this.inboundCb = inboundConnectionCallback;

        this._config = {};
        //how to do following assignments in one statement?
        this._config.NEIGHBOR_SIZE= NEIGHBOR_SIZE;
        this._config.SHUFFLE_SIZE= SHUFFLE_SIZE;
        this._config.TICK_INTERVAL= TICK_INTERVAL;
        this._config.DEFAULT_SIGNALLING_SERVERS= DEFAULT_SIGNALLING_SERVERS;
        this._config.DEFAULT_BATCHING_DELAY_MS= DEFAULT_BATCHING_DELAY_MS;
        this._config.DEFAULT_ICE_SERVERS= DEFAULT_ICE_SERVERS;
        this._config.DEFAULT_CHANNEL_STATE_TIMEOUT_MS= DEFAULT_CHANNEL_STATE_TIMEOUT_MS;
        this._config.DEFAULT_SIGNALLING_SERVER_RECONNECT_DELAY_MS= DEFAULT_SIGNALLING_SERVER_RECONNECT_DELAY_MS;
        this._config.ANALYTICS = ANALYTICS;

        this.__controllers = [];
        this.listManager = new ListManager();
        this.name = '';
        this.__initCyclonNode();
        this.__initSearchControllers();
        this.proximityLinkBooster = new ProximityLinkBooster(this,"list#name");
        this.__controllers.push(this.proximityLinkBooster);
        if (this._config.ANALYTICS) {
            this.statsRecorder = new StatsRecorder();
            this.statsProbe = new NodeStatsProbe(this, 4000);
            this.linkChangeProbe = new ProximityLinkChangePrope(this);
            this.__addEventListeners();
        }

        this.__setupConnectionListener();
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
     * @param timeout seconds after search request expires
     * @param searchResultCallback
     */
    search(list,query,timeout=60,searchResultCallback){
        let searchRequest = new SearchRequest(this, query,list);
        searchRequest.on("search_result", (packet) => {
            searchResultCallback(packet.body);
        });
        this.attachController(searchRequest);
        setTimeout(() => {
            this._removeController(searchRequest);
        }, timeout * 1000);
        if (this._config.ANALYTICS) {
            this.statsRecorder.addEventEmitter(searchRequest);
        }
        searchRequest.initiateSearch();
    }

    /**
     * Connects to the node specified by nodePointer and returns an rtc data channel
     * @param nodePointer
     */
    async connectToNode(nodePointer){
        let channel = await this.rtc.openChannel("data", nodePointer);
        return channel.rtcDataChannel;
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
        this.__setupHandlerForNewRandomNeighborSet();
        this.__listenForPackets();
    }


    __setupConnectionListener(){
        let self = this;
        this.rtc.onChannel("data", function (data) {
            self.inboundCb(data.rtcDataChannel);
        });
    }

    __addEventListeners(){
        for (let c of this.__controllers) {
            this.statsRecorder.addEventEmitter(c);
        }

        this.statsRecorder.addEventEmitter(this);
        this.statsRecorder.addEventEmitter(this.statsProbe);
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
        let signallingServerService = new cyclonRtc.StaticSignallingServerService(this._config.DEFAULT_SIGNALLING_SERVERS);
        let socketFactory = new cyclonRtc.SocketFactory();
        let signallingServerSelector = new cyclonRtc.SignallingServerSelector(signallingServerService, persistentStorage, timingService, this._config.DEFAULT_SIGNALLING_SERVER_RECONNECT_DELAY_MS);


//level4
//         let rtcObjectFactory = new cyclonRtc.AdapterJsRTCObjectFactory(logger);
        let rtcObjectFactory = new cyclonRtc.NativeRTCObjectFactory(logger);
        let signallingSocket = new cyclonRtc.RedundantSignallingSocket(signallingServerService, socketFactory, logger, Utils.asyncExecService(), signallingServerSelector);
        let httpRequestService = new cyclonRtc.HttpRequestService();


//level3
        let signallingService = new cyclonRtc.SocketIOSignallingService(signallingSocket, logger, httpRequestService, persistentStorage);
        let peerConnectionFactory = new cyclonRtc.PeerConnectionFactory(rtcObjectFactory, logger, this._config.DEFAULT_ICE_SERVERS, this._config.DEFAULT_CHANNEL_STATE_TIMEOUT_MS);


//level 2
        let iceCandidateBatchingSignalling = new cyclonRtc.IceCandidateBatchingSignallingService(Utils.asyncExecService(),
            signallingService, this._config.DEFAULT_BATCHING_DELAY_MS);
        let channelFactory = new cyclonRtc.ChannelFactory(peerConnectionFactory, iceCandidateBatchingSignalling, logger,this._config.DEFAULT_CHANNEL_STATE_TIMEOUT_MS);
        let shuffleStateFactory = new cyclonRtcComms.ShuffleStateFactory(logger, Utils.asyncExecService());


// level 1
        this.rtc = new cyclonRtc.RTC(iceCandidateBatchingSignalling, channelFactory);
        this.comms = new cyclonRtcComms.WebRTCComms(this.rtc, shuffleStateFactory, logger,["meshp2p"]);
        this.bootStrap = new cyclonRtcComms.SignallingServerBootstrap(signallingSocket, httpRequestService,["meshp2p"]);


// level 0

        this.__cyclonNode = cyclon.builder(this.comms, this.bootStrap)
            .withNumNeighbours(this._config.NEIGHBOR_SIZE)
            .withMetadataProviders({
                    "clientInfo": () => {
                        return this.listManager.getAllLocalEntries();
                    },
                }
            )
            .withShuffleSize(this._config.SHUFFLE_SIZE)
            .withTickIntervalMs(this._config.TICK_INTERVAL)
            .build();


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

    __setupHandlerForNewRandomNeighborSet(){
        this.__cyclonNode.on("shuffleCompleted", (direction,pointer)=> {
            console.info(`${direction} shuffle complete. ${JSON.stringify(pointer)}`);
            let namesProxList = this.listManager.getAllProximityLists("list#name")[0];
            let beforeKeys = namesProxList.getAllElements().map((value) => {
                return value.key;
            });
            let pointerSet = this.getRandomSamplePointers();
            this._handlePointerSet(pointerSet);
            this.__sendNeighborsToStatsServer();
            let afterKeys = namesProxList.getAllElements().map((value) => {
                return value.key;
            });
            this.emit("neighbors_updated",beforeKeys,afterKeys);
        });
    }

    _handlePointerSet(pointerSet){
        let entries = this.__extractListEntriesFromPointers(pointerSet);
        let nodeIds = this.__extractNodeIdsFromPointers(pointerSet);
        for (let nodeId of nodeIds){
            this.__removeNeighbour({pointer: {id: nodeId}});
        }
        this.__incorporateNeighbourList(entries);
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
        console.error(packet[constants.PACKET_FIELD.PACKET_TYPE]);
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

    _removeController(controller){
        console.log("removing search request controller");
        this.__controllers = this.__controllers.filter((value => {
            return value !== controller;
        }));
    }

    getRandomSamplePointers(){
        return this.__cyclonNode.getNeighbourSet().getContents().values();
    }
    getRandomSampleIds(){
        return this.__cyclonNode.getNeighbourSet().getContents().keys();
        // return Object.values(this.__cyclonNode.getNeighbourSet().getContents()).map((value => {
        //     return value.id;
        // }));
    }
    getId() {
        return this.__cyclonNode.getId();
    }

}

module.exports = Node;
