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

    scoreForElement(element) {
        return this.proximityFunc(this.referenceElement, element);
    }

    uniqueElements(compareFunc) {
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

    perfectMatchForElement(element) {
        for (let e of [this.referenceElement, ...this.list]) {
            if (JSON.stringify(e.key) === JSON.stringify(element.key)) {
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
            let score = this.proximityFunc(elem, extElem);
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

    /**
     * @return {Boolean} true if list was changed, false if list remained unchanged
     */
    addElement(element) {
        if (this.compareFunc) {
            this._filterList(element);
        }
        element.proximityScore = this.proximityFunc(this.referenceElement, element);
        this._putElement(element);
        this.list = this.list.slice(0, this.maximumListSize);
    }

    _filterList(element) {
        this.list = this.list.filter((value => {
            return (!this.compareFunc(element, value));
        }));
    }

    addElements(elements) {
        for (let elem of elements) {
            this.addElement(elem);
        }
    }

    getMostSimilarElement() {
        if (this.list.length > 0) {
            return this.list[0];
        }
        return undefined;
    }

    _putElement(element) {
        for (let i = 0; i < this.list.length; i++) {
            if (this.list[i].proximityScore < element.proximityScore) {
                this.list.splice(i, 0, element);
                return;
            }
        }
        this.list.push(element);
    }

    getAllElements() {
        return this.list;
    }

    getElementCount() {
        return this.list.length;
    }


}


module.exports = ProximityList;
