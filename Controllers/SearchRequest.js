const NodeController = require("./NodeController");
const constants = require("../constants");

class SearchRequest extends NodeController{
   constructor(node){
      super(node);

   }
   handlePacket(packet){
      if (packet[constants.PACKET_FIELD.PACKET_TYPE] !== constants.PACKET_TYPE.SEARCH_RES) {
         return false;
      }
       return true;
   }
}
