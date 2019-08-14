'use strict';

var NeighbourSet = require("../lib/NeighbourSet");
var ClientMocks = require("./ClientMocks");

describe("The neighbour set", function() {

    function createNeighbour(id, age) {
        return {id: id, age: age};
    }

    var loggingService,
        theSet;

    beforeEach(function() {
        loggingService = ClientMocks.mockLoggingService();
        theSet = new NeighbourSet(loggingService);
    });

    it("should insert a neigbour", function() {
        theSet.insert(createNeighbour(123, 1));
    });

    it("should report correctly the presence of a neighbour", function() {
        var theNeighbour = createNeighbour(123, 1);

        theSet.insert(theNeighbour);

        expect(theSet.contains(theNeighbour.id)).toBe(true);
    });

    it("should throw an error when a neighbour is inserted with a missing ID", function() {

        expect(function() {
            var nullIdNeighbour = createNeighbour(123, 1);
            nullIdNeighbour.id = null;
            theSet.insert(nullIdNeighbour);
        }).toThrow();

        expect(function() {
            var undefinedIdNeighbour = createNeighbour(123, 1);
            delete undefinedIdNeighbour["id"];
            theSet.insert(undefinedIdNeighbour);
        }).toThrow();
    });

    it("should return a copy of its contents when getContents is called", function() {
        theSet.insert(createNeighbour(123, 5));
        var contents = theSet.getContents();
        delete contents["123"];
        expect(contents).toEqual({});
        expect(theSet.contains("123")).toBeTruthy();
    });

    describe("when finding the oldest neighbour's ID", function() {
        it("should correctly identify the oldest neighbour", function() {

            theSet.insert(createNeighbour('a',1));
            theSet.insert(createNeighbour('b',5));
            theSet.insert(createNeighbour('c',8));
            theSet.insert(createNeighbour('oldest',9));
            theSet.insert(createNeighbour('e',7));
            theSet.insert(createNeighbour('f',3));

            expect(theSet.findOldestId()).toBe('oldest');
        });

        it("should return undefined when there are no neighbours", function() {
            expect(theSet.findOldestId()).toBeUndefined();
        });
    });


    describe("when selecting the shuffle set", function() {
        it("should assemble a random shuffle set of size N including the eldest node", function() {

            theSet.insert(createNeighbour('a',1));
            theSet.insert(createNeighbour('b',5));
            theSet.insert(createNeighbour('c',8));
            theSet.insert(createNeighbour('oldest',9)); // Oldest
            theSet.insert(createNeighbour('e',7));
            theSet.insert(createNeighbour('f',3));

            var shuffleSet = theSet.selectShuffleSet(4);
            expect(shuffleSet.length).toBe(4);

            var chosenIds = shuffleSet.map(function(item) {
                return item.id;
            });
            expect(chosenIds).toContain('oldest');
        });

        it("should return all nodes if there are less than the specified number nodes to be picked", function() {

            theSet.insert(createNeighbour('a',1));
            theSet.insert(createNeighbour('oldest',9)); // Oldest

            var shuffleSet = theSet.selectShuffleSet(5);
            expect(shuffleSet.length).toBe(2);

            var chosenIds = shuffleSet.map(function(item) {
                return item.id;
            });
            expect(chosenIds).toContain('oldest');
            expect(chosenIds).toContain('a');
        });

        it("should return an empty list if there are no nodes", function() {
            expect(theSet.selectShuffleSet(5).length).toBe(0);
        });
    });


    describe("when generating a random sample", function() {
        it("should return a random sample of size N", function() {

            theSet.insert(createNeighbour('a',1));
            theSet.insert(createNeighbour('b',5));
            theSet.insert(createNeighbour('c',8));
            theSet.insert(createNeighbour('oldest',9)); // Oldest
            theSet.insert(createNeighbour('e',7));
            theSet.insert(createNeighbour('f',3));

            expect(theSet.randomSelection(4).length).toBe(4);
        });

        it("should return all nodes when there are less than the number requested", function() {

            theSet.insert(createNeighbour('a',1));
            theSet.insert(createNeighbour('b',5));
            theSet.insert(createNeighbour('c',8));

            expect(theSet.randomSelection(4).length).toBe(3);
        });

        it("should return an empty list when there are no neighbours", function() {
            expect(theSet.randomSelection(4).length).toBe(0);
        });
    });

    it("should increment the age of each neighbour by one", function() {

        theSet.insert(createNeighbour('a',1));
        theSet.insert(createNeighbour('b',5));
        theSet.insert(createNeighbour('c',8));

        theSet.incrementAges();

        expect(theSet.get('a').age).toBe(2);
        expect(theSet.get('b').age).toBe(6);
        expect(theSet.get('c').age).toBe(9);
    });

    it("should correctly return the number of neigbours in the set", function() {

        expect(theSet.size()).toBe(0);

        theSet.insert(createNeighbour('a', 1));
        expect(theSet.size()).toBe(1);

        theSet.insert(createNeighbour('b', 2));
        expect(theSet.size()).toBe(2);

        theSet.remove('a');
        expect(theSet.size()).toBe(1);
    });

    describe("when merging a node pointer", function() {

        var oldNode = {id: 10, age: 100, seq: 5, comms: "OLD_COMMS", metadata: "OLD_METADATA"};
        var newNode = {id: 10, age: 0, seq: 10, comms: "NEW_COMMS", metadata: "NEW_METADATA"};

        it("should replace everything but the age when merging a newer pointer", function() {

            theSet.insert(oldNode);
            theSet.mergeNodePointerIfNewer(newNode);

            var resultingNode = theSet.get(oldNode.id);

            expect(resultingNode.age).toEqual(oldNode.age);
            expect(resultingNode.seq).toEqual(newNode.seq);
            expect(resultingNode.comms).toEqual(newNode.comms);
            expect(resultingNode.metadata).toEqual(newNode.metadata);
        });

        it("should not replace anything when merging an older pointer", function() {

            theSet.insert(newNode);
            theSet.mergeNodePointerIfNewer(oldNode);

            expect(theSet.get(oldNode.id)).toEqual(newNode);
        });

        it("should not process a node not already present in the set", function() {

            theSet.mergeNodePointerIfNewer(oldNode);

            expect(theSet.get(oldNode.id)).toBeUndefined();
        });

        it("should fire a change:update event when a node is updated", function() {

            theSet.insert(oldNode);

            var changeListener = jasmine.createSpy();
            theSet.on("change", changeListener);

            theSet.mergeNodePointerIfNewer(newNode);
            expect(changeListener).toHaveBeenCalledWith("update", newNode);
        });

        it("should not fire a change event when no node is updated", function() {

            theSet.insert(newNode);

            var changeListener = jasmine.createSpy();
            theSet.on("change", changeListener);

            theSet.mergeNodePointerIfNewer(newNode);
            expect(changeListener).not.toHaveBeenCalled();
        });

        it("should not process new node pointers without a sequence number (for backwards compatibility, this can probably go)", function() {

            delete newNode["seq"];
            theSet.insert(oldNode);

            var changeListener = jasmine.createSpy();
            theSet.on("change", changeListener);

            theSet.mergeNodePointerIfNewer(newNode);
            expect(theSet.get(oldNode.id)).toEqual(oldNode);
        });

        it("should not process existing node pointers without a sequence number (for backwards compatibility, this can probably go)", function() {

            delete oldNode["seq"];
            theSet.insert(oldNode);

            var changeListener = jasmine.createSpy();
            theSet.on("change", changeListener);

            theSet.mergeNodePointerIfNewer(newNode);
            expect(theSet.get(oldNode.id)).toEqual(oldNode);
        });

    });
});