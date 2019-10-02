'use strict';

const { GuidGenerator } = require("../lib/GuidGenerator");

describe("The GuidGenerator", function() {

    it("generates GUIDs", function() {
        expect(GuidGenerator()).toMatch(/[\da-f]{8}\-[\da-f]{4}\-[\da-f]{4}\-[\da-f]{4}\-[\da-f]{12}/);
    });
});