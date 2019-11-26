const EventEmitter = require("events").EventEmitter;
const constants = require("../constants");
var cyclonRtc = require('cyclon.p2p-rtc-client');
/**
 * Maintains a list of most similar items to a given reference element, the similarity between elements is determined
 * by the proximity function (a,b) => c, higher values of c mean that a and b are more similar
 */
class ProximityList extends EventEmitter{
    /**
     *
     * @param maximumListSize
     * @param referenceElement
     * @param proximityFunc (a,b) => float n,  0<n<1
     */
    constructor(maximumListSize, referenceElement, proximityFunc) {
        super();
        this.list = [];
        this.maximumListSize = maximumListSize;
        this.proximityFunc = proximityFunc;
        this.referenceElement = referenceElement;
        this.inboundListSize = 10;
        // this.inboundList = [];
    }

    /**
     * get proximity score for the given key in relation to this list's reference element's key
     * @param key
     * @return {*}
     */
    proximityScoreComparedToRef(key) {
        return this.proximityFunc(this.referenceElement.key, key);
    }


    perfectMatchForElement(key) {
        for (let e of [this.referenceElement, ...this.list]) {
            if (JSON.stringify(e.key) === JSON.stringify(key)) {
                return e;
            }
        }
        return undefined;
    }

    /**
     * Sorts a list of external elements according to how close they are to external element
     * @param extList
     * @param extElem
     */
    sortListOnProximityToElement(extList, extElem) {
        for (let elem of extList) {
            let score = this.proximityFunc(elem.key, extElem.key);
            elem.score = score;
        }
        return extList.sort((a, b) => {
            if (a.score > b.score) {
                return -1;
            } else if (a.score === b.score) {
                return 0;
            } else {
                return 1;
            }
        });
    }


    nearestNodesTo(element, count) {
        let scores = this.list.map((value => {
            let score = this.proximityFunc(element, value);
            return {score, elem: value};
        }));
        scores = scores.sort((a, b) => {
            if (a.score > b.score) {
                return -1;
            } else if (a.score === b.score) {
                return 0;
            } else {
                return 1;
            }
        });
        return scores.slice(0, count).map((value => {
            return value.elem;
        }));
    }


    addElement(element) {
        if (!element.key && element.key!==0){
            // bad element -> no key
            throw Error("Proximity List: element to be added should have a key");
        }
        element.proximityScore = this.proximityFunc(this.referenceElement.key, element.key).toFixed(3);
        this._putElement(element);
        this.list = this.list.slice(0, this.maximumListSize);
        console.info("new list: " + this.list);
    }

    addElements(elements) {
        for (let elem of elements) {
            this.addElement(elem);
        }
    }

    // addInboundElement(element){
    //     this.inboundList.unshift(element);
    //     if (this.inboundList.length >= this.inboundListSize) {
    //        this.inboundList.pop();
    //     }
    // }

    /**
     *
     * @return {null|*} most similar element object or null if list is empty
     */
    getMostSimilarElement() {
        if (this.list.length > 0) {
            return this.list[0];
        }
        return null;
    }

    /**
     * Put the element in the list according to its score
     * @param element
     * @private
     */
    _putElement(element) {
        for (let i = 0; i < this.list.length; i++) {
            if (this.list[i].proximityScore < element.proximityScore) {
                this.list.splice(i, 0, element);
                return true;
            }
        }
        this.list.push(element);
        return false;
    }

    getKeys(){
        return this.list.map((value => {
            return value.key;
        }));
    }

    getAllElements() {
        return this.list;
    }

    getElementCount() {
        return this.list.length;
    }


}

// let proxList = new ProximityList(4,{key: 8},(a,b)=>{return 1/Math.abs(a-b)})
// for (let i=0;i<20;i++){
//     proxList.addElement({key: i,value:i});
// }
// console.log(proxList);

module.exports = ProximityList;

