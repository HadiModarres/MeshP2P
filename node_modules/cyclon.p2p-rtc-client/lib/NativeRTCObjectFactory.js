'use strict';

var Utils = require("cyclon.p2p-common");

/**
 * An RTC Object factory that works in Firefox 37+ and Chrome 
 */
function NativeRTCObjectFactory(logger) {

    Utils.checkArguments(arguments, 1);

    this.createIceServers = function (urls, username, password) {
        return {
            'urls': urls,
            'username': username,
            'password': password
        };
    };

    this.createRTCSessionDescription = function (sessionDescriptionString) {
        if (typeof(RTCSessionDescription) !== "undefined") {
            return new RTCSessionDescription(sessionDescriptionString);
        }
        else {
            logger.error("Your browser doesn't support WebRTC");
            return null;
        }
    };

    this.createRTCIceCandidate = function (rtcIceCandidateString) {
        if (typeof(RTCIceCandidate) !== "undefined") {
            return new RTCIceCandidate(rtcIceCandidateString);
        }
        else {
            logger.error("Your browser doesn't support WebRTC");
            return null;
        }
    };

    this.createRTCPeerConnection = function (config) {
        if (typeof(RTCPeerConnection) !== "undefined") {
            return new RTCPeerConnection(config);
        }
        else {
            logger.error("Your browser doesn't support WebRTC");
            return null;
        }
    };
}

module.exports = NativeRTCObjectFactory;