var Utils = require("cyclon.p2p-common");
var Channel = require("./Channel");

function ChannelFactory(peerConnectionFactory, signallingService, logger) {

    Utils.checkArguments(arguments, 3);

    this.peerConnectionFactory = peerConnectionFactory;
    this.signallingService = signallingService;
    this.logger = logger;

    this.createChannel = function (remotePeer, correlationId) {
        return new Channel(
            remotePeer,
            correlationId,
            this.peerConnectionFactory.createPeerConnection(),
            this.signallingService,
            this.logger);
    }
}

module.exports = ChannelFactory;
