'use strict';

/**
 *	A NodeJS implementation of the RTCObjectFactory (TODO)
 *
 *  Will consider https://github.com/js-platform/node-webrtc for implementation
 */
function NodeJsRTCObjectFactory() {

	this.createIceServers = function(urls, username, password) {
		return null;
	};

    this.createRTCSessionDescription = function(sessionDescriptionString) {
        return null;
    };

    this.createRTCIceCandidate = function(rtcIceCandidateString) {
        return null;
    };

    this.createRTCPeerConnection = function(config) {
    	return null;
    };
}

module.exports = NodeJsRTCObjectFactory;