class NeighbourRecordManager {
    constructor(listManager) {
        this.listManager = listManager;
    }

    /**
     *
     * @param list an array with elements of {listEntry,pointer,list}
     * Each element is an object specifiying a neighbour node with
     * node pointer <pointer>, and and entry <listEntry> in global list <list>
     */
    incorporateNeighbourList(neighbourList) {
        // console.info("incorporating new set");
       for (let neighbor of neighbourList){
           this.removeNeighbour(neighbor);
           this.listManager.addElementToAllProximityLists(neighbor.list,
               {key:neighbor.listEntry,value:neighbor.pointer})
       }

    }

    /**
     * returns the proximity list that has the closest reference element to <neighbor>
     */
    proxListWithClosestRefToNeighbor(neighbor){
        let proxLists = this.listManager.getAllProximityLists(neighbor.list);
        let bestProxList = undefined;
        let bestScore = Number.NEGATIVE_INFINITY;
        for (let proxList of proxLists){
            let score = proxList.scoreForElement({key: neighbor.listEntry});
            if (score>bestScore){
                bestScore = score;
                bestProxList = proxList;
            }
        }
        return bestProxList;
    }

    /**
     * @return return all entries in the form of {listEntry,list}
     */
    getAllLocalEntries(){
        const allEntries = [];
        for (let list of this.listManager.lists){
            for (let proxList of list.lists){
                allEntries.push({list: list.listName, listEntry: proxList.referenceElement.key});
            }
        }
        return allEntries;
    }

    // getAllLocalEntries() {
    //     let localEntries =  this.listManager.lists.map((list)=>{
    //         return list.lists.map((proxList) => {
    //             return {list:list.listName,listEntry:proxList.referenceElement.key};
    //         });
    //     })
    //     console.info("local entries: ");
    //     console.info(localEntries);
    // }


    /**
     *
     * @param neighbour
     */
    removeNeighbour(neighbour){
        let filterFunc = function (elem) {
            return (neighbour.pointer.id !== elem.value.id);
        };
        this.listManager.removeAllRecordsFromAllLists(filterFunc);
    }
}

module.exports= NeighbourRecordManager;

// const ListManager = require("./ListManager");
//
// let listManager = new ListManager();
// listManager.addGlobalList("names", (a,b)=>{
//     return 1;
// });
//
// listManager.addEntry("names", {key: "hadi", value: {server: "192.1"}});
//
// let neighborManager = new NeighbourRecordManager(listManager);
// neighborManager.incorporateNeighbourList([{listEntry: "harry", pointer: {id:"harry"}, list: "names"},
//                                                     {listEntry: "henry", pointer: {id: "henry"}, list: "names"}]);
//
//
// neighborManager.incorporateNeighbourList([{listEntry: "harry", pointer: {id:"harry",server:"191"}, list: "names"},
//     {listEntry: "henry", pointer: {id:"henry",server:"193"}, list: "names"}]);
// let entries = neighborManager.getAllLocalEntries();
// console.log(listManager);


