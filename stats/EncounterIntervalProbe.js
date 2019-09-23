const EventEmitter = require("events").EventEmitter;
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
      this.samples= []
      this._gatherData();
      this.currentIndex= 0;
   }

   _gatherData(){
      this._node.__cyclonNode.on("neighbours_updated", ()=> {
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
      let totalAvg = this.samples.map((value)=>{
         return (value.encounters[this._sampleSize-1]-value.encounters[0])/this._sampleSize;
      }).reduce(((previousValue, currentValue) => {
        return previousValue+currentValue;
      }),0);
      this.emit("stats",{sample_size: this._sampleSize,interval_count: this._encounterCounts,
         total_avg: totalAvg,source_name: this._node.name});
      this.currentIndex = 0;
   }


   _updateSamples(){
      let neighbors = this._node.getRandomSamplePointers();
      let neighborIds = neighbors.map((value)=>{
         return value.id;
      });
      for (let sample of this.samples){
         if (neighborIds.includes(sample.id)){
            sample.encounters.push(this.currentIndex);
         }
      }
   }

   _initializeSamples(){
      let neighbors = this._node.getRandomSamplePointers();
      let size = Math.min(neighbors.length, this._sampleSize);
      for (let i=0;i<size;i++){
         let sample = {id: neighbors[i].id,encounters:[]};
         this.samples.push(sample);
      }
   };

}
