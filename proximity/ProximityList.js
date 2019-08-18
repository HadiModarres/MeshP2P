let stringSimilarity = require("string-similarity");
class ProximityList {
    constructor(maximumListSize, referenceElement, proximityFunc) {
        this.list = [];
        this.maximumListSize = maximumListSize;
        this.proximityFunc = proximityFunc;
        this.referenceElement = referenceElement;
        this.compareFunc = undefined;
    }

    uniqueElements(compareFunc){
       this.compareFunc = compareFunc;
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


let prFunc = (a, b) => {
    return stringSimilarity.compareTwoStrings(a.index, b.index);
};

module.exports = ProximityList;

let pList = new ProximityList(10, {index: "Brendon"}, prFunc);
pList.addElement({index:"Jarrel"});
pList.addElement({index:"Ramon"});
pList.addElement({index:"Brendon"});
pList.addElement({index:"Khalil"});
pList.addElement({index:"Fae"});
pList.addElement({index:"Tom"});
//
//
console.log(pList.getMostSimilarElement());
console.log(pList.getAllElements());
console.log(pList.getElementCount());

