'use strict';

var WebRTCComms = require("./WebRTCComms");
var ShuffleStateFactory = require("./ShuffleStateFactory");
var SignallingServerBootstrap = require("./SignallingServerBootstrap");

module.exports.ShuffleStateFactory = ShuffleStateFactory;
module.exports.SignallingServerBootstrap = SignallingServerBootstrap;
module.exports.WebRTCComms = WebRTCComms;

/**
 * Build the angular cyclon-rtc-comms module
 *
 * @param angular The angular core module
 * @returns {*}
 */
module.exports.buildAngularModule = function(angular) {
    var rtcCommsModule = angular.module("cyclon-rtc-comms", ["cyclon-rtc"]);

    rtcCommsModule.service("Comms", ["RTC", "ShuffleStateFactory", "$log", WebRTCComms]);
    rtcCommsModule.service("ShuffleStateFactory", ["$log", "AsyncExecService", ShuffleStateFactory]);
    rtcCommsModule.service("Bootstrap", ["SignallingSocket", "HttpRequestService", SignallingServerBootstrap]);

    return rtcCommsModule;
};