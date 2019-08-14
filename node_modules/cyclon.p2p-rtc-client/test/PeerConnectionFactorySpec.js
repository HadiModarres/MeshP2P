'use strict';

var ClientMocks = require("./ClientMocks");
var PeerConnectionFactory = require("../lib/PeerConnectionFactory");

describe("The PeerConnectionFactory", function() {

    var ICE_SERVERS = [
        {
            "urls": ["url11", "url12"],
            "username": "username1",
            "credential": "credential1"
        },
        {
            "url": "url2",
            "username": "username2",
            "credential": "credential2"
        }
    ];

    var CHANNEL_STATE_TIMEOUT = 5011;

    var rtcObjectFactory,
        logger,
        peerConnectionFactory;

    beforeEach(function() {
        rtcObjectFactory = ClientMocks.mockRtcObjectFactory();
        logger = ClientMocks.mockLoggingService();

        rtcObjectFactory.createRTCPeerConnection.and.returnValue(ClientMocks.mockRtcPeerConnection());
    });

    describe("when creating a new peer connection", function() {

        describe("and there are ICE servers", function() {

            beforeEach(function() {
                peerConnectionFactory = new PeerConnectionFactory(rtcObjectFactory, logger, ICE_SERVERS, CHANNEL_STATE_TIMEOUT);
            });

            it("creates the ICE candidates", function() {
                var firstCreateIceServerResponse = ["server11", "server12"];
                var secondCreateIceServerResponse = ["server2"];
                var sequence = 0;
                rtcObjectFactory.createIceServers.and.callFake(function() {
                    return [firstCreateIceServerResponse, secondCreateIceServerResponse][sequence++];
                });

                peerConnectionFactory.createPeerConnection();

                expect(rtcObjectFactory.createIceServers).toHaveBeenCalledWith(ICE_SERVERS[0].urls, ICE_SERVERS[0].username, ICE_SERVERS[0].credential);
                expect(rtcObjectFactory.createIceServers).toHaveBeenCalledWith([ICE_SERVERS[1].url], ICE_SERVERS[1].username, ICE_SERVERS[1].credential);
                expect(rtcObjectFactory.createRTCPeerConnection).toHaveBeenCalledWith({
                    iceServers: firstCreateIceServerResponse.concat(secondCreateIceServerResponse)
                });
            });
        });

        describe("and there are unsupported ICE servers", function() {
            beforeEach(function() {
                peerConnectionFactory = new PeerConnectionFactory(rtcObjectFactory, logger, ICE_SERVERS, CHANNEL_STATE_TIMEOUT);
            });

            it("generates a peerConnectionConfig with the unsupported iceServers omitted", function() {
                var secondCreateIceServerResponse = ["server2"];
                var sequence = 0;
                rtcObjectFactory.createIceServers.and.callFake(function() {
                    return [null, secondCreateIceServerResponse][sequence++];
                });
                peerConnectionFactory.createPeerConnection();

                expect(rtcObjectFactory.createIceServers).toHaveBeenCalledWith(ICE_SERVERS[0].urls, ICE_SERVERS[0].username, ICE_SERVERS[0].credential);
                expect(rtcObjectFactory.createIceServers).toHaveBeenCalledWith([ICE_SERVERS[1].url], ICE_SERVERS[1].username, ICE_SERVERS[1].credential);
                expect(rtcObjectFactory.createRTCPeerConnection).toHaveBeenCalledWith({
                    iceServers: secondCreateIceServerResponse
                });
            });
        });

        describe("and there are no ICE servers", function() {

            beforeEach(function() {
                peerConnectionFactory = new PeerConnectionFactory(rtcObjectFactory, logger, null, CHANNEL_STATE_TIMEOUT);
            });

            it("generates a peerConnectionConfig with an empty iceServers array", function() {
                peerConnectionFactory.createPeerConnection();

                expect(rtcObjectFactory.createRTCPeerConnection).toHaveBeenCalledWith({
                    iceServers: []
                });
            });
        });
    });
});