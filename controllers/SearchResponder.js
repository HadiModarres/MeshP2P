const NodeController = require("./NodeController");
const constants = require("../constants");

class SearchResponder extends NodeController{
    constructor(node){
        super(node);
    }
    handlePacket(packet){
        if (packet[constants.PACKET_FIELD.PACKET_TYPE] !== constants.PACKET_TYPE.SEARCH_REQ) {
            return false;
        }
        let response = {};
        response[constants.PACKET_FIELD.PACKET_ID] = packet[constants.PACKET_FIELD.PACKET_ID];
        response[constants.PACKET_TYPE] = constants.PACKET_TYPE.SEARCH_RES;
        response["content"] = "hello :)";
        this.sendOutPacket(packet).then((value => {
            console.info("sent out search response packet");
        }),(reason => {
            console.error("search response send faild:" + reason);
        }));
        return true;
    }
}
