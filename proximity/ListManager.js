class ListManager {
    constructor(){
        this.proximityListSize= 5;
        this.lists = [];
    }
    addGlobalList(globalList,proximityFunction){
        for(let list of this.lists){
            if (list.listName==="globalList"){
                throw new Error(`global list ${globalList} already exists`);
            }
        }
        let newGlobalList = {listName: globalList,lists:[]};
        this.lists.push(newGlobalList);

    }
    removeAllEntries(){

    }

    addEntry(globalList,entry){

    }
    addNeighbor(list, neighbor) {

    }

    getAllProximityLists(globalList){

    }

}
