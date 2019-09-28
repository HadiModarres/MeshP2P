const NodeController = require("./NodeController");
var cyclonRtc = require('cyclon.p2p-rtc-client');
const constants = require("../constants");

class SearchResponder extends NodeController{
    constructor(node){
        super(node);
        this.handledPacketIds = [];
    }
    handlePacket(packet){
        console.info("testing responder");
        if (packet[constants.PACKET_FIELD.PACKET_TYPE] !== constants.PACKET_TYPE.SEARCH_REQ) {
            return false;
        }
        if (this.handledPacketIds.includes(packet[constants.PACKET_FIELD.PACKET_ID])) {
            let stats_obj = {event:constants.EVENTS.SEARCH_REVISITED,id:packet[constants.PACKET_FIELD.PACKET_ID],source_name:this.node.name};
            this.emit("stats", stats_obj);
            // let httpReq = new cyclonRtc.HttpRequestService();
            // httpReq.get(`http://localhost:3500/stats/search_revisited?id=${packet[constants.PACKET_FIELD.PACKET_ID]}&node_name=${this.node.name}`);
            return false;
        }else{
            if (this.handledPacketIds.length>200){
                this.handledPacketIds = [];
            }
            this.handledPacketIds.push(packet[constants.PACKET_FIELD.PACKET_ID]);
        }

        let response = this.__responseForPacket(packet);
        if (!response){
            return false;
        }

        this.__sendResponseFor(packet,response);

        let stats_obj = {event:constants.EVENTS.SEARCH_RESPOND,id:packet[constants.PACKET_FIELD.PACKET_ID],source_name:this.node.name};
        this.emit("stats", stats_obj);
        // let httpReq = new cyclonRtc.HttpRequestService();
        // httpReq.get(`http://localhost:3500/stats/search_responded?id=${packet[constants.PACKET_FIELD.PACKET_ID]}&node_name=${this.node.name}`);
        return true;
    }

    __responseForPacket(packet){
        let proxLists = this.node.listManager.getAllProximityLists(packet[constants.PACKET_FIELD.LIST]);
        for (let proxList of proxLists){
            let match = proxList.perfectMatchForElement(packet[constants.PACKET_FIELD.QUERY]);
            if(match){
                return match;
            }
        }
        return undefined;
    }

    __sendResponseFor(packet,responseBody){
        console.info("search responder: handling packet");
        let response = {};
        response[constants.PACKET_FIELD.PACKET_ID] = packet[constants.PACKET_FIELD.PACKET_ID];
        response[constants.PACKET_FIELD.PACKET_TYPE] = constants.PACKET_TYPE.SEARCH_RES;
        response[constants.PACKET_FIELD.BODY] = responseBody;
        this.node.sendObjectToNode(response,packet[constants.PACKET_FIELD.PACKET_SOURCE]);
    }
}


module.exports = SearchResponder;
