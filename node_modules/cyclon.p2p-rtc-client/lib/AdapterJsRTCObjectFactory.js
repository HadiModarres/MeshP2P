'use strict';

var Utils = require("cyclon.p2p-common");

/**
 * An RTC Object factory that works in Firefox and Chrome when adapter.js is present
 *
 * adapter.js can be downloaded from:
 *  https://github.com/GoogleChrome/webrtc/blob/master/samples/web/js/adapter.js
 */
function AdapterJsRTCObjectFactory(logger) {

    Utils.checkArguments(arguments, 1);

    this.createIceServers = function (urls, username, password) {
        if (typeof(createIceServers) !== "undefined") {
            return createIceServers(urls, username, password);
        }
        else {
            logger.error("adapter.js not present or unsupported browser!");
            return null;
        }
    };

    this.createRTCSessionDescription = function (sessionDescriptionString) {
        if (typeof(RTCSessionDescription) !== "undefined") {
            return new RTCSessionDescription(sessionDescriptionString);
        }
        else {
            logger.error("adapter.js not present or unsupported browser!");
            return null;
        }
    };

    this.createRTCIceCandidate = function (rtcIceCandidateString) {
        if (typeof(RTCIceCandidate) !== "undefined") {
            return new RTCIceCandidate(rtcIceCandidateString);
        }
        else {
            logger.error("adapter.js not present or unsupported browser!");
            return null;
        }
    };

    this.createRTCPeerConnection = function (config) {
        if (typeof(RTCPeerConnection) !== "undefined") {
            return new RTCPeerConnection(config);
        }
        else {
            logger.error("adapter.js not present or unsupported browser!");
            return null;
        }
    };
}

module.exports = AdapterJsRTCObjectFactory;