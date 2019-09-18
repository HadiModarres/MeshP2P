let Node = require("./node");
let faker = require("faker");
let SearchRequest = require("./controllers/SearchRequest");
let SearchResponder = require("./controllers/SearchResponder");
let stringSimilarity = require("string-similarity");



let node = new Node();
// let name = faker.name.firstName();
// while (name.charAt(0) !== 'K') {
//     name = faker.name.firstName();
// }
let name = `${Math.floor(Math.random()*100)},${Math.floor(Math.random()*100)}`;
node.registerList("list#name", (a, b) =>{
    let x1 = a.split(",")[0];
    let y1 = a.split(",")[1];

    let x2 = b.split(",")[0];
    let y2 = b.split(",")[1];
    return 200-Math.sqrt(Math.pow((x1-x2),2)+Math.pow((y1-y2),2));
});
node.setEntries("list#name", [name]);
node.name= name;
node.startNode();


// let clientInfoService = new ClientInfoService(persistentStorage);
let neighbourSet = node.__cyclonNode.getNeighbourSet();

// let searchResponder = new SearchResponder(node);
// node.attachController(searchResponder);


let currWindow = [];

// node.__cyclonNode.on("neighbours_updated", function () {
//     let set = node.__cyclonNode.getNeighbourSet().getContents();
//     node.proximityList.addElements(Object.values(set));
//     let proximityInfo = node.proximityList.getAllElements().map((value) => {
//         return "name: " + value["metadata"]["clientInfo"];
//     });
//     if (document.getElementById("new_name").value !== ""){
//         // node.setSearchableHeader(document.getElementById("new_name").value);
//     }
//     document.getElementById("names").innerText = proximityInfo.join("\n");
//     console.info("proximity list:" + JSON.stringify(proximityInfo));
//     // console.info("neighbors: "+JSON.stringify(Object.values(set)));
//     document.getElementById("neighbors_previous").innerText = currWindow.sort().join("\n");
//     let newWindow =  (Object.getOwnPropertyNames(set));
//     let taggedWindow = [];
//     for (let id of newWindow){
//         if (currWindow.includes(id)) {
//             taggedWindow.push(id + " *");
//         }else{
//             taggedWindow.push(id);
//         }
//     }
//     currWindow = newWindow;
//     document.getElementById("neighbors_current").innerText = taggedWindow.sort().join("\n");
//     document.getElementById("id").innerText = node.__cyclonNode.getId();
//     document.getElementById("name").innerText = node.header;
// });



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
window.onload = function () {
    document.getElementById("name").innerText = name;
};

global.runTest = function () {
    console.info("running test");
    // rtc.openChannel("data", proximityList.getMostSimilarElement()).then((channel) => {
    //     console.info(channel);
    //     channel.send("data_type", "data!");
    // });
    let searchRequest = new SearchRequest(node, document.getElementById("new_name").value,"list#name");
    node.attachController(searchRequest);
    searchRequest.initiateSearch();
};
//
// rtc.onChannel("data", function (data) {
//     data.receive("data_type",10000).then((message)=>{
//         console.info(message);
//     });
// });












