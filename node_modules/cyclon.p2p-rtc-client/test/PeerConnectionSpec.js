'use strict';

var Promise = require("bluebird");
var PeerConnection = require("../lib/PeerConnection");
var ClientMocks = require("./ClientMocks");

describe("The peer connection", function () {

    var CHANNEL_STATE_TIMEOUT_MS = 100;
    var LOCAL_DESCRIPTION = "LOCAL_DESCRIPTION";
    var REMOTE_DESCRIPTION = "REMOTE_DESCRIPTION";
    var REMOTE_ICE_CANDIDATES = [{
        candidate: "a"
    }, {
        candidate: "b"
    }, {
        candidate: "c"
    }];
    var REMOTE_DESCRIPTION_PREFIX = "RD_";
    var REMOTE_CANDIDATE_PREFIX = "RC_";

    function remoteDescriptionFor(string) {
        return REMOTE_DESCRIPTION_PREFIX + string;
    }

    function remoteCandidateFor(string) {
        return REMOTE_CANDIDATE_PREFIX + string;
    }

    var peerConnection,
        rtcPeerConnection,
        rtcDataChannel,
        rtcObjectFactory,
        loggingService;

    var successCallback, failureCallback;

    beforeEach(function () {
        successCallback = ClientMocks.createSuccessCallback();
        failureCallback = ClientMocks.createFailureCallback();

        rtcObjectFactory = ClientMocks.mockRtcObjectFactory();
        rtcPeerConnection = ClientMocks.mockRtcPeerConnection();
        rtcDataChannel = ClientMocks.mockRtcDataChannel();
        loggingService = ClientMocks.mockLoggingService();

        //
        // Mock behaviour
        //
        rtcPeerConnection.createDataChannel.and.returnValue(rtcDataChannel);

        rtcPeerConnection.setLocalDescription.and.callFake(function(sdp, success) {
            setTimeout(success, 1);
        });
        rtcPeerConnection.setRemoteDescription.and.callFake(function(sdp, success) {
            setTimeout(success, 1);
        });
        rtcObjectFactory.createRTCSessionDescription.and.callFake(function (sessionDescriptionString) {
            return remoteDescriptionFor(sessionDescriptionString);
        });
        rtcObjectFactory.createRTCIceCandidate.and.callFake(function (candidateString) {
            return remoteCandidateFor(candidateString);
        });

        peerConnection = new PeerConnection(rtcPeerConnection, rtcObjectFactory, loggingService, CHANNEL_STATE_TIMEOUT_MS);
    });

    describe("when creating an offer", function () {

        it("creates a data channel", function () {
            peerConnection.createOffer().then(successCallback).catch(failureCallback);
            expect(rtcPeerConnection.createDataChannel).toHaveBeenCalledWith('cyclonShuffleChannel');
            expect(failureCallback).not.toHaveBeenCalled();
            expect(successCallback).not.toHaveBeenCalled();
        });

        it("emits a channelCreated event", function(done) {
            peerConnection.on("channelCreated", function(channel) {
                expect(channel).toEqual(rtcDataChannel);
                done();
            });
            peerConnection.createOffer().then(successCallback).catch(failureCallback);
        });

        describe("and offer creation fails", function () {

            beforeEach(function () {
                rtcPeerConnection.createOffer.and.callFake(function (success, failure) {
                    failure();
                });
            });

            it("calls reject", function (done) {
                peerConnection.createOffer().then(successCallback).catch(done);
            });
        });

        describe("and offer creation succeeds", function () {

            beforeEach(function (done) {
                rtcPeerConnection.createOffer.and.callFake(function (successCallback) {
                    successCallback(LOCAL_DESCRIPTION);
                });
                peerConnection.createOffer().then(done);
            });

            it("sets the local description", function () {
                expect(rtcPeerConnection.setLocalDescription).toHaveBeenCalledWith(LOCAL_DESCRIPTION, jasmine.any(Function), jasmine.any(Function));
            });

            it('makes the local description available via the getter', function () {
                expect(peerConnection.getLocalDescription()).toBe(LOCAL_DESCRIPTION);
            });
        });

        describe("and cancel is called before it completes", function () {

            it("rejects with a cancellation error", function (done) {

                peerConnection.createOffer()
                    .catch(Promise.CancellationError,function () {
                        expect(rtcPeerConnection.createDataChannel).toHaveBeenCalledWith('cyclonShuffleChannel');
                        done();
                    }).cancel();
            });
        });
    });

    describe("when gathering ICE candidates", function () {

        it("will filter duplicate candidates produced", function () {
            var firstIceCandidate = "123";
            var secondIceCandidate = "456";
            var thirdIceCandidate = "123";

            var iceCandidatesHandler = jasmine.createSpy();
            peerConnection.on("iceCandidates", iceCandidatesHandler);

            peerConnection.startEmittingIceCandidates();

            rtcPeerConnection.onicecandidate({
                candidate: firstIceCandidate
            });
            rtcPeerConnection.onicecandidate({
                candidate: secondIceCandidate
            });
            rtcPeerConnection.onicecandidate({
                candidate: thirdIceCandidate
            });

            expect(iceCandidatesHandler).toHaveBeenCalledWith([firstIceCandidate]);
            expect(iceCandidatesHandler).toHaveBeenCalledWith([secondIceCandidate]);
        });

        it("will store the unique candidates and make them available via a getter", function() {

            var firstIceCandidate = "123";
            var secondIceCandidate = "456";
            var thirdIceCandidate = "123";

            rtcPeerConnection.onicecandidate({
                candidate: firstIceCandidate
            });
            rtcPeerConnection.onicecandidate({
                candidate: secondIceCandidate
            });
            rtcPeerConnection.onicecandidate({
                candidate: thirdIceCandidate
            });

            expect(peerConnection.getLocalIceCandidates()).toEqual([firstIceCandidate, secondIceCandidate]);
        });
    });

    describe("when creating an answer", function () {

        it("will set the remote description", function (done) {
            peerConnection.createAnswer(REMOTE_DESCRIPTION)
                .then(successCallback).catch(failureCallback);

            setTimeout(function () {
                expect(rtcPeerConnection.setRemoteDescription).toHaveBeenCalledWith(remoteDescriptionFor(REMOTE_DESCRIPTION), jasmine.any(Function), jasmine.any(Function));
                expect(rtcPeerConnection.createAnswer).toHaveBeenCalledWith(jasmine.any(Function), jasmine.any(Function));

                expect(successCallback).not.toHaveBeenCalled();
                expect(failureCallback).not.toHaveBeenCalled();

                done();
            }, 10);
        });

        describe("and answer creation succeeds", function () {

            beforeEach(function (done) {
                rtcPeerConnection.createAnswer.and.callFake(function (successCallback) {
                    successCallback(LOCAL_DESCRIPTION);
                });

                peerConnection.createAnswer(REMOTE_DESCRIPTION, REMOTE_ICE_CANDIDATES).then(done);
            });

            it("sets the local description", function () {
                expect(rtcPeerConnection.setLocalDescription).toHaveBeenCalledWith(LOCAL_DESCRIPTION, jasmine.any(Function), jasmine.any(Function));
            });
        });

        describe("and answer creation fails", function () {

            beforeEach(function (done) {
                rtcPeerConnection.createAnswer.and.callFake(function (success, failure) {
                    failure();
                });

                peerConnection.createAnswer(REMOTE_DESCRIPTION, REMOTE_ICE_CANDIDATES).catch(done);
            });

            it("doesn't set the local description and rejects", function () {
                expect(rtcPeerConnection.setLocalDescription).not.toHaveBeenCalled();
            });
        });

        describe("and cancel is called while it's in progress", function () {

            beforeEach(function (done) {
                peerConnection.createAnswer(REMOTE_DESCRIPTION, REMOTE_ICE_CANDIDATES)
                    .catch(Promise.CancellationError, done)
                    .cancel();
            });

            it("doesn't set the local description and rejects with a cancellation error", function () {
                expect(rtcPeerConnection.setLocalDescription).not.toHaveBeenCalled();
            });
        });
    });

    describe("when a channel is created", function() {

        it("emits a channel created event", function(done) {
            peerConnection.on("channelCreated", function(channel) {
                expect(channel).toBe(rtcDataChannel);
                done();
            });
            rtcPeerConnection.ondatachannel({
                channel: rtcDataChannel
            });
        });
    });

    describe("when waiting for an open channel", function () {

        beforeEach(function (done) {
            rtcPeerConnection.createOffer.and.callFake(function (success) {
                success();
            });
            peerConnection.createOffer().then(done);
        });

        describe("and the channel is already opened", function () {

            beforeEach(function () {
                rtcDataChannel.readyState = "open";
            });

            it("resolves the already opened channel", function (done) {
                peerConnection.waitForChannelToOpen().then(function (result) {
                    expect(result).toBe(rtcDataChannel);
                    done();
                });
            });
        });

        describe("and the channel is not already opened", function () {

            beforeEach(function () {
                rtcDataChannel.readyState = "connecting";
            });

            describe("and the channel opens successfully", function () {

                it("passes the open channel to resolve", function (done) {

                    peerConnection.waitForChannelToOpen().then(function (result) {
                        expect(result).toBe(rtcDataChannel);
                        done();
                    });

                    rtcDataChannel.onopen();
                });
            });

            describe("and a timeout occurs before the channel is opened", function () {

                beforeEach(function (done) {
                    peerConnection.waitForChannelToOpen().catch(Promise.TimeoutError, done);
                });

                it("clears the channel onopen listener", function () {
                    expect(rtcDataChannel.onopen).toBeNull();
                });
            });

            describe("and cancel is called before the channel is opened", function () {

                beforeEach(function (done) {
                    peerConnection.waitForChannelToOpen()
                        .catch(Promise.CancellationError, done)
                        .cancel();
                });

                it("clears the channel onopen listener", function () {
                    expect(rtcDataChannel.onopen).toBeNull();
                });
            });
        });

        describe("and the channel's readyState is undefined", function () {

            beforeEach(function () {
                rtcDataChannel.readyState = undefined;
            });

            it("waits for the channel to open", function (done) {
                peerConnection.waitForChannelToOpen()
                    .catch(Promise.TimeoutError, done);
            });
        });

        describe("and the channel is in a state other than 'connecting', 'open' or undefined", function () {

            beforeEach(function () {
                rtcDataChannel.readyState = "closing";
            });

            it("rejects with an error", function (done) {
                var self = this;
                peerConnection.waitForChannelToOpen()
                    .catch(Promise.CancellationError, Promise.TimeoutError, function(e) {
                        self.fail(e);
                    })
                    .catch(done);
            });
        });
    });

    describe("when handling an answer", function () {

        beforeEach(function () {
            peerConnection.createOffer();
            peerConnection.handleAnswer({
                sessionDescription: REMOTE_DESCRIPTION
            });
        });

        it("sets the remote description", function () {
            expect(rtcPeerConnection.setRemoteDescription).toHaveBeenCalledWith(remoteDescriptionFor(REMOTE_DESCRIPTION), jasmine.any(Function), jasmine.any(Function));
        });
    });

    describe("when processing remote ICE candidates", function() {

        beforeEach(function(done) {
            rtcPeerConnection.createOffer.and.callFake(function(success) {
                setTimeout(function() {
                    success(LOCAL_DESCRIPTION);
                }, 1);
            });
            peerConnection.createOffer().then(done);
        });

        describe("and no answer has yet been received", function() {

            beforeEach(function() {
                peerConnection.processRemoteIceCandidates(REMOTE_ICE_CANDIDATES);
            });

            it("delays setting the remote candidates on the RTC peer connection", function() {
                expect(rtcPeerConnection.addIceCandidate).not.toHaveBeenCalled();
            });
        });

        describe("and an answer has been received", function() {

            beforeEach(function(done) {
                peerConnection.handleAnswer({
                    sessionDescription: REMOTE_DESCRIPTION
                }).then(function() {
                    peerConnection.processRemoteIceCandidates(REMOTE_ICE_CANDIDATES);
                    done();
                });
            });

            it("adds the remote ICE candidates to the RTCPeerConnection", function() {
                expect(rtcPeerConnection.addIceCandidate).toHaveBeenCalledWith(remoteCandidateFor(REMOTE_ICE_CANDIDATES[0]));
                expect(rtcPeerConnection.addIceCandidate).toHaveBeenCalledWith(remoteCandidateFor(REMOTE_ICE_CANDIDATES[1]));
                expect(rtcPeerConnection.addIceCandidate).toHaveBeenCalledWith(remoteCandidateFor(REMOTE_ICE_CANDIDATES[2]));
            });
        });

        describe("and some candidates arrive before the answer", function() {

            beforeEach(function() {
                peerConnection.processRemoteIceCandidates(REMOTE_ICE_CANDIDATES);
            });

            it("adds them to the connection after the answer has been processed", function(done) {
                expect(rtcPeerConnection.addIceCandidate).not.toHaveBeenCalled();

                peerConnection.handleAnswer({
                    sessionDescription: REMOTE_DESCRIPTION
                }).then(function() {
                    expect(rtcPeerConnection.addIceCandidate).toHaveBeenCalledWith(remoteCandidateFor(REMOTE_ICE_CANDIDATES[0]));
                    expect(rtcPeerConnection.addIceCandidate).toHaveBeenCalledWith(remoteCandidateFor(REMOTE_ICE_CANDIDATES[1]));
                    expect(rtcPeerConnection.addIceCandidate).toHaveBeenCalledWith(remoteCandidateFor(REMOTE_ICE_CANDIDATES[2]));
                    done();
                });
            });
        });
    });

    describe("when closing", function () {

        beforeEach(function() {
            rtcDataChannel.onopen = "xx";
            rtcDataChannel.onclose = "xx";
            rtcDataChannel.onmessage = "xx";
            rtcDataChannel.onerror = "xx";

            peerConnection.createOffer().then(function() {});

            rtcPeerConnection.onicecandidate = "xx";
            rtcPeerConnection.ondatachannel = "xx";
        });

        it("calls close on and removes the listeners from the data channel and peer connection", function () {
            peerConnection.close();

            expect(rtcDataChannel.onopen).toBeNull();
            expect(rtcDataChannel.onmessage).toBeNull();
            expect(rtcDataChannel.onerror).toBeNull();
            expect(rtcPeerConnection.ondatachannel).toBeNull();
            expect(rtcPeerConnection.onicecandidate).toBeNull();

            expect(rtcDataChannel.close).toHaveBeenCalled();
            expect(rtcPeerConnection.close).toHaveBeenCalled();
        });
    });

    describe("when cancelling", function () {

        it("will cancel the last outstanding promise if it's pending", function (done) {

            peerConnection.createAnswer(REMOTE_DESCRIPTION, REMOTE_ICE_CANDIDATES)
                .catch(Promise.CancellationError, function() {
                    done();
                });

            peerConnection.cancel();
        });

        describe("and the last outstanding promise is completed", function() {

            beforeEach(function(done) {
                rtcPeerConnection.createAnswer.and.callFake(function (successCallback) {
                    successCallback(LOCAL_DESCRIPTION);
                });

                peerConnection.createAnswer(REMOTE_DESCRIPTION, REMOTE_ICE_CANDIDATES)
                    .then(done)
                    .catch(Promise.CancellationError, failureCallback);
            });

            it("will not cancel the last outstanding promise", function (done) {
                peerConnection.cancel();

                setTimeout(function () {
                    expect(failureCallback).not.toHaveBeenCalled();
                    done();
                }, 10);
            });
        });
    });
});