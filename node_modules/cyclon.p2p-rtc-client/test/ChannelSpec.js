'use strict';

var ClientMocks = require("./ClientMocks");
var Channel = require("../lib/Channel");
var Promise = require("bluebird");
var events = require("events");

describe("The Channel", function() {

	var REMOTE_PEER = {},
		CORRELATION_ID = 12345,
		REMOTE_DESCRIPTION = "remoteSDP",
		LOCAL_DESCRIPTION = "localSDP",
		LOCAL_ICE_CANDIDATES = [{
            candidate: 'd'
        }, {
            candidate: 'e'
        }, {
            candidate: 'f'
        }],
		CHANNEL_TYPE = "CHANNEL_TYPE",
		MESSAGE_TYPE = "MESSAGE_TYPE",
		MESSAGE_PAYLOAD = "MESSAGE_PAYLOAD",
		MESSAGE = {
			type: MESSAGE_TYPE,
			payload: MESSAGE_PAYLOAD
        },
        REMOTE_ICE_CANDIDATES = [{
            candidate: "a"
        }, {
            candidate: "b"
        }, {
            candidate: "c"
        }];

	var successCallback,
		failureCallback,
		peerConnection,
		signallingService,
		logger,
		channel;

	beforeEach(function() {
		successCallback = ClientMocks.createSuccessCallback();
		failureCallback = ClientMocks.createFailureCallback();
		peerConnection = ClientMocks.mockPeerConnection();
		signallingService = ClientMocks.mockSignallingService();
		logger = ClientMocks.mockLoggingService();
		channel = new Channel(REMOTE_PEER, CORRELATION_ID, peerConnection, signallingService, logger);

		peerConnection.getLocalDescription.and.returnValue(LOCAL_DESCRIPTION);
		peerConnection.getLocalIceCandidates.and.returnValue(LOCAL_ICE_CANDIDATES);
	});

	describe('when getting the remote peer', function() {

		it('returns the remote peer', function() {
			expect(channel.getRemotePeer()).toBe(REMOTE_PEER);
		});
	});

	describe('when creating an offer', function() {

		var createOfferResult;

		beforeEach(function() {
			createOfferResult = "CREATE_OFFER_RESULT";
			peerConnection.createOffer.and.returnValue(createOfferResult);
		});

		it('delegates to the peer connection', function() {
			expect(channel.createOffer(CHANNEL_TYPE)).toBe(createOfferResult);
			expect(peerConnection.createOffer).toHaveBeenCalledWith();
		});
	});

	describe('when creating an answer', function() {

		var createAnswerResult;

		beforeEach(function() {
			createAnswerResult = "CREATE_ANSWER_RESULT";
			peerConnection.createAnswer.and.returnValue(createAnswerResult);
		});

		it('delegates to the peer connection', function() {
			expect(channel.createAnswer(REMOTE_DESCRIPTION)).toBe(createAnswerResult);
			expect(peerConnection.createAnswer).toHaveBeenCalledWith(REMOTE_DESCRIPTION);
		});
	});

	describe('when sending an answer', function() {

		var sendAnswerResult;

		beforeEach(function() {
			sendAnswerResult = ClientMocks.mockPromise("SEND_ANSWER_RESULT");
			signallingService.sendAnswer.and.returnValue(sendAnswerResult);
		});

		it('delegates to the signalling service', function() {
			expect(channel.sendAnswer()).toBe(sendAnswerResult);
			expect(signallingService.sendAnswer).toHaveBeenCalledWith(REMOTE_PEER, CORRELATION_ID, LOCAL_DESCRIPTION, LOCAL_ICE_CANDIDATES);
		});

		it('sets the lastOutstandingPromise', function() {
		 	channel.sendAnswer();
		 	sendAnswerResult.isPending.and.returnValue(true);
		 	channel.cancel();
		 	expect(sendAnswerResult.cancel).toHaveBeenCalled();
		});
	});

	describe('when waiting for channel establishment', function() {

		var rtcDataChannel;

		beforeEach(function() {
			rtcDataChannel = ClientMocks.mockRtcDataChannel();
			peerConnection.waitForChannelEstablishment.and.returnValue(Promise.resolve(rtcDataChannel));
		});

		it('delegates to the peer connection', function(done) {
            channel.waitForChannelEstablishment().then(function() {
                expect(peerConnection.waitForChannelEstablishment).toHaveBeenCalled();
                done();
            });
		});
	});

	describe('when sending an offer', function() {

		var sendOfferResult;

		beforeEach(function() {
			sendOfferResult = ClientMocks.mockPromise();
			signallingService.sendOffer.and.returnValue(sendOfferResult);
			channel.createOffer(CHANNEL_TYPE);
		});

		it('delegates to the signalling service', function() {
			expect(channel.sendOffer(LOCAL_DESCRIPTION)).toBe(sendOfferResult);
			expect(signallingService.sendOffer).toHaveBeenCalledWith(REMOTE_PEER, CHANNEL_TYPE, LOCAL_DESCRIPTION);
		});

		it('stores the promise for later cancellation', function() {
			sendOfferResult.isPending.and.returnValue(true);
			channel.sendOffer();
			channel.cancel();
			expect(sendOfferResult.cancel).toHaveBeenCalled();
		});
	});

	describe('when waiting for an answer', function() {

		var waitForAnswerResult;

		beforeEach(function() {
			waitForAnswerResult = ClientMocks.mockPromise();
			signallingService.waitForAnswer.and.returnValue(waitForAnswerResult);
		});

		it('delegates to the signalling service', function() {
			expect(channel.waitForAnswer()).toBe(waitForAnswerResult);
		});

		it('stores the promise for later cancellation', function() {
			waitForAnswerResult.isPending.and.returnValue(true);
			channel.waitForAnswer();
			channel.cancel();
			expect(waitForAnswerResult.cancel).toHaveBeenCalled();
		});
	});

	describe('when handling an answer', function() {

		var handleAnswerResult;

		beforeEach(function() {
			handleAnswerResult = "HANDLE_ANSWER_RESULT";
			peerConnection.handleAnswer.and.returnValue(handleAnswerResult);
		});

		it('delegates to the peer connection', function() {
			expect(channel.handleAnswer()).toBe(handleAnswerResult);
		});
	});


    describe("when listening for remote ICE candidates", function() {

        var CANDIDATE_EVENT_ID = "candidates-"+REMOTE_PEER.id+"-"+CORRELATION_ID;

        describe("and a correlation ID has been determined", function() {

            beforeEach(function() {
                channel.startListeningForRemoteIceCandidates();
            });

            it("adds a candidates listener to the signalling service", function() {
                expect(signallingService.on).toHaveBeenCalledWith(CANDIDATE_EVENT_ID, jasmine.any(Function));
            });
        });

        describe("and remote candidates arrive", function() {

            beforeEach(function() {
                signallingService = new events.EventEmitter();
                channel = new Channel(REMOTE_PEER, CORRELATION_ID, peerConnection, signallingService, logger);
                channel.startListeningForRemoteIceCandidates();
            });

            it("delegates to the PeerConnection to process candidates as they are received", function() {
                signallingService.emit(CANDIDATE_EVENT_ID, REMOTE_ICE_CANDIDATES);
                expect(peerConnection.processRemoteIceCandidates(REMOTE_ICE_CANDIDATES));
            });
        });
    });

    describe("when sending ICE candidates", function() {

        beforeEach(function() {
            channel.startSendingIceCandidates();
        });

        it("adds a listener to the PeerConnection for new ICE candidates", function() {
            expect(peerConnection.on).toHaveBeenCalledWith("iceCandidates", jasmine.any(Function));
        });

        it("tells the peerConnection to start emitting any cached candidates", function() {
            expect(peerConnection.startEmittingIceCandidates).toHaveBeenCalled();
        });

        describe("and candidates are gathered", function() {
            beforeEach(function() {
                peerConnection = new events.EventEmitter();
                peerConnection.startEmittingIceCandidates = jasmine.createSpy();
                signallingService.sendIceCandidates.and.returnValue(Promise.resolve(null));
                channel = new Channel(REMOTE_PEER, CORRELATION_ID, peerConnection, signallingService, logger);
                channel.startSendingIceCandidates();
                peerConnection.emit("iceCandidates", LOCAL_ICE_CANDIDATES);
            });

            it("sends them to the remote peer via the signalling service", function() {
                expect(signallingService.sendIceCandidates).toHaveBeenCalledWith(REMOTE_PEER, CORRELATION_ID, LOCAL_ICE_CANDIDATES);
            });
        });
    });

    describe("when stopping ICE candidate sending", function() {

        beforeEach(function() {
            channel.stopSendingIceCandidates();
        });

        it("removes the iceCandidates listener from the PeerConnection", function() {
            expect(peerConnection.removeAllListeners).toHaveBeenCalledWith("iceCandidates");
        });
    });

	describe('when waiting for a channel to open', function() {

		var waitForChannelToOpenResult,
			rtcDataChannel;

		beforeEach(function() {
			rtcDataChannel = ClientMocks.mockRtcDataChannel();
			waitForChannelToOpenResult = Promise.resolve(rtcDataChannel);
			peerConnection.waitForChannelToOpen.and.returnValue(waitForChannelToOpenResult);
		});

		it('delegates to the peer connection', function() {
			channel.waitForChannelToOpen();
			expect(peerConnection.waitForChannelToOpen).toHaveBeenCalled();
		});

		it('starts listening for messages on the opened channel', function(done) {
            channel.waitForChannelToOpen().then(function() {
                expect(rtcDataChannel.onmessage).toEqual(jasmine.any(Function));
                done();
            });
		});
	});

	describe('when sending a message', function() {

		it('throws an error if the channel is not yet established', function() {
			expect(function() {
				channel.send(MESSAGE_TYPE, "This won't work");
			}).toThrow();
		});

		describe('and the channel has been established', function() {
			var rtcDataChannel;

			beforeEach(function(done) {
                rtcDataChannel = ClientMocks.mockRtcDataChannel();
                peerConnection.waitForChannelToOpen.and.returnValue(Promise.resolve(rtcDataChannel));
                channel.waitForChannelToOpen().then(function() {
                    done();
                });
			});

			it('throws an error if the readyState is anything other than "open"', function() {
				rtcDataChannel.readyState = "something other than 'open'";
				expect(function() {
					channel.send(MESSAGE_TYPE, "neither will this");
				}).toThrow();
			});

			it('sends the message on the data channel if the readyState is open', function() {
				rtcDataChannel.readyState = "open";
				channel.send(MESSAGE_TYPE, MESSAGE_PAYLOAD);
				expect(rtcDataChannel.send).toHaveBeenCalledWith(JSON.stringify(MESSAGE));
			});

			it('sends an empty object as the messsage when no message payload is specified', function() {
				rtcDataChannel.readyState = "open";
				channel.send(MESSAGE_TYPE);
				expect(rtcDataChannel.send).toHaveBeenCalledWith(JSON.stringify({
					type: MESSAGE_TYPE,
					payload: {}
				}));
			});
		});
	});

	describe('when receiving a message', function() {

		var RECEIVE_TIMEOUT_MS = 100;

		it('will reject with failure if the channel is not established', function(done) {

            channel.receive(MESSAGE_TYPE, RECEIVE_TIMEOUT_MS)
                .catch(function() {
                    done();
                });
		});

		describe("And the channel is established", function() {

			var rtcDataChannel;

			beforeEach(function(done) {
                rtcDataChannel = ClientMocks.mockRtcDataChannel();
                peerConnection.waitForChannelToOpen.and.returnValue(Promise.resolve(rtcDataChannel));
                channel.waitForChannelToOpen().then(function() {
                    done();
                });
			});

			it('will reject with failure if the readyState is anything other than "open"', function(done) {
				rtcDataChannel.readyState = "something other than 'open'";

                channel.receive(MESSAGE_TYPE, RECEIVE_TIMEOUT_MS)
                    .catch(function() {
                        done();
                    });
			});

			describe('and the channel is in the open state', function() {

				beforeEach(function() {
					rtcDataChannel.readyState = "open";
				});

				it('will resolve with the message if it is received before the timeout', function(done) {
                    channel.receive(MESSAGE_TYPE, RECEIVE_TIMEOUT_MS)
                        .then(function(result) {
                            expect(result).toBe(MESSAGE_PAYLOAD);
                            done();
                        });

                    rtcDataChannel.onmessage({
                        data: JSON.stringify(MESSAGE)
                    });
				});

				it('will reject with a timeout error if the timeout expires before the message is received', function(done) {
					channel.receive(MESSAGE_TYPE, RECEIVE_TIMEOUT_MS)
                        .catch(Promise.TimeoutError, function() {
                            done();
                        });
				});

				it('will reject with a cancellation error if cancel is called before the message is received', function(done) {
                    channel.receive(MESSAGE_TYPE, RECEIVE_TIMEOUT_MS)
                        .then(successCallback)
                        .catch(Promise.CancellationError, function() {
                            done();
                        })
                        .cancel();
				});

				it('will return any unhandled messages before returning new ones', function(done) {
					rtcDataChannel.onmessage({
						data: JSON.stringify(MESSAGE)
					});
					
					channel.receive(MESSAGE_TYPE, RECEIVE_TIMEOUT_MS)
						.then(function(result) {
                            expect(result).toBe(MESSAGE_PAYLOAD);
                            done();
                        });
				});
			});
		});
	});

	describe('when closing', function() {

		beforeEach(function() {
			channel.close();
		});

		it('calls close on the peerConnection', function() {
			expect(peerConnection.close).toHaveBeenCalled();
		});
	});
});
