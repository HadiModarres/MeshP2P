const NodeController = require("./NodeController");
const constants = require("../constants");
const uuid = require("uuid/v4");

class SearchRequest extends NodeController{
   constructor(node,searchTerm){
      super(node);
      this.searchTerm = searchTerm;
      this.id = uuid();
      this.node = node;
   }

   initiateSearch(){
      let neighborIds = this.node.getNeighborIds();
      let packet = {};
      packet[constants.PACKET_FIELD.PACKET_ID] = this.id;
      packet[constants.PACKET_FIELD.PACKET_SOURCE] = this.node.getId();
      packet[constants.PACKET_FIELD.PACKET_TYPE] = constants.PACKET_TYPE.SEARCH_REQ;
      packet[constants.PACKET_FIELD.QUERY]= this.searchTerm;
      for(let neighborId of neighborIds){
         this.sendOutPacket(packet, neighborId);
      }
   }

   handlePacket(packet){
      if (packet[constants.PACKET_FIELD.PACKET_TYPE] !== constants.PACKET_TYPE.SEARCH_RES)
         return false;
      if (this.id !== packet[constants.PACKET_FIELD.PACKET_ID])
         return false;
      console.info("received response for request: " + this.id +" response from: "+packet[constants.PACKET_FIELD.PACKET_SOURCE]);
      return true;
   }
}

module.exports = SearchRequest;
