const EventEmitter = require("events").EventEmitter;
let constants = require("../constants");
/**
 * Has the responsibility to gather and report number of shuffles between encounters of other nodes. This data
 * can possibly be used to measure network size.
 */
class EncounterIntervalProbe extends EventEmitter{
   get node() {
      return this._node;
   }

   get sampleSize() {
      return this._sampleSize;
   }

   get encounterCounts() {
      return this._encounterCounts;
   }
   /**
    *
    * @param sampleSize number of nodes to check encounters for.
    * @param encounterCounts number of encounters to average and report at once
    */
   constructor(node,sampleSize,encounterCounts){
      super();
      this._node = node;
      this._sampleSize = sampleSize;
      this._encounterCounts = encounterCounts;
      this.samples= [];
      this.currentIndex= 0;
      this._gatherData();
   }

   _gatherData(){
      this._node.__cyclonNode.on("shuffleCompleted", (direction,pointer)=> {
         this.currentIndex++;
          if (this.currentIndex===1){
             this._initializeSamples();
          }else{
             this._updateSamples();
             this._checkFinishCriteria();
          }
      });
   }
   _checkFinishCriteria(){
      for (let sample of this.samples){
         if (sample.encounters.length!== this._encounterCounts){
            return false;
         }
      }
      // all samples have gathered 3 encounters, finish criteria triggered
      console.info(JSON.stringify(this.samples));
      let totalAvg = this.samples.map((value)=>{
         return (value.encounters[value.encounters.length-1]-1)/this._encounterCounts;
      }).reduce(((previousValue, currentValue) => {
        return previousValue+currentValue;
      }),0);
      let statsObj = {sample_size: this._sampleSize,interval_count: this._encounterCounts,
         total_avg: totalAvg,source_name: this._node.name};
      this.emit("stats",statsObj);
      this.currentIndex = 0;
      console.info(statsObj);
   }


   _updateSamples(){
      let neighbors = this._node.getRandomSamplePointers();
      let neighborIds = neighbors.map((value)=>{
         return value.id;
      });
      for (let sample of this.samples){
         if (neighborIds.includes(sample.id)){
             console.info("encountered");
            sample.encounters.push(this.currentIndex);
         }
      }
   }

   _initializeSamples(){
      let neighbors = this._node.getRandomSamplePointers();
      let size = Math.min(neighbors.length, this._sampleSize);
      this.samples=[];
      for (let i=0;i<size;i++){
         let sample = {id: neighbors[i].id,encounters:[]};
         this.samples.push(sample);
      }
   };

}

module.exports = EncounterIntervalProbe;
