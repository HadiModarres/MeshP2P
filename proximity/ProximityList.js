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
        let proximityScore = this.proximityFunc(this.referenceElement, element);
        element.proxmityScore = proximityScore;
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
            if (this.list[i].proxmityScore<element.proxmityScore){
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

let pList = new ProximityList(10, {index: "agha hadi"}, prFunc);
pList.addElement({index:"Justina"});
pList.addElement({index:"hadi jan"});
pList.addElement({index:"Chris"});
pList.addElement({index:"Adelle"});
pList.addElement({index:"Dortha"});
pList.addElement({index:"Alfreda"});
//
//
console.log(pList.getMostSimilarElement());
console.log(pList.getAllElements());
console.log(pList.getElementCount());

