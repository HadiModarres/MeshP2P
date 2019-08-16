
class ProximityList {
    constructor(maximumListSize, referenceElement, proximityFunc) {
        this.list = [];
        this.maximumListSize = maximumListSize;
        this.proximityFunc = proximityFunc;
        this.referenceElement = referenceElement;
    }

    /**
     * @return {Boolean} true if list was changed, false if list remained unchanged
     */
    addElement(element){
        let proximityScore = this.proximityFunc(this.referenceElement, element);
        element.proxmityScore = proximityScore;
        this._putElement(element);
        this.list = this.list.slice(0, this.maximumListSize);
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

// let pList = new ProximityList(10, {index: "hadi modarres"}, prFunc);
// pList.addElement({index:"hadi"});
// pList.addElement({index:"modarres"});
// pList.addElement({index:"jeff"});
// pList.addElement({index:"jeff modarres"});
// pList.addElement({index:"mary modarres"});
// pList.addElement({index:"tony bogdanov"});
// pList.addElement({index:"h. modarres"});
// pList.addElement({index:"ha modarres"});
// pList.addElement({index:"t bogdanov"});
// pList.addElement({index:"jeff modi"});
// pList.addElement({index:"had modarres"});
// pList.addElement({index:"hadi modarrres"});
//
//
// console.log(pList.getMostSimilarElement());
// console.log(pList.getAllElements());
// console.log(pList.getElementCount());

