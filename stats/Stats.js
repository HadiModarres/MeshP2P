const SearchRequest = require('../controllers/SearchRequest');
const constants = require('../constants');
class Stats{
    constructor(statsRecorder){
       this.eventEmitters = [];

    }
    addEventEmitter(ee){
       this.eventEmitters.push(ee) ;
       ee.on("stats",function (args) {
           console.log("recording stats");
           console.log(arguments);
           console.log(args);
       });
    }

}

let stats = new Stats();
module.exports = stats;

