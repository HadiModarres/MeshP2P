let ProximityList = require("./ProximityList");

/**
 * List manager works with entries of type {key,value}
 */
class ListManager {
    constructor() {
        this.proximityListSize = 5;
        this.lists = [];
    }

    addGlobalList(globalList, proximityFunction) {
        for (let list of this.lists) {
            if (list.listName === globalList) {
                throw new Error(`global list "${globalList}" exists already`);
            }
        }
        let newGlobalList = {listName: globalList, lists: [], proximityFunction: proximityFunction};
        this.lists.push(newGlobalList);

    }

    removeAllEntries() {
        for (let l of this.lists){
            l.lists=[];
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
        let list = this.getGlobalList(globalList);
        if (!list){
            console.warn(`tried to add entry ${entry} to non-existent global list: ${globalList}`);
            return;
        }
        list.lists = list.lists.filter((value) => {
           return (value.referenceElement.key !== entry.key);
        });
    }
    addEntry(globalList, entry) {
        let list = this.getGlobalList(globalList);
        if (!list) {
            console.warn(`tried to add entry ${entry} to non-existent global list: ${globalList}. Ignoring.`);
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

    addNeighbor(globalList, neighbor) {
        let list = this.getGlobalList(globalList);
        if (!list) {
            console.warn(`tried to add entry ${entry} to non-existent global list: ${globalList}`);
            return undefined;
        }
        for (let l of list.lists){
            l.addElement(neighbor);
        }
    }

    getAllProximityLists(globalList) {
        let list = this.getGlobalList(globalList);
        if (!list) {
            console.warn(`tried to add entry ${entry} to non-existent global list: ${globalList}`);
            return undefined;
        }
        return list.lists;
    }

}

let listManager = new ListManager();
listManager.addGlobalList("files", (a, b) => {
    return a + b;
});
listManager.addGlobalList("names", (a, b) => {
    return a + b;
});
listManager.addEntry("files",{key:"debian-jessie.iso", value: "34abe3432"});
listManager.addEntry("files",{key:"debian-jessie2.iso", value: "34abe34"});
// listManager.addEntry("files2",{key:"debian-jessie2.iso", value: "34abe34"});
listManager.addNeighbor("files", {key: "debbie", value: "443aee"});
listManager.removeEntry("files",{key:"debian-jessie2.iso", value: "34abe34"});
console.log(listManager);

module.exports = ListManager;
