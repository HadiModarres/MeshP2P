const NodeController = require("./NodeController");
const constants = require("../constants");
var cyclonRtc = require('cyclon.p2p-rtc-client');

class SearchRelay extends NodeController{
    constructor(node){
        super(node);
        this.handledPacketIds = [];
        this.maximumHops = 4;
    }
    handlePacket(packet){
        console.info("testing relay");
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
        packet[constants.PACKET_FIELD.HOPS] ++;
        let n = Math.pow(2, (this.maximumHops - packet[constants.PACKET_FIELD.HOPS])) ;
        if (n===1){
            return false;
        }else {
            let elem = {
                "metadata": {
                    "clientInfo": packet[constants.PACKET_FIELD.QUERY]
                }};
            let bestProxList = this.node.neighborManager.proxListWithClosestRefToNeighbor(
                {listEntry: packet[constants.PACKET_FIELD.QUERY], list: packet[constants.PACKET_FIELD.LIST]});
            let nearNodes = bestProxList.NearestNodesTo({key:packet[constants.PACKET_FIELD.QUERY]}, n);
            let httpReq = new cyclonRtc.HttpRequestService();
            httpReq.get(`http://localhost:3000/stats/search_relayed?id=${packet[constants.PACKET_FIELD.PACKET_ID]}`);
            for (let node of nearNodes) {
                this.sendOutPacket(packet, node.value).then((value => {
                    console.info("relayed search request");
                }),(reason => {
                    console.info("couldnt relay request");
                }));
            }
        }
    }
}

module.exports = SearchRelay;
