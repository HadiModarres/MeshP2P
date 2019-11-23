const EventEmitter = require("events").EventEmitter;
let IntervalProbe = require("./EncounterIntervalProbe");

class NodeStatsProbe extends EventEmitter{
   constructor(node,reportInterval){
      super();
      this.node = node;
      this.intervalProbe = new IntervalProbe(this.node,1,4);
      this._initStats();
      this._setupListeners();
      this._startEmitting();
      this.reportInterval = reportInterval;
   }

   _startEmitting(){
      if (!this.node.listManager.getAllProximityLists("list#name")){
         setTimeout(()=>{this._startEmitting()},this.reportInterval);
         return;
      }

      let proxList = this.node.listManager.getAllProximityLists("list#name")[0];
      let neighbors = proxList.getAllElements();
      neighbors = neighbors.concat(this.node.listManager.getInboundListForGlobalList("list#name"));
      neighbors = neighbors.map((value) => {
         return value.key;
      });
      let statsObj = {event: "node_stats",id:this.node.name,neighbors,shuffles:this.shuffleCount,timeouts:this.timeoutCount,
         errors:this.errorCount,enc_interval: this.enc_interval};
      this.emit("stats", statsObj);
      setTimeout(()=>{this._startEmitting()},this.reportInterval);
   }

   _setupListeners(){
      this.intervalProbe.on("stats", (statsObj) => {
         this.enc_interval = statsObj.total_avg;
      });
      this.node.__cyclonNode.on("shuffleCompleted",(direction)=>{
         this.shuffleCount++;
      });

      this.node.__cyclonNode.on("shuffleError", (direction) => {
         this.errorCount++;
      });

      this.node.__cyclonNode.on("shuffleTimeout", (direction) => {
         this.timeoutCount++;
      });
   }

   _initStats(){
      this.neighborNames = [];
      this.shuffleCount = 0;
      this.timeoutCount = 0;
      this.errorCount = 0;
      this.enc_interval = 0;
   }
}

module.exports = NodeStatsProbe;
