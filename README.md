


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

