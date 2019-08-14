'use strict';

/**
 * So we can test the set/clear Timeout/Intervals
 */
function AsyncExecService() {

    /**
     * Set a timeout
     */
    this.setTimeout = function (callback, timeout) {
        return setTimeout(callback, timeout);
    };

    /**
     * Set an interval
     */
    this.setInterval = function (callback, interval) {
        return setInterval(callback, interval);
    };

    /**
     * Clear a timeout
     */
    this.clearTimeout = function (timeoutId) {
        clearTimeout(timeoutId);
    };

    /**
     * Clear an interval
     */
    this.clearInterval = function (intervalId) {
        clearInterval(intervalId);
    };
}

module.exports = AsyncExecService;