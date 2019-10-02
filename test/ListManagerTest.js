const assert = require('chai').assert;
const ListManager = require("../proximity/ListManager");
const chai = require("chai");


describe('ListManagerTests', function () {
    beforeEach(function () {
    });
    it('should add a global list', function () {
        let listManager = new ListManager();
        listManager.addGlobalList("files", null);
        assert.isOk(listManager.getGlobalList("files"));
    });
    it('should be undefiend for non-existent list', function () {
        let listManager = new ListManager();
        assert.notExists(listManager.getGlobalList());
    });
    it('should throw exception for adding existing global list', function () {
        let listManager = new ListManager();
        chai.expect(function (){
            listManager.addGlobalList("files", (a, b) => {
                return a + b;
            });
            listManager.addGlobalList("files", (a, b) => {
                return '';
            });
        }).to.throw(Error);
    })

    // it('should add neighbour to list', function () {
    //     let listManager = new ListManager();
    //     listManager.addGlobalList("sampleList", (a, b) => {
    //         return a + b;
    //     });
    //     listManager.addEntry("sampleList", {key: "dkf", value: "dff"});
    //     listManager.addNeighbor("sampleList", {key: {obj: 'hello'}, value: "34fd344"});
    //     let lists = listManager.getAllProximityLists("sampleList");
    //     assert.equal(lists.length, 1);
    //     assert.equal(lists[0].getElementCount(), 1);
    // });

    it('should remove a proximity list from global list', function () {
        let listManager = new ListManager();
        listManager.addGlobalList("sampleList", (a, b) => {
            return a + b;
        });
        listManager.addEntry("sampleList", {key: "dkf", value: "dff"});
        listManager.removeEntry("sampleList", {key: "dkf"});
        assert.equal(listManager.getAllProximityLists("sampleList").length, 0);
    });

    // it('should maintain multiple lists', function () {
    //     let listManager = new ListManager();
    //     listManager.proximityListSize=12;
    //     listManager.addGlobalList("Files", (a, b) => {
    //         return a + b;
    //     });
    //     listManager.addGlobalList("Names", (a, b) => {
    //         return a + b;
    //     });
    //     listManager.addEntry("Files", {key: "file1.jpg", value: "23adf324"});
    //     listManager.addEntry("Files", {key: "file2.jpg", value: "23adf324"});
    //     listManager.addEntry("Names", {key: "Jack", value: "23adf324"});
    //
    //     listManager.addNeighbor("Files", {key:"f.jpg"});
    //     listManager.addNeighbor("Files", {key:"b.txt"});
    //     listManager.addNeighbor("Names", {key:"Jo"});
    //     listManager.addNeighbor("Names", {key:"Jimmy"});
    //     listManager.addNeighbor("Names", {key:"Jacky"});
    //
    //     let fileCounts = listManager.getAllProximityLists("Files").map((value) => {
    //         return value.getElementCount();
    //     });
    //     let nameCounts = listManager.getAllProximityLists("Names").map((value) => {
    //         return value.getElementCount();
    //     });
    //
    //     assert.equal(fileCounts.reduce((previous, current) => {
    //         return previous + current
    //     }, 0), 4);
    //     assert.equal(nameCounts.reduce((previous, current) => {
    //         return previous + current
    //     }, 0), 3);
    //
    // });
});
