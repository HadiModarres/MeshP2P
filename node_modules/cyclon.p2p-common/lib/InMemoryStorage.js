'use strict';

/**
	An in-memory (partial) implementation of the DOM storage interface
*/
function InMemoryStorage() {

	var store = {};
    var self = this;

	this.getItem = function(key) {
		return store[key] || null;
	};

	this.setItem = function(key, value) {
		store[key] = value;
        updateLength();
	};

	this.removeItem = function(key) {
		delete store[key];
        updateLength();
	};

	this.clear = function() {
		store = {};
        updateLength();
	};

    function updateLength() {
        self.length = Object.keys(store).length
    }

    updateLength();
}

module.exports = InMemoryStorage;