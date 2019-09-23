const constants = require('../constants');
class StatsRecorder{
    constructor(statsRecorder){
       this.eventEmitters = [];
    }
    addEventEmitter(ee){
       this.eventEmitters.push(ee) ;
       ee.on("stats",()=>{
           this.__handleStats(arguments[0]);
       });
    }

    __handleStats(statsObj){
        //override in subclass
    }
}

module.exports = StatsRecorder;

