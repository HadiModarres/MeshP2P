


<a href="https://meshp2p.org"><img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/NetworkTopology-FullyConnected.png" height="150" align="right"></a>
# MeshP2P
#### Create P2P apps between browsers

MeshP2P is a framework that allows bootstrapping the development of a distributed application over web browsers using WebRTC. 
It allows for discovery of other peers without requiring a central server. This is done through regular exchange of information between peers. 


## Usage
npm install meshp2p --save

#### Importing in your js code
const Node = require("meshp2p").Node;

## API


### Node Constructor
As a minimum a callback for incoming rtc connections, and an array of signalling servers should be provided to the Node constructor. 

##### Arguments
1. InboundCb (func): a function that is called when another peer makes a connection to this node. The rtcDataChannel will provided 
as an argument to the callback function. 
2. Options (Obj): parameters, DEFAULT_SIGNALLING_SERVERS is required

##### Example
Assuming two signalling servers are running locally on ports 12345 and 12346:
```
   node = new Node((rtcDataChannel)=>{
            // do something with inbound connection
        },{DEFAULT_SIGNALLING_SERVERS:[
                {
                    "socket": {
                        "server": "http://127.0.0.1:12345"
                    },
                    "signallingApiBase": "http://127.0.0.1:12345"
                },
                {
                    "socket": {
                        "server": "http://127.0.0.1:12346"
                    },
                    "signallingApiBase": "http://127.0.0.1:12346"
                }
            ]});
```

See [Signalling Servers](#signalling-servers) on how to start signalling servers.

### registerList

MeshP2P allows for multiple lists to exist in the network, and each node is able to register multiple entries in each list.
Make a global list in the network using registerList. 

##### Arguments
1. list (string): The name of the list
2. proximityFunction (func): The proximity function specifies how closeness between nodes is defined. 
It has the form (entry1, entry2) => float. The higher returned score from proximity function means the 
two entries are more identical, and a score of 0 means least identical. 
3. responseMinScore (float): this is the minimum closeness score between entries to consider it a hit, and a node would respond to the query. 

##### Returns

Void.

##### Example 1

Consider a network with a list of names of peers. In this case it's natural to consider closeness between entries to be string similarity:


```
registerList("list#name", (str1, str2) => {return stringSimilarity(str1,str2), 0.7}
```

##### Example 2

Consider a network of peers with each peer having a coordinate in 2D space. In this case one can define the closeness to be inverse of their euclidean distance, and a distance of less than 4 to consider a hit: 

```
registerList("list#coordinates", (entry1,entry2) => {return 1/euclideanDist(entry1,entry2), 1/4}
```

### setEntries

Set the entries for the current node in the specified network list.

##### Arguments
1. list (string): The global list
2. entries (object[]): the entries for this node 

##### Returns
Void.  

##### Examples
```
setEntries("list#names", ["Jack"])
```

```
setEntries("list#coordinates",[{x: 3,y:12}])
```

### Search

Search the network. 

##### Arguments
1. list(string): The global list to search
2. query(obj): The query. The query should have the form of list entry, and will be fed to the provided proximityFunction provided. 
3. timeout(int): Number of seconds to wait for responses from the network. After that, the resources are freed and responses for this query aren't handled. 
4. searchResultCallback(func): The callback is called each time a response is received from the network. The response is passed to the callback function and has the form: {key,value}. key is the entry that caused a match, and the value is the nodePointer of the peer that has responded to the query. 

##### Examples
```
search("list#names", "jacky", 60, (response)=>{
// do something with the response
});
```

```
search("list#coordinates", {x:2,y:2}, 60, (response)=>{
// do something with the response
});
```

### connectToNode

##### Arguments
nodePointer(nodePointerObj): The node pointer of the peer to connect to.

##### Returns
A promise that is resolved with an rtcDataChannel (https://developer.mozilla.org/en-US/docs/Web/API/RTCDataChannel) when successfully connected to the target peer.

##### Examples

```
node.search("list#names", "jacky", 60, (response)=>{
   node.connectToNode(response.value).then(rtcDataChannel)=>{
       rtcDataChannel.send("hello"); }) 
});
```

### startNode
Starts the node. Start node only after specifying the global list and the node's entries in the list. 

##### Arguments
None


## Signalling Servers

WebRTC requires the use of signalling servers so that peers can negotiate for a connection. Signalling servers are provided as part of MeshP2P
and can be easily started using:
```
npm run server -- 12345
```
This runs a signalling server on port:12345

Peers in the network should have access to at least one signalling server, and this should be specified in the node constructor when 
creating peers. 


##Demo
Check following for a demo p2p chat application based on MeshP2P and React:
https://github.com/HadiModarres/meshp2p_chat

