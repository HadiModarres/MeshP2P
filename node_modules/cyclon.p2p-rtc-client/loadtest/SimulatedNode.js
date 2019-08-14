'use strict';

var Promise = require("bluebird");

var SHUFFLE_INTERVAL_MS = 5000;
var GATHERING_DELAY_MS = 500;
var MOCK_OFFER_SDP = {
    "sdp": "v=0\r\no=- 2794098625509964585 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=msid-semantic: WMS\r\nm=application 1 DTLS/SCTP 5000\r\nc=IN IP4 0.0.0.0\r\na=ice-ufrag:A/mUxqOMwbHZApNW\r\na=ice-pwd:y5Ahq4tHz99xJeXwept8mrvQ\r\na=ice-options:google-ice\r\na=fingerprint:sha-256 3E:5F:23:D2:B0:2D:AB:CF:A0:02:A7:2F:4D:DD:69:A8:73:0D:26:05:86:45:97:21:5B:03:7F:5B:37:85:60:C3\r\na=setup:actpass\r\na=mid:data\r\na=sctpmap:5000 webrtc-datachannel 1024\r\n",
    "type": "offer"
};
var MOCK_ANSWER_SDP = {
    "sdp": "v=0\r\no=- 5317280585597315582 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=msid-semantic: WMS\r\nm=application 1 DTLS/SCTP 5000\r\nc=IN IP4 0.0.0.0\r\na=ice-ufrag:flZOS/f+iYG64Nss\r\na=ice-pwd:KJJts7e4a4SWuGL4Mf0mwa0c\r\na=fingerprint:sha-256 3E:5F:23:D2:B0:2D:AB:CF:A0:02:A7:2F:4D:DD:69:A8:73:0D:26:05:86:45:97:21:5B:03:7F:5B:37:85:60:C3\r\na=setup:active\r\na=mid:data\r\na=sctpmap:5000 webrtc-datachannel 1024\r\n",
    "type": "answer"
};

var MOCK_ICE_CANDIDATES = [
    {"sdpMLineIndex": 0, "sdpMid": "data", "candidate": "a=candidate:2437072876 1 udp 2122260223 192.168.1.2 57157 typ host generation 0\r\n"},
    {"sdpMLineIndex": 0, "sdpMid": "data", "candidate": "a=candidate:2441410931 1 udp 2122194687 172.17.42.1 48770 typ host generation 0\r\n"},
    {"sdpMLineIndex": 0, "sdpMid": "data", "candidate": "a=candidate:2437072876 1 udp 2122260223 192.168.1.2 36827 typ host generation 0\r\n"},
    {"sdpMLineIndex": 0, "sdpMid": "data", "candidate": "a=candidate:2441410931 1 udp 2122194687 172.17.42.1 41508 typ host generation 0\r\n"},
    {"sdpMLineIndex": 0, "sdpMid": "data", "candidate": "a=candidate:3753982748 1 tcp 1518280447 192.168.1.2 0 typ host generation 0\r\n"},
    {"sdpMLineIndex": 0, "sdpMid": "data", "candidate": "a=candidate:3741779331 1 tcp 1518214911 172.17.42.1 0 typ host generation 0\r\n"},
    {"sdpMLineIndex": 0, "sdpMid": "data", "candidate": "a=candidate:3753982748 1 tcp 1518280447 192.168.1.2 0 typ host generation 0\r\n"},
    {"sdpMLineIndex": 0, "sdpMid": "data", "candidate": "a=candidate:3741779331 1 tcp 1518214911 172.17.42.1 0 typ host generation 0\r\n"}
];

function SimulatedNode(signallingService, allNodes) {

    var running = false;
    var lastShuffleTime = -1;

    this.start = function () {
        running = true;
        addListeners();
        signallingService.connect({}, []);
        setInterval(simulateShuffle, SHUFFLE_INTERVAL_MS);
    };

    this.stop = function () {
        removeListeners();
        running = false;
    };

    this.getId = function () {
        return signallingService.getLocalId();
    };

    this.getPointer = function () {
        return signallingService.createNewPointer();
    };

    this.getLastShuffleTime = function() {
        return lastShuffleTime;
    };

    function simulateShuffle() {
        var otherNode = chooseRandomNode();
        var startTime = new Date().getTime();
        signallingService.sendOffer(otherNode.getPointer(), "loadTest", MOCK_OFFER_SDP)
            .then(signallingService.waitForAnswer)
            .then(function(answerMessage) {
                return sendIceCandidates(otherNode.getPointer(), answerMessage.correlationId);
            })
            .then(function() {
                lastShuffleTime = new Date().getTime() - startTime;
            })
            .catch(function(error) {
                console.log("An error occurred on an outgoing shuffle", error);
            });
    }

    function chooseRandomNode() {
        var chosenNode = null;
        while (chosenNode === null || chosenNode === this) {
            var index = Math.floor(Math.random() * allNodes.length);
            chosenNode = allNodes[index];
        }
        return chosenNode;
    }

    function addListeners() {
        signallingService.on("offer", function (message) {
            signallingService.sendAnswer(message.sourcePointer, message.correlationId, MOCK_ANSWER_SDP)
                .then(sendIceCandidates(message.sourcePointer, message.correlationId))
                .catch(function(error) {
                    console.log("An error occurred on an incoming shuffle", error);
                });
        });
    }

    function removeListeners() {
        signallingService.removeAllListeners("offer");
    }

    /**
     * Send ICE candidates after a simulated gathering delay
     *
     * @param destinationNode
     * @param correlationId
     * @returns {Promise}
     */
    function sendIceCandidates(destinationNode, correlationId) {

        return new Promise(function (resolve) {
            setTimeout(function () {
                if (running) {
                    signallingService.sendIceCandidates(destinationNode, correlationId, MOCK_ICE_CANDIDATES)
                        .then(resolve);
                }
                else {
                    resolve()
                }
            }, GATHERING_DELAY_MS);
        })
            .catch(function(error) {
                console.log("An error occurred sending ICE candidates", error);
            });
    }
}

module.exports = SimulatedNode;

