'use strict';

var ClientMocks = require("./ClientMocks");
var LocalBootstrap = require("../lib/LocalBootstrap");

describe("The local bootstrap", function() {

    var localNode;

    beforeEach(function() {
        localNode = ClientMocks.mockCyclonNode();
    });

    it("returns the next peer in sequence when bootstrapping", function(done) {
        localNode.getId.and.returnValue("5");
        new LocalBootstrap(10).getInitialPeerSet(localNode, 5).then(function(result) {
            expect(result).toEqual([{id:"6", age:0}]);
            done();
        });
    });
});