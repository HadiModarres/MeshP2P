'use strict';

/**
 * Just returns a list of known signalling servers
 */
function StaticSignallingServerService(signallingServers) {
    
    this.getSignallingServerSpecs = function () {
        return signallingServers;
    };

    this.getPreferredNumberOfSockets = function() {
        return Math.min(2, signallingServers.length);
    }
}

module.exports = StaticSignallingServerService;