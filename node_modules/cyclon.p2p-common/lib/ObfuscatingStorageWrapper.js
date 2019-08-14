'use strict';

var CryptoJS = require("crypto-js");
var GuidGenerator = require("./GuidGenerator");

/**
 * You don't need to be a genius to break this "security" but it should
 * slow tinkerers down a little
 *
 * @param GuidService
 * @returns {{wrapStorage: Function}}
 * @constructor
 */
function ObfuscatingStorageWrapper(storage) {

    var SECRET_KEY_KEY = "___XX";
    var wellKnownKey = "ce56c9aa-d287-4e7c-b9d5-edca7a985487";

    function getSecretKey() {
        var secretKeyName = scrambleKey(SECRET_KEY_KEY, wellKnownKey);
        var secretKey = storage.getItem(secretKeyName);
        if (secretKey === null) {
            secretKey = GuidGenerator();
            storage.setItem(secretKeyName, encryptValue(secretKey, wellKnownKey));
        }
        else {
            secretKey = decryptValue(secretKey, wellKnownKey);
        }
        return secretKey;
    }

    function scrambleKey(key, encryptionKey) {
        return CryptoJS.HmacMD5(key, encryptionKey || getSecretKey()).toString();
    }

    function encryptValue(value, encryptionKey) {
        return  CryptoJS.AES.encrypt(JSON.stringify(value), encryptionKey || getSecretKey()).toString();
    }

    function decryptValue(value, encryptionKey) {
        if (value === null) {
            return null;
        }
        try {
            var decryptedValue = CryptoJS.AES.decrypt(value, encryptionKey || getSecretKey()).toString(CryptoJS.enc.Utf8);
            return JSON.parse(decryptedValue);
        }
        catch (e) {
            return null;
        }
    }

    this.getItem = function (key) {
        return decryptValue(storage.getItem(scrambleKey(key)));
    };

    this.setItem = function (key, value) {
        storage.setItem(scrambleKey(key), encryptValue(value));
    };

    this.removeItem = function (key) {
        storage.removeItem(scrambleKey(key));
    };

    this.clear = function () {
        storage.clear();
    };

    getSecretKey();
}

module.exports = ObfuscatingStorageWrapper;