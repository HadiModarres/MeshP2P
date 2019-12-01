


<a href="https://meshp2p.org"><img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/NetworkTopology-FullyConnected.png" height="150" align="right"></a>
# MeshP2P
#### Create P2P apps between browsers

MeshP2P is a framework that allows bootstrapping the development of a distributed application over web browsers using WebRTC. 
It allows for discovery of other peers without requiring a central server. This is done through regular exchange of information between peers. 

##Usage
npm install meshp2p --save

#### Importing in your js code
const Node = require("meshp2p").Node;

## API

MeshP2P allows for multiple lists to exist in the network, and each node is able to register multiple entries in each list.

### registerList

Make a global list in the network known to the current node. 

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

