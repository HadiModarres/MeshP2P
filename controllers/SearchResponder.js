const NodeController = require("./NodeController");
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

        return true;
    }

    __responseForPacket(packet){
        let elem = {
            "metadata": {
                "clientInfo": packet[constants.PACKET_FIELD.QUERY]
            }};
        let match = this.node.proximityList.perfectMatchForElement(elem);
        if (!match){
            return undefined;
        }else{
            return match["metadata"]["clientInfo"];
        }
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
