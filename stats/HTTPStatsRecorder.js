let StatsRecorder = require('./StatsRecorder');
let StatsTagger = require('./StatsObjURLTagger');
let cyclonRtc = require('cyclon.p2p-rtc-client');

class HTTPStatsRecorder extends StatsRecorder{
    constructor(){
        super();
        this.tagger = new StatsTagger();
    }
   __handleStats(statsObj) {
       this.tagger.tagStatsObj(statsObj);
       this.__sendStats(statsObj);
   }

    /**
     * tries sending the obj over the network if it fails adds it to backlog
     * @param statsObj
     * @private
     */
   __sendStats(statsObj){
        let httpReq = new cyclonRtc.HttpRequestService();
        httpReq.get(statsObj.url).then((resolve)=>{
            // sent successfully
        },(reject)=>{
            // couldnt send save for later
            console.error("couldnt send stats obj to url: "+statsObj.url);
            console.error(reject);
            this.eventsBacklog.push(statsObj);
        });
   }
}




module.exports = HTTPStatsRecorder;
