class NodeController {
    constructor(node) {
        this.node = node;
    }

    /**
     *
     * @param packet
     * @return {Boolean} true if packet could be handled, false if this controller can't handle the given packet
     */
    handlePacket(packet){
        // override in subclass
        throw new Error("should handle in subclass");
    }

    /**
     *
     * @param packet
     *
     */
    sendOutPacket(packet,targetNode){
        packet["date"] = new Date().getDate();
        this.node.sendObjectToNode(packet, targetNode);
    }


}

module.exports = NodeController;
