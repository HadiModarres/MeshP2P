const NodeController = require("./NodeController");
const constants = require("../constants");
var cyclonRtc = require('cyclon.p2p-rtc-client');

class SearchRelay extends NodeController{
    constructor(node){
        super(node);
        this.handledPacketIds = [];
        this.maximumHops = 5;
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
            let bestProxList = this.node.listManager.proxListWithClosestRefToElement(
                packet[constants.PACKET_FIELD.QUERY], packet[constants.PACKET_FIELD.LIST]);
            let randomEntries = this.node.__getRandomEntriesForList(packet[constants.PACKET_FIELD.LIST]);
            randomEntries = randomEntries.map((value => {
                return {key:value.key,value:value.pointer};
            }));
            let allEntries = bestProxList.getAllElements().concat(randomEntries);
            let sortedList = bestProxList.sortListOnProximityToElement(allEntries, {key: packet[constants.PACKET_FIELD.QUERY]});

            // let nearNodes = bestProxList.nearestNodesTo({key:packet[constants.PACKET_FIELD.QUERY]}, n);
            let nearNodes = sortedList.slice(0, 2);
            let refScore = bestProxList.proximityScoreComparedToRef(packet[constants.PACKET_FIELD.QUERY]);

            nearNodes = nearNodes.filter((value) => {
                if (value.score>refScore){
                    return true;
                }else{
                    return false;
                }
            });

            console.info("near nodes: ");
            console.info(nearNodes);
            let stats_obj = {event:constants.EVENTS.SEARCH_RELAY,id:packet[constants.PACKET_FIELD.PACKET_ID],
                source_name:this.node.name};
            this.emit("stats", stats_obj);
            // let httpReq = new cyclonRtc.HttpRequestService();
            // httpReq.get(`http://localhost:3500/stats/search_relayed?id=${packet[constants.PACKET_FIELD.PACKET_ID]}&node_name=${this.node.name}`);
            for (let node of nearNodes) {
                this.sendOutPacket(packet, node.value);
            }
            return true;
        }
    }
}

module.exports = SearchRelay;
