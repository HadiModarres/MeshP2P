let Node = require("./node");
let faker = require("faker");
let SearchRequest = require("./controllers/SearchRequest");


// let name = faker.name.firstName("male");
// let cInfo = function () {
//     return name;
// };

let logger = {
    info : function (message) {
        console.info("info: " + message);
    },
    error :  function (message) {
        console.error("error: " + message);
    },
    warn :  function (message) {
        console.warn("warning: " + message);
    },
    debug :  function (message) {
        console.debug("debug: " + message);
    },
};



// let proximityList = new ProximityList(5, {index: node.getId()}, (a, b) => {
//     return stringSimilarity.compareTwoStrings(a.id, b.id);
// });

let node = new Node();
node.setSearchableHeader(faker.name.firstName());

// let clientInfoService = new ClientInfoService(persistentStorage);
let neighbourSet = node.__cyclonNode.getNeighbourSet();

let currWindow = [];
node.__cyclonNode.on("neighbours_updated", function () {
    let set = node.__cyclonNode.getNeighbourSet().getContents();
    node.proximityList.addElements(Object.values(set));
    let proximityInfo = node.proximityList.getAllElements().map((value) => {
        return "name: " + value["metadata"]["clientInfo"];
    });
    if (document.getElementById("new_name").value !== ""){
        node.setSearchableHeader(document.getElementById("new_name").value);
    }
    document.getElementById("names").innerText = proximityInfo.join("\n");
    console.info("proximity list:" + JSON.stringify(proximityInfo));
    // console.info("neighbors: "+JSON.stringify(Object.values(set)));
    document.getElementById("neighbors_previous").innerText = currWindow.sort().join("\n");
    let newWindow =  (Object.getOwnPropertyNames(set));
    let taggedWindow = [];
    for (let id of newWindow){
        if (currWindow.includes(id)) {
            taggedWindow.push(id + " *");
        }else{
            taggedWindow.push(id);
        }
    }
    currWindow = newWindow;
    document.getElementById("neighbors_current").innerText = taggedWindow.sort().join("\n");
    document.getElementById("id").innerText = node.__cyclonNode.getId();
    document.getElementById("name").innerText = node.header;
});
// neighbourSet.on("change", function (change) {
//     console.warn("Changed!!: "+change);
// });
//
// setupNeighbourCacheSessionPersistence(neighbourSet);
//
// function setupNeighbourCacheSessionPersistence(neighbourSet) {
//     let storedNeighbourCache = clientInfoService.getStoredNeighbourCache();
//     if (storedNeighbourCache) {
//         for (let nodeId in storedNeighbourCache) {
//             neighbourSet.insert(storedNeighbourCache[nodeId]);
//         }
//     }
//
//     neighbourSet.on("change", function (change) {
//         console.warn("Changed!!: "+change);
//         clientInfoService.setStoredNeighbourCache(neighbourSet.getContents());
//     });
// }

// global.neighbors = function () {
//     return ;
//     let set = node.getNeighbourSet().getContents();
//     let ids = [];
//     // for (let key of set.getOwnPropertyNames()){
//     //     ids.push(key);
//     // }
//     document.getElementById("neighbors").innerText = (Object.getOwnPropertyNames(set)).join("<br>");
// };
//
global.runTest = function () {
    console.info("running test");
    // rtc.openChannel("data", proximityList.getMostSimilarElement()).then((channel) => {
    //     console.info(channel);
    //     channel.send("data_type", "data!");
    // });
    let searchRequest = new SearchRequest(node, "Sample Search Term");
    node.attachController(searchRequest);
    searchRequest.initiateSearch();
};
//
// rtc.onChannel("data", function (data) {
//     data.receive("data_type",10000).then((message)=>{
//         console.info(message);
//     });
// });












