'use strict';

const { ObfuscatingStorageWrapper } = require("../lib/ObfuscatingStorageWrapper");
const { InMemoryStorage } = require("../lib/InMemoryStorage");

describe("The tamper-resistant storage wrapper", function () {

    var KEY = "KEY",
        VALUE = "VALUE";

    var wrapper,
        storage;

    beforeEach(function () {
        storage = new InMemoryStorage();
        wrapper = new ObfuscatingStorageWrapper(storage);
    });

    it("stores strings", function () {
        var emptyLength = storage.length;
        wrapper.setItem(KEY, VALUE);
        expect(storage.length).toBe(emptyLength + 1);
    });

    it("stores and retrieves retrieves string items by key", function () {
        wrapper.setItem(KEY, VALUE);
        expect(wrapper.getItem(KEY)).toBe(VALUE);
    });

    it("stores and retrieves object items by key", function() {
        var valueObject = {
            "a": "xx",
            "b": "yy"
        };

        wrapper.setItem(KEY, valueObject);
        expect(wrapper.getItem(KEY)).toEqual(valueObject);
    });

    it("deletes stored values by key", function() {
        wrapper.setItem(KEY, VALUE);
        expect(wrapper.getItem(KEY)).toBe(VALUE);
        wrapper.removeItem(KEY);
        expect(wrapper.getItem(KEY)).toBe(null);
    });

    it("clears all items in the store", function() {
        wrapper.setItem(KEY, VALUE);
        expect(wrapper.getItem(KEY)).toBe(VALUE);
        wrapper.clear();
        expect(wrapper.getItem(KEY)).toBe(null);
    });
});