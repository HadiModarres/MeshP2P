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
       for (let neighbor of neighbourList){
           this.removeNeighbour(neighbor);
           this.listManager.addElementToAllProximityLists(neighbor.list,
               {key:neighbor.listEntry,value:neighbor.pointer})
       }
    }

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

const ListManager = require("./ListManager");

let listManager = new ListManager();
listManager.addGlobalList("names", (a,b)=>{
    return 1;
});

listManager.addEntry("names", {key: "hadi", value: {server: "192.1"}});

let neighborManager = new NeighbourRecordManager(listManager);
neighborManager.incorporateNeighbourList([{listEntry: "harry", pointer: {id:"harry"}, list: "names"},
                                                    {listEntry: "henry", pointer: {id: "henry"}, list: "names"}]);


neighborManager.incorporateNeighbourList([{listEntry: "harry", pointer: {id:"harry",server:"191"}, list: "names"},
    {listEntry: "henry", pointer: {id:"henry",server:"193"}, list: "names"}]);

console.log(listManager);


