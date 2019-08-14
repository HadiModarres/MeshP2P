cyclon.p2p
==========

[![Build Status](https://travis-ci.org/nicktindall/cyclon.p2p.svg?branch=master)](https://travis-ci.org/nicktindall/cyclon.p2p)
[![Dependencies](https://david-dm.org/nicktindall/cyclon.p2p.png)](https://david-dm.org/nicktindall/cyclon.p2p)

A Javascript implementation of the Cyclon peer sampling protocol

The details and an analysis of the implementation can be found in;

> N. Tindall and A. Harwood, "Peer-to-peer between browsers: cyclon protocol over WebRTC," Peer-to-Peer Computing (P2P), 2015 IEEE International Conference on, Boston, MA, 2015, pp. 1-5.
>doi: 10.1109/P2P.2015.7328517

The Cyclon protocol is described in;

> Voulgaris, S.; Gavidia, D. & van Steen, M. (2005), 'CYCLON: Inexpensive Membership Management for Unstructured P2P Overlays', J. Network Syst. Manage. 13 (2).

Overview
--------
The cyclon.p2p implementation has two dependencies, a `Bootstrap` and a `Comms` instance. Their functions and interfaces are described below.

### Bootstrap
The purpose of the `Bootstrap` is to retrieve some peers to initially populate a node's neighbour cache. Its interface is quite simple.

#### `getInitialPeerSet(localNode, maxPeers)`
Get an initial set of peers. Returns a [Bluebird](https://github.com/petkaantonov/bluebird) promise that will resolve to a set of peers no greater than the specified limit.

##### Parameters
* **localNode** The CyclonNode that is requesting the peers.
* **limit** The maximum number of peers to return.

### Comms
The `Comms` is the layer that takes care of a node's communication with other nodes. It is responsible for executing shuffles for the local node. Its interface is again quite simple.

#### `initialize(localNode, metadataProviders)`
Initialize the Comms instance. This must be called before any attempt is made to do anything else.

##### Parameters
* **localNode** A reference to the local CyclonNode.
* **metadataProviders** A JavaScript Object whose keys will be used as node pointer metadata keys and values will be executed to get the corresponding values.

#### `sendShuffleRequest(destinationNodePointer, shuffleSet)`
Send a shuffle request to another node in the network. Returns a cancellable Bluebird promise that will resolve when a shuffle has been successfully executed. If a cancellation or error occurs it will reject with the error.

##### Parameters
* **destinationNodePointer** The node pointer of the destination node.
* **shuffleSet** The set of node pointers to include in the shuffle request message.

#### `createNewPointer()`
Create a new pointer to the local node, containing the current metadata and signalling details.

#### `getLocalId()`
Return the string which the Comms layer is using to identify the local node.

Usage
-----
On its own this package is not particularly useful unless you intend to create your own `Comms` and `Bootstrap` implementations. The [cyclon-p2p-rtc-comms](https://github.com/nicktindall/cyclon.p2p-rtc-comms) package provides a configurable implementation of the interfaces that will work in modern Chrome and Firefox (and maybe Opera?) browsers. 

A demonstration of the WebRTC implementation of cyclon.p2p can be found [here](http://cyclon-js-demo.herokuapp.com). Open a few tabs and watch the protocol work.

### The Local Simulation
This package contains "local" `Comms` and `Bootstrap` implementations that can be used to run a local multi-node simulation of the protocol by executing
 
```
node localSimulation.js
```

In the working directory. The local simulation is configured to bootstrap each peer in the network with only the node pointer of its neighbour to the right (on a number scale, wrapping at the node with the maximum ID). It will then start all the nodes and output some network metrics.

An example of the output:
```
Starting Cyclon.p2p simulation of 50 nodes
Ideal entropy is 5.614709844115208
1: entropy (min=Infinity, mean=NaN, max=-Infinity), in-degree (mean=0, std.dev=0), orphans=50
2: entropy (min=0, mean=0, max=0), in-degree (mean=1, std.dev=0), orphans=0
3: entropy (min=0.9182958340544896, mean=1.0008546455628127, max=2), in-degree (mean=1.56, std.dev=0.6374950980203691), orphans=0
4: entropy (min=2.2516291673878226, mean=2.3793927048285384, max=3.1219280948873624), in-degree (mean=4.48, std.dev=2.475802900071005), orphans=0
5: entropy (min=2.5216406363433186, mean=2.972442624013195, max=3.75), in-degree (mean=6.66, std.dev=3.2410492128321655), orphans=0
```

The information output includes

* **entropy** A measurement of the *Shannon Entropy* of the stream of peers that the protocol has produced over the network. The entropy of the stream is measured at each node and the statistics aggregated. The Shannon entropy is an indication of how evenly the probabilities of each node in the network being selected are distributed. The "ideal" entropy, where each peer is equally likely to appear in the sample, is output at the beginning of the simulation.
* **in-degree** The in-degree in a directed graph is the number of edges arriving at a particular vertex. In the context of the Cyclon network it indicates the number of peers whose neighbour caches have a pointer to a particular node.
* **orphans** This is just a count of the number of nodes in the network with an in-degree of zero. This should stay at zero.
