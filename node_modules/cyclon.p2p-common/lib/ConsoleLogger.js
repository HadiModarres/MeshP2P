'use strict';

var DEBUG = 1;
var INFO = 2;
var WARN = 3;
var ERROR = 4;

/**
 * Configurable console logger, default level is INFO
 *
 * @constructor
 */
function ConsoleLogger() {

    this.error = function () {
        if (loggingLevel(ERROR)) {
            console.error.apply(this, arguments);
        }
    };

    this.warn = function () {
        if (loggingLevel(WARN)) {
            console.warn.apply(this, arguments);
        }
    };

    this.info = function () {
        if (loggingLevel(INFO)) {
            console.info.apply(this, arguments);
        }
    };

    this.log = function () {
        if (loggingLevel(INFO)) {
            console.log.apply(this, arguments);
        }
    };

    this.debug = function () {
        if (loggingLevel(DEBUG)) {
            console.log.apply(this, arguments);
        }
    };

    this.setLevelToInfo = function () {
        setLevel(INFO);
    };

    this.setLevelToDebug = function() {
        setLevel(DEBUG);
    };

    this.setLevelToWarning = function() {
        setLevel(WARN);
    };

    this.setLevelToError = function() {
        setLevel(ERROR);
    };
}

function setLevel(newLevel) {
    ConsoleLogger.prototype.__level = newLevel;
}

function loggingLevel(logLevel) {
    return logLevel >= ConsoleLogger.prototype.__level;
}

ConsoleLogger.prototype.__level = INFO;

module.exports = ConsoleLogger;
