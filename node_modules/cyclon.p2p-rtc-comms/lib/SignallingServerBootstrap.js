'use strict';

var url = require('url');
var Promise = require("bluebird");
var Utils = require("cyclon.p2p-common");

function SignallingServerBootstrap(signallingSocket, httpRequestService) {

    Utils.checkArguments(arguments, 2);

    var API_PATH = "./api/peers";

    /**
     * Fetch a list of registered peers from the server
     */
    this.getInitialPeerSet = function (cyclonNode, limit) {

        var serverSpecs = signallingSocket.getCurrentServerSpecs();
        if (serverSpecs.length > 0) {

            var specPromises = serverSpecs.map(function (serverSpec) {
                return getInitialPeerSetFromServer(cyclonNode, serverSpec, limit);
            });

            return Promise.settle(specPromises).then(function (results) {
                var allResults = collateSuccessfulResults(results);
                return Utils.randomSample(deDuplicatePeerList(allResults), limit);
            });
        }

        return Promise.reject(new Error("Not connected to any signalling servers, can't bootstrap"));
    };

    function collateSuccessfulResults(arrayOfPromises) {
        return arrayOfPromises.reduce(function (current, next) {
            if (next.isFulfilled()) {
                return current.concat(next.value());
            }
            else {
                return current;
            }
        }, []);
    }

    function deDuplicatePeerList(arrayOfPeers) {
        var peerMap = {};

        arrayOfPeers.forEach(function (peer) {
            if (peerMap.hasOwnProperty(peer.id)) {
                if (peerMap[peer.id].seq < peer.seq) {
                    peerMap[peer.id] = peer;
                }
            }
            else {
                peerMap[peer.id] = peer;
            }
        });

        var uniquePeers = [];
        for (var nodeId in peerMap) {
            uniquePeers.push(peerMap[nodeId]);
        }
        return uniquePeers;
    }

    function getInitialPeerSetFromServer(cyclonNode, serverSpec, limit) {
        return httpRequestService.get(generateUrl(serverSpec.signallingApiBase, limit)).then(function (response) {
            return Object.keys(response).filter(function (peerId) {
                return peerId !== cyclonNode.getId();
            }).map(function (peerId) {
                    return response[peerId];
                });
        });
    }

    function generateUrl(apiBase, limit) {
        //noinspection JSCheckFunctionSignatures
        return url.resolve(apiBase, API_PATH) + "?room=CyclonWebRTC&limit=" + limit + "&nocache=" + new Date().getTime();
    }
}

module.exports = SignallingServerBootstrap;