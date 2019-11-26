let Node = require("./node");
let faker = require("faker");
let SearchRequest = require("./controllers/SearchRequest");
let SearchResponder = require("./controllers/SearchResponder");
let stringSimilarity = require("string-similarity");



let node = new Node({});
// let name = faker.name.firstName();
// while (name.charAt(0) !== 'K') {
//     name = faker.name.firstName();
// }
let name = `${Math.floor(Math.random()*200)},${Math.floor(Math.random()*200)}`;
node.registerList("list#name", (a, b) =>{
    let x1 = a.split(",")[0];
    let y1 = a.split(",")[1];
    let x2 = b.split(",")[0];
    let y2 = b.split(",")[1];
    return 2000-Math.sqrt(Math.pow(Math.abs(x1-x2),2)+Math.pow(Math.abs(y1-y2),2));
});
node.setEntries("list#name", [name]);
node.name= name;
window.document.title = name;
node.startNode();


// let clientInfoService = new ClientInfoService(persistentStorage);
let neighbourSet = node.__cyclonNode.getNeighbourSet();



let currWindow = [];

window.onload = function () {
    document.getElementById("name").innerText = name;
};

let response_ids = {};
global.runTest = function () {
    console.info("running test");
    let searchRequest = new SearchRequest(node, document.getElementById("new_name").value,"list#name");
    document.getElementById("results").innerHTML="";
    response_ids = {};
    searchRequest.on("search_result", (packet) => {
        if (!response_ids[packet.packet_id]){
           response_ids[packet.packet_id]= 1;
        }else {
            response_ids[packet.packet_id]++;
        }
        document.getElementById("results").innerHTML =
            "<div>" + JSON.stringify(response_ids)+"</div>";
    });
    node.attachController(searchRequest);
    node.statsRecorder.addEventEmitter(searchRequest);
    searchRequest.initiateSearch();
};












