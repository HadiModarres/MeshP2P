let ProximityList = require("./ProximityList");

/**
 * List manager works with entries of type {key,value}
 */
class ListManager {
    constructor() {
        this.proximityListSize = 6;
        this.lists = [];
        this.inboundListSize = 5;
    }

    addGlobalList(globalList, proximityFunction) {
        for (let list of this.lists) {
            if (list.listName === globalList) {
                throw new Error(`global list "${globalList}" exists already`);
            }
        }
        let newGlobalList = {listName: globalList, lists: [], proximityFunction: proximityFunction, inboundList: []};
        this.lists.push(newGlobalList);

    }

    addInboundElementToList(globalList,entry){
        if (!entry.key && entry.key!==0){
            // bad element -> no key
            throw Error("List Manager: entry to be added should have a key");
        }
        let list = this.getGlobalList(globalList);
        if (!list) {
            console.warn(entry);
        } else {
                list.inboundList.unshift(entry);
                if (list.inboundList.length >= this.inboundListSize) {
                   list.inboundList.pop();
                }
        }
    }
    getInboundListForGlobalList(globalList){
        let list = this.getGlobalList(globalList);
        if (!list) {
            console.warn(entry);
        } else {
           return list.inboundList;
        }
    }

    /**
     *
     * @param globalList
     * @return list or undefined if the list doesnt exist
     */
    getGlobalList(globalList) {
        for (let list of this.lists){
            if (list.listName === globalList) {
                return list;
            }
        }
        return undefined;
    }


    removeEntry(globalList,entry){
        if (!entry.key && entry.key!==0){
            // bad element -> no key
            throw Error("List Manager: entry to be removed should have a key");
        }
        let list = this.getGlobalList(globalList);
        if (!list){
            console.warn(`tried to remove entry ${entry} from non-existent global list: ${globalList}`);
            return;
        }
        list.lists = list.lists.filter((value) => {
           return (value.referenceElement.key !== entry.key);
        });
    }

    addEntry(globalList, entry) {
        if (!entry.key && entry.key!==0){
            // bad element -> no key
            throw Error("List Manager: entry to be added should have a key");
        }
        let list = this.getGlobalList(globalList);
        if (!list) {
            console.warn(`tried to add entry ${entry} to non-existent global list: ${globalList}. Ignoring.`);
            console.warn(entry);
        } else {
            for (let l of list.lists){
                if (l.referenceElement.key === entry.key){
                    console.warn(`a proximity list for entry ${entry} already exists.`);
                    return;
                }
            }
            let proxList = new ProximityList(this.proximityListSize, entry, list.proximityFunction);
            list.lists.push(proxList);
        }
    }

    removeAllRecordsFromAllLists(filterFunc){
        for (let globalList of this.lists) {
            for (let proxList of globalList.lists) {
                proxList.list = proxList.list.filter(filterFunc);
            }
        }
    }

    addElementToAllProximityLists(globalList, element) {
            let list = this.getGlobalList(globalList);
            if (!list) {
                        console.warn(`tried to add list element ${element} to non-existent global list: ${globalList}`);
                        return undefined;
            }
            for (let l of list.lists){
                l.addElement(element);
            }
    }


    getAllProximityLists(globalList) {
        let list = this.getGlobalList(globalList);
        if (!list) {
            return undefined;
        }
        return list.lists;
    }


    /**
     * @return return all entries in the form of {key,list}
     */
    getAllLocalEntries(){
        const allEntries = [];
        for (let list of this.lists){
            for (let proxList of list.lists){
                allEntries.push({list: list.listName, key: proxList.referenceElement.key});
            }
        }
        return allEntries
    }

    /**
     * returns the proximity list that has the closest reference element key to <key> in <globalList>
     */
    proxListWithClosestRefToElement(key,globalList){
        let proxLists = this.getAllProximityLists(globalList);
        let bestProxList = undefined;
        let bestScore = Number.NEGATIVE_INFINITY;
        for (let proxList of proxLists){
            let score = proxList.proximityScoreComparedToRef(key);
            if (score>bestScore){
                bestScore = score;
                bestProxList = proxList;
            }
        }
        return bestProxList;
    }

}


module.exports = ListManager;
