"use strict";

/**
 * Used to indicate that a node is unreachable
 *
 * @param message
 * @constructor
 */
function UnreachableError(message) {
    this.name = "UnreachableError";
    this.message = message;
}
UnreachableError.prototype = new Error();
UnreachableError.prototype.constructor = UnreachableError;

module.exports = UnreachableError;