const constants = require('../constants');
class StatsRecorder{
    constructor(statsRecorder){
       this.eventEmitters = [];
       this.eventsBacklog = [];
    }
    addEventEmitter(ee){
       this.eventEmitters.push(ee) ;
       ee.on("stats",(statsObj)=>{
           console.info("args:");
           console.info(statsObj);
           this.__handleStats(statsObj);
       });
    }

    __handleStats(statsObj){
        //override in subclass
    }
}

module.exports = StatsRecorder;

