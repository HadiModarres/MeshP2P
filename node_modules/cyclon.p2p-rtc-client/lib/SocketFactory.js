'use strict';

var io = require("socket.io-client");
var url = require("url");

function SocketFactory() {

    /**
     * Create a socket
     */
    this.createSocket = function (serverSpec) {
        //noinspection JSCheckFunctionSignatures
        return io(url.resolve(serverSpec.socket.server, "/peers"), createOptionsForServerSpec(serverSpec));
    };
}

/**
 * Create the socket.io options for the specified server
 */
function createOptionsForServerSpec(serverSpec) {
    var options = {
        forceNew: true,            // Make a new connection each time
        reconnection: false        // Don't try and reconnect automatically
    };

    // If the server spec contains a socketResource setting we use
    // that otherwise leave the default ('/socket.io/')
    if(serverSpec.socket.socketResource) {
        options.resource = serverSpec.socket.socketResource;
    }
    return options;
}

module.exports = SocketFactory;