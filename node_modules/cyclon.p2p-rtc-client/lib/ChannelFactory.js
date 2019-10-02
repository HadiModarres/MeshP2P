const {checkArguments} = require("cyclon.p2p-common");
const Channel = require("./Channel");

function ChannelFactory(peerConnectionFactory, signallingService, logger, channelStateTimeoutMs) {

    checkArguments(arguments, 4);

    this.createChannel = function (remotePeer, correlationId) {
        return new Channel(
            remotePeer,
            correlationId,
            peerConnectionFactory.createPeerConnection(),
            signallingService,
            logger,
            channelStateTimeoutMs);
    }
}

module.exports = ChannelFactory;
