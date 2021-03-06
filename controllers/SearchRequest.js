const NodeController = require("./NodeController");
const constants = require("../constants");
const uuid = require("uuid/v4");
var cyclonRtc = require('cyclon.p2p-rtc-client');


class SearchRequest extends NodeController{
   constructor(node,searchTerm,list){
      super(node);
      this.searchTerm = searchTerm;
      this.id = uuid();
      this.responses = [];
      this.list = list;
   }

   initiateSearch(){
      let neighborIds = this.node.getRandomSamplePointers();
      let packet = {};
      packet[constants.PACKET_FIELD.PACKET_ID] = this.id;
      packet[constants.PACKET_FIELD.PACKET_SOURCE] = this.node.__cyclonNode.createNewPointer();
      packet[constants.PACKET_FIELD.PACKET_TYPE] = constants.PACKET_TYPE.SEARCH_REQ;
      packet[constants.PACKET_FIELD.HOPS] = 1;
      packet[constants.PACKET_FIELD.QUERY]= this.searchTerm;
      packet[constants.PACKET_FIELD.LIST]= this.list;

      let stats_obj = {event:constants.EVENTS.SEARCH_START,id:this.id,
         source_name:this.node.name,query:this.searchTerm };
      this.emit("stats", stats_obj);
      // this.emit("stats", constants.EVENTS.SEARCH_START, this.id, this.node.name, this.searchTerm, neighborIds.length);
      for(let neighborId of neighborIds) {
         this.sendOutPacket(packet, neighborId);

         // let httpReq = new cyclonRtc.HttpRequestService();
         // httpReq.get(`http://localhost:3500/stats/search_started?id=${this.id}&source_name=${this.node.name}&query=${this.searchTerm}`);
      }
      if (neighborIds.length===0){
         for (let elem of this.node.listManager.getAllProximityLists(this.list)[0].getAllElements()){
            this.sendOutPacket(packet,elem.value);
         }
      }
      this.node.handledPacketIds.push(packet[constants.PACKET_FIELD.PACKET_ID]);

   }

   handlePacket(packet){
      if (packet[constants.PACKET_FIELD.PACKET_TYPE] !== constants.PACKET_TYPE.SEARCH_RES)
         return false;
      if (this.id !== packet[constants.PACKET_FIELD.REQUEST_ID])
         return false;
      console.info("received response for request: " + this.id +" response from: "+packet[constants.PACKET_FIELD.PACKET_SOURCE]);
      this.responses.push(packet);
      this.emit("search_result",packet);
      return true;
   }
}

module.exports = SearchRequest;
