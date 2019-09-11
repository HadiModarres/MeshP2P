let ProximityList = require("./ProximityList");

class ListManager {
    constructor() {
        this.proximityListSize = 5;
        this.lists = [];
    }

    addGlobalList(globalList, proximityFunction) {
        for (let list of this.lists) {
            if (list.listName === "globalList") {
                throw new Error(`global list ${globalList} already exists`);
            }
        }
        let newGlobalList = {listName: globalList, lists: [], proximityFunction: proximityFunction};
        this.lists.push(newGlobalList);

    }

    removeAllEntries() {

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


    addEntry(globalList, entry) {
        let list = this.getGlobalList(globalList);
        if (!list) {
            console.warn(`tried to add entry ${entry} to non-existent global list: ${globalList}`);
        } else {
            for (let l of list.lists){
                if (l.referenceElement === entry){
                    console.warn(`a proximity list for entry ${entry} already exists.`);
                    return;
                }
            }
            let proxList = new ProximityList(this.proximityListSize, entry, list.proximityFunction);
            list.lists.push(proxList);
        }
    }

    addNeighbor(list, neighbor) {
        
    }

    getAllProximityLists(globalList) {

    }

}
