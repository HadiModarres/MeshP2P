/**
 * Has the responsibility to gather and report number of shuffles between encounters of other nodes. This data
 * can possibly be used to measure network size.
 */
class EncounterIntervalProbe {
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
      this._node = node;
      this._sampleSize = sampleSize;
      this._encounterCounts = encounterCounts;
      this.samples= []
      this._gatherData();
      this.currentIndex= 0;
   }

   _gatherData(){
      this._node.__cyclonNode.on("neighbours_updated", ()=> {
          if (this.currentIndex===0){
             this._initializeSamples();
          }else{
             this._updateSamples();
             this._checkFinishCriteria();
          }
          this.currentIndex++;
      });
   }
   _checkFinishCriteria(){

   }

   _updateSamples(){

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
