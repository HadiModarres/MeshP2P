const assert = require('chai').assert;
const ListManager = require("../proximity/ListManager");

let listManager = new ListManager();

describe('ListManagerTests',function () {
    beforeEach(function () {
    });
    it('should add a global list', function () {
        listManager.addGlobalList("files", null);
        assert.isOk(listManager.getGlobalList("files"));
    });
    it('should be undefiend for non-existent list', function () {
        assert.notExists(listManager.getGlobalList());
    });
})
