'use strict';

var Utils = require("cyclon.p2p-common");
var PeerConnection = require("./PeerConnection");

function PeerConnectionFactory(rtcObjectFactory, logger, iceServers, channelStateTimeout) {

    Utils.checkArguments(arguments, 4);

    /**
     * Create a new peer connection
     */
    this.createPeerConnection = function () {
        return new PeerConnection(rtcObjectFactory.createRTCPeerConnection(createPeerConnectionConfig()),
            rtcObjectFactory, logger, channelStateTimeout);
    };

    function createIceServers() {
        if (iceServers) {
            var builtIceServers = iceServers.map(function (iceServer) {
                return rtcObjectFactory.createIceServers([].concat(iceServer.urls || iceServer.url), iceServer.username, iceServer.credential);
            }).reduce(flatten, []).filter(notNull);     // createIceServer sometimes returns null (when the browser doesn't support the URL

            if (builtIceServers.length === 0) {
                logger.warn("Your browser doesn't support any of the configured ICE servers. You will only be able to contact other peers on your LAN.");
            }
            return builtIceServers;
        }

        return [];
    }

    function createPeerConnectionConfig() {
        var peerConnectionConfig = {};
        peerConnectionConfig.iceServers = createIceServers();
        return peerConnectionConfig;
    }

    function notNull(item) {
        return item !== null;
    }

    function flatten(prev, next) {
        return prev.concat(next);
    }
}

module.exports = PeerConnectionFactory;
