
var DELAY_BEFORE_RETRY_MS = 1000 * 5;
var NOT_ENOUGH_TIME_TO_RETRY = DELAY_BEFORE_RETRY_MS - 10;
var ENOUGH_TIME_TO_RETRY = DELAY_BEFORE_RETRY_MS + 10;
var ClientMocks = require("./ClientMocks");
var SignallingServerSelector = require("../lib/SignallingServerSelector");

describe("SignallingServerSelector", function() {

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

    var signallingServerSelector,
        signallingServerService,
        storage,
        timingService;

    beforeEach(function() {
        storage = ClientMocks.mockStorage();

        signallingServerService = ClientMocks.mockSignallingServerService();
        signallingServerService.getPreferredNumberOfSockets.and.returnValue(2);
        signallingServerService.getSignallingServerSpecs.and.returnValue([SIGNALLING_SPEC_1, SIGNALLING_SPEC_2, SIGNALLING_SPEC_3, SIGNALLING_SPEC_4]);

        timingService = ClientMocks.mockTimingService();
        timingService.getCurrentTimeInMilliseconds.and.returnValue(new Date().getTime());
        signallingServerSelector = new SignallingServerSelector(signallingServerService, storage, timingService, DELAY_BEFORE_RETRY_MS);
    });

    describe("When returning sorted list of servers", function() {

        it("will return the last connected servers at the top of the list", function() {
            storage.getItem.and.returnValue(JSON.stringify([SIGNALLING_SPEC_3.signallingApiBase, SIGNALLING_SPEC_2.signallingApiBase]));

            var serverSpecsInPriorityOrder = signallingServerSelector.getServerSpecsInPriorityOrder();
            expect(serverSpecsInPriorityOrder[0]).toEqual(SIGNALLING_SPEC_2);
            expect(serverSpecsInPriorityOrder[1]).toEqual(SIGNALLING_SPEC_3);
        });

        it("will return consistent ordering between invocations provided no disconnections have occurred", function() {
            var firstServerSpecsInPriorityOrder = signallingServerSelector.getServerSpecsInPriorityOrder();

            expect(firstServerSpecsInPriorityOrder).toEqual(signallingServerSelector.getServerSpecsInPriorityOrder());
        });

        it("will filter items which were too recently disconnected from", function() {
            signallingServerSelector.flagDisconnection(SIGNALLING_SPEC_3.signallingApiBase);

            var disconnectionTime = timingService.getCurrentTimeInMilliseconds();

            timingService.getCurrentTimeInMilliseconds.and.returnValue(disconnectionTime + NOT_ENOUGH_TIME_TO_RETRY);
            expect(signallingServerSelector.getServerSpecsInPriorityOrder()).not.toContain(SIGNALLING_SPEC_3);

            timingService.getCurrentTimeInMilliseconds.and.returnValue(disconnectionTime + ENOUGH_TIME_TO_RETRY);
            expect(signallingServerSelector.getServerSpecsInPriorityOrder()).toContain(SIGNALLING_SPEC_3);
        });
    });

    it('will write last connected servers to storage', function() {
        signallingServerSelector.setLastConnectedServers(["aaa", "bbb"]);

        expect(storage.setItem).toHaveBeenCalledWith("CyclonJSLastConnectedServerList", ["aaa", "bbb"]);
    });
});