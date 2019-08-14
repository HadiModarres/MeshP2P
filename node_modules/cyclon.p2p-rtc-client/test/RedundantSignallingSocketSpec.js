'use strict';

var Utils = require("cyclon.p2p-common");
var ClientMocks = require("./ClientMocks");
var RedundantSignallingSocket = require("../lib/RedundantSignallingSocket");
var events = require("events");

describe('The RedundantSignallingSocket', function() {

	var SIGNALLING_SPEC_1 = {
			signallingApiBase: "API_BASE_1"
		},
		SIGNALLING_SPEC_2 = {
			signallingApiBase: "API_BASE_2"
		},
		SIGNALLING_SPEC_3 = {
			signallingApiBase: "API_BASE_3"
		},
		SIGNALLING_SPEC_4 = {
			signallingApiBase: "API_BASE_4"
		};

	var signallingServerService,
		socketFactory,
		loggingService,
		asyncExecService,
		redundantSignallingSocket,
        signallingServerSelector,
		connectedServerSpecs,
		connectedSockets,
		connectivityCheckCallback,
		currentTime,
        signallingService;

	beforeEach(function() {
		currentTime = new Date().getTime();
		connectedServerSpecs = [];
		connectedSockets = [];
		signallingServerService = ClientMocks.mockSignallingServerService();
		socketFactory = ClientMocks.mockSocketFactory();
		loggingService = ClientMocks.mockLoggingService();
		asyncExecService = ClientMocks.mockAsyncExecService();
		signallingServerSelector = ClientMocks.mockSignallingServerSelector();
		signallingService = ClientMocks.mockSignallingService();

		redundantSignallingSocket = new RedundantSignallingSocket(signallingServerService, socketFactory, loggingService, asyncExecService, signallingServerSelector);

		socketFactory.createSocket.and.callFake(function(signallingSpec) {
			connectedServerSpecs.push(signallingSpec);
			var newSocket = new events.EventEmitter();
			newSocket.io = new events.EventEmitter();
			newSocket.disconnect = jasmine.createSpy('disconnect');
			connectedSockets.push(newSocket);
			return newSocket;
		});

		// static signalling socket preferring 2 of 4 total signalling servers
		signallingServerService.getPreferredNumberOfSockets.and.returnValue(2);
        signallingServerSelector.getServerSpecsInPriorityOrder.and.returnValue([SIGNALLING_SPEC_1, SIGNALLING_SPEC_2, SIGNALLING_SPEC_3, SIGNALLING_SPEC_4]);

		asyncExecService.setInterval.and.callFake(function(callback) {
			connectivityCheckCallback = callback;
		});
	});

	describe('when connecting to initial server set', function() {

		describe('once initialized', function() {
			beforeEach(function() {
				redundantSignallingSocket.connect(signallingService);
			});

			it('will connect to the number of servers specified', function() {
				expect(connectedServerSpecs.length).toEqual(2);
			});

			it('will schedule the connectivity check', function() {
				expect(connectivityCheckCallback).toEqual(jasmine.any(Function));
			});

			it('will send a register message when a socket connects', function() {
				var socketRegistered = false;
				connectedSockets[0].on("register", function() {
					socketRegistered = true;
				});
				connectedSockets[0].emit("connect");
				expect(socketRegistered).toBe(true);
			});

            it('will send a join message when a socket connects', function() {
                var roomsJoined = false;
                connectedSockets[0].on("join", function() {
                    roomsJoined = true;
                });
                connectedSockets[0].emit("connect");
                expect(roomsJoined).toBe(true);
            });

			it('will propagate answer events from the sockets', function() {
				var answerEvent = null;
				var ANSWER_EVENT = "ANSWER_EVENT";
				redundantSignallingSocket.on("answer", function(e) {
					answerEvent = e;
				});
				connectedSockets[0].emit("answer", ANSWER_EVENT);
				expect(answerEvent).toBe(ANSWER_EVENT);
			});

			it('will propagate offer events from the sockets', function() {
				var offerEvent = null;
				var OFFER_EVENT = "OFFER_EVENT";
				redundantSignallingSocket.on("offer", function(e) {
					offerEvent = e;
				});
				connectedSockets[1].emit("offer", OFFER_EVENT);
				expect(offerEvent).toBe(OFFER_EVENT);
			});
		});
	});

	describe('when connected to a server set', function() {

		beforeEach(function() {
			redundantSignallingSocket.connect(signallingService);
		});

		it('will flag disconnection from a server upon disconnect', function() {
			connectedSockets[0].emit("disconnect");
            expect(signallingServerSelector.flagDisconnection(connectedSockets[0].signallingApiBase));
		});

		it('will flag disconnection from a server upon error', function() {
			connectedSockets[0].emit("error");
            expect(signallingServerSelector.flagDisconnection(connectedSockets[0].signallingApiBase));
		});

		it('will flag disconnection from a server upon connect_error', function() {
			connectedSockets[0].io.emit("connect_error");
            expect(signallingServerSelector.flagDisconnection(connectedSockets[0].signallingApiBase))
		});

        it('connects to the next signalling server it is not already connected to as specified by the selector', function() {
            signallingServerSelector.getServerSpecsInPriorityOrder.and.returnValue([SIGNALLING_SPEC_2, SIGNALLING_SPEC_3, SIGNALLING_SPEC_4]);

            connectedSockets[0].emit("disconnect");

            expect(connectedServerSpecs[2]).toEqual(SIGNALLING_SPEC_3);
        });
	});

	describe('when executing connectivity checks', function() {

		beforeEach(function() {
			redundantSignallingSocket.connect(signallingService);
		});

		it('connects to an eligible server if the current number of connected servers is less than preferred', function() {
            signallingServerSelector.getServerSpecsInPriorityOrder.and.returnValue([]);
            connectedSockets[0].emit("disconnect");
            expect(connectedServerSpecs.length).toEqual(2);

            signallingServerSelector.getServerSpecsInPriorityOrder.and.returnValue([SIGNALLING_SPEC_2, SIGNALLING_SPEC_3, SIGNALLING_SPEC_4]);
            connectivityCheckCallback();
            expect(connectedServerSpecs[2]).toEqual(SIGNALLING_SPEC_3);
        });

		it('updates the registration with the signalling servers', function() {
			var firstSocketRegistered = false;
			var secondSocketRegistered = false;

			connectedSockets[0].on("register", function() {
				firstSocketRegistered = true;
			});

			connectedSockets[1].on("register", function() {
				secondSocketRegistered = true;
			});

			connectivityCheckCallback();

			expect(firstSocketRegistered).toBe(true);
			expect(secondSocketRegistered).toBe(true);
		});
	});
});
