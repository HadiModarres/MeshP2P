'use strict';

var Utils = require("cyclon.p2p-common");
var cyclon = require("../lib/index");
var ClientMocks = require("./ClientMocks");

describe("The cyclon-lib export", function() {

    var comms, bootstrap;

    beforeEach(function() {
        comms = ClientMocks.mockComms();
        bootstrap = ClientMocks.mockBootstrap();
    });

	it("exports a builder function", function() {
		expect(cyclon.builder).toEqual(any(Function));
	});

	describe("the builder", function() {
		it("builds a CyclonNode", function() {
			expect(cyclon.builder(comms, bootstrap).build() instanceof cyclon.CyclonNode).toBeTruthy();
		});

		it("allows specification of the logger", function() {
			expect(cyclon.builder(comms, bootstrap).withLogger(Utils.consoleLogger()).build() instanceof cyclon.CyclonNode).toBeTruthy();
		});

		it("allows specification of the number of neigbours", function() {
			expect(cyclon.builder(comms, bootstrap).withNumNeighbours(10).build() instanceof cyclon.CyclonNode).toBeTruthy();
		});

        it("allows specification of the bootstrap size", function() {
            expect(cyclon.builder(comms, bootstrap).withBootstrapSize(10).build() instanceof cyclon.CyclonNode).toBeTruthy();
        });

        it("allows specification of the shuffle size", function() {
			expect(cyclon.builder(comms, bootstrap).withShuffleSize(10).build() instanceof cyclon.CyclonNode).toBeTruthy();
		});

		it("allows specification of the storage", function() {
			expect(cyclon.builder(comms, bootstrap).withStorage(Utils.newInMemoryStorage()).build() instanceof cyclon.CyclonNode).toBeTruthy();
		});

		it("allows specification of metadata providers", function() {
			expect(cyclon.builder(comms, bootstrap).withMetadataProviders([]).build() instanceof cyclon.CyclonNode).toBeTruthy();
		});

		it("allows specification of async exec service", function() {
			expect(cyclon.builder(comms, bootstrap).withAsyncExecService(Utils.asyncExecService()).build() instanceof cyclon.CyclonNode).toBeTruthy();
		});

		it("allows specification of tick interval ms", function() {
			expect(cyclon.builder(comms, bootstrap).withTickIntervalMs(1000).build() instanceof cyclon.CyclonNode).toBeTruthy();
		});
	});
});