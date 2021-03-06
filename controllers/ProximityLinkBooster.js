const NodeController = require("./NodeController");
const constants = require("../constants");

class ProximityLinkBooster extends NodeController{
    constructor(node,globalList){
       super(node);
        this._globalList = globalList;
       this._startSendTimer();
    }

    /**
     *
     * @param packet
     * @return {Boolean} true if packet could be handled, false if this controller can't handle the given packet
     */
    handlePacket(packet){
        if (packet[constants.PACKET_FIELD.PACKET_TYPE] !== constants.PACKET_TYPE.PROXIMITY_LINKS ||
            packet[constants.PACKET_FIELD.LIST !== this._globalList]) {
            return false;
        }
        this.node._handlePointerSet(packet[constants.PACKET_FIELD.POINTERS]);
        let entry = {key: packet[constants.PACKET_FIELD.ENTRY], value: packet[constants.PACKET_FIELD.PACKET_SOURCE]};
        this.node.listManager.addInboundElementToList(packet[constants.PACKET_FIELD.LIST], entry);
        return true;
    }

    _startSendTimer(){
        // return;
        // console.log("sending");
        // this._sendProximityLinks();
        let proxLists = this.node.listManager.getAllProximityLists(this._globalList);
        if (proxLists) {
            let randProxList = proxLists[Math.floor(Math.random() * proxLists.length)];
            if (randProxList.list.length>1) {
                let randomProximateNodePointer = randProxList.list[Math.floor(Math.random() * randProxList.list.length)].value;
                let packet = this._createPacket(randomProximateNodePointer, randProxList);
                this.sendOutPacket(packet, randomProximateNodePointer);
            }
        }
        setTimeout(()=>{this._startSendTimer()},15000);
    }

    _createPacket(targetPointer, proxList){
        let pointers = proxList.list.map((proximityListEntry)=>{
            return proximityListEntry.value;
        });
        pointers = pointers.filter((pointer)=>{
            if (pointer !== targetPointer){
                return true;
            }
            console.log("same!");
            return false;
        });
        let packet = {};
        packet[constants.PACKET_FIELD.PACKET_TYPE] = constants.PACKET_TYPE.PROXIMITY_LINKS;
        packet[constants.PACKET_FIELD.POINTERS] = pointers;
        packet[constants.PACKET_FIELD.LIST] = this._globalList;
        packet[constants.PACKET_FIELD.ENTRY] = proxList.referenceElement.key;
        packet[constants.PACKET_FIELD.PACKET_SOURCE] = this.node.__cyclonNode.createNewPointer();
        return packet;
    }

}

module.exports = ProximityLinkBooster;