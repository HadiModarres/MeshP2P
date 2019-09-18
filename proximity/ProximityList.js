let stringSimilarity = require("string-similarity");
class ProximityList {
    /**
     *
     * @param maximumListSize
     * @param referenceElement
     * @param proximityFunc (a,b) => float n,  0<n<1
     */
    constructor(maximumListSize, referenceElement, proximityFunc) {
        this.list = [];
        this.maximumListSize = maximumListSize;
        this.proximityFunc = proximityFunc;
        this.referenceElement = referenceElement;
        this.compareFunc = undefined;
    }

    scoreForElement(element){
        return this.proximityFunc(this.referenceElement, element);
    }

    uniqueElements(compareFunc){
       this.compareFunc = compareFunc;
    }

    // perfectMatchForElement(element){
    //     if (this.proximityFunc(this.referenceElement,element)===1){
    //         return this.referenceElement;
    //     }
    //     for (let e of this.list) {
    //         if (this.proximityFunc(e,element)===1){
    //             return e;
    //         }
    //     }
    //     return undefined;
    // }

    perfectMatchForElement(element){
        for (let e of [this.referenceElement, ...this.list]) {
            if (JSON.stringify(e.key) === JSON.stringify(element.key)) {
                return e;
            }
        }
        return undefined;
    }


    // NearestNodesTo(element,count){
    //     let ind=-1;
    //     let score = this.proximityFunc(this.referenceElement, element);
    //     for (let i=0;i<this.list.length;i++){
    //         if (score>this.list[i].proximityScore){
    //             ind = i;
    //         }
    //     }
    //     if (ind===-1){
    //         return [];
    //     }else{
    //         return this.list.slice(ind - (count / 2), count);
    //     }
    // }

    nearestNodesTo(element,count){
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

    /**
     * @return {Boolean} true if list was changed, false if list remained unchanged
     */
    addElement(element){
        if (this.compareFunc){
            this._filterList(element);
        }
        element.proximityScore = this.proximityFunc(this.referenceElement, element);
        this._putElement(element);
        this.list = this.list.slice(0, this.maximumListSize);
    }
    _filterList(element){
        this.list = this.list.filter((value => {
            return (!this.compareFunc(element,value));
        }));
    }

    addElements(elements){
        for (let elem of elements) {
            this.addElement(elem);
        }
    }

    getMostSimilarElement() {
        if (this.list.length>0){
            return this.list[0];
        }
        return undefined;
    }

    _putElement(element){
        for (let i=0;i<this.list.length;i++){
            if (this.list[i].proximityScore<element.proximityScore){
                this.list.splice(i,0,element);
                return;
            }
        }
        this.list.push(element);
    }

    getAllElements(){
        return this.list;
    }

    getElementCount(){
        return this.list.length;
    }



}


// let prFunc = (a, b) => {
//     return stringSimilarity.compareTwoStrings(a.index, b.index);
// };


// let pList = new ProximityList(10, {index: "Brendon"}, prFunc);
// pList.addElement({index:"Jarrel"});
// pList.addElement({index:"Ramon"});
// pList.addElement({index:"Brendon"});
// pList.addElement({index:"Khalil"});
// pList.addElement({index:"Fae"});
// pList.addElement({index:"Tom"});
// //
// //
// console.log(pList.getMostSimilarElement());
// console.log(pList.getAllElements());
// console.log(pList.getElementCount());

module.exports = ProximityList;
