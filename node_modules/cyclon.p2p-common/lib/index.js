'use strict';

var AsyncExecService = require("./AsyncExecService");
var InMemoryStorage = require("./InMemoryStorage");
var ConsoleLogger = require("./ConsoleLogger");
var GuidGenerator = require("./GuidGenerator");
var ObfuscatingStorageWrapper = require("./ObfuscatingStorageWrapper");
var UnreachableError = require("./UnreachableError");

/**
 * Extract a random sample from an array of items using reservoir sampling
 *
 * @param inputArray The array to randomly choose items from
 * @param sampleSize The maximum number of items to sample
 * @returns {Array}
 */
exports.randomSample = function (inputArray, sampleSize) {
    var resultSet = [];

    for (var i = 0; i < inputArray.length; i++) {
        if (resultSet.length < sampleSize) {
            resultSet.push(inputArray[i]);
        }
        else {
            var insertAt = Math.floor(Math.random() * (i + 1));
            if (insertAt < resultSet.length) {
                resultSet[insertAt] = inputArray[i];
            }
        }
    }

    return resultSet;
};

/**
 * Convenience for checking the number of arguments to a function
 *
 * @param argumentsArray
 * @param expectedCount
 */
exports.checkArguments = function (argumentsArray, expectedCount) {
    if (argumentsArray.length !== expectedCount) {
        throw new Error("Invalid number of arguments provided for function! (expected " + expectedCount + ", got " + argumentsArray.length + ")");
    }
};

/**
 * Get the singleton console logger instance
 *
 * @returns {ConsoleLogger}
 */
var loggerInstance = null;
exports.consoleLogger = function () {
    if (loggerInstance === null) {
        loggerInstance = new ConsoleLogger();
    }
    return loggerInstance;
};

/**
 * Factory method for instances of the in-memory DOM storage API implementation
 *
 * @returns {InMemoryStorage}
 */
exports.newInMemoryStorage = function () {
    return new InMemoryStorage();
};

/**
 * Get the singleton AsyncExecService instance
 *
 * @returns {AsyncExecService}
 */
var asyncExecServiceInstance = null;
exports.asyncExecService = function () {
    if (asyncExecServiceInstance === null) {
        asyncExecServiceInstance = new AsyncExecService();
    }
    return asyncExecServiceInstance;
};

exports.generateGuid = GuidGenerator;

/**
 * Return the DOM storage object wrapped in an obfuscating decorator
 *
 * @param storage The storage object to obfuscate
 * @returns {ObfuscatingStorageWrapper}
 */
exports.obfuscateStorage = function (storage) {
    return new ObfuscatingStorageWrapper(storage);
};

/**
 * Shuffle an array in place
 *
 * @param inputArray The array to shuffle
 *
 * http://jsfromhell.com/array/shuffle [v1.0]
 */
exports.shuffleArray = function (inputArray) {
    //noinspection StatementWithEmptyBodyJS
    for (var j, x, i = inputArray.length; i; j = Math.floor(Math.random() * i), x = inputArray[--i], inputArray[i] = inputArray[j], inputArray[j] = x) {
    }
    return inputArray;
};

/**
 * The error used when a node is unreachable
 */
exports.UnreachableError = UnreachableError;
