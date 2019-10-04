const EventEmitter = require("events").EventEmitter;
var cyclonRtc = require('cyclon.p2p-rtc-client');
let constants = require("../constants");
/**
 * Has the responsibility to gather and report number of shuffles between encounters of other nodes. This data
 * can possibly be used to measure network size.
 */
class ProximityLinkChangeProbe extends EventEmitter{
    constructor(node){
        super();
        this.node = node;
        this._gatherData();
    }

    _gatherData(){
        this.node.on("neighbors_updated", (beforeKeys, afterKeys) => {
            let httpReq = new cyclonRtc.HttpRequestService();
            let changed = this.__getDifferenceCount(beforeKeys,afterKeys);
            httpReq.get(`http://localhost:3500/stats/link_changed?count=${changed}`);
        });
    }

    __getDifferenceCount(arr1,arr2){
        let min = Math.min(arr1.length, arr2.length);
        let diffCount = 0;
        for (let i =0;i<min;i++){
            if (arr1[i]!==arr2[i]){
                diffCount++;
            }
        }
        return diffCount;
    }
}

module.exports = ProximityLinkChangeProbe;
