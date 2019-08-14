'use strict';

var http = require("http");
var url = require("url");
var Promise = require("bluebird");

function HttpRequestService() {

    this.post = function (requestUrl, contents) {
        return executeRequest('POST', requestUrl, contents, 201);
    };

    this.get = function (requestUrl) {
        return executeRequest('GET', requestUrl, null, 200);
    };

    function executeRequest(method, requestUrl, contents, expectedStatus) {
        var parsedUrl = url.parse(requestUrl);
        if (contents) {
            var contentString = JSON.stringify(contents);
        }
        var req = null;

        return new Promise(function (resolve, reject) {
            var options = {
                withCredentials: false,
                hostname: parsedUrl.hostname,
                port: parsedUrl.port,
                path: parsedUrl.path,
                method: method
            };

            if (contents) {
                options.headers = {
                    "Content-Type": "application/json",
                    "Content-Length": contentString.length
                }
            }

            req = http.request(options, function (res) {
                if (res.statusCode === expectedStatus) {
                    var responseContent = "";
                    res.on("data", function (chunk) {
                        responseContent += chunk;
                    });
                    res.once("end", function () {
                        res.removeAllListeners("data");
                        if (responseContentIsJson(res)) {
                            resolve(JSON.parse(responseContent));
                        }
                        else {
                            resolve(responseContent);
                        }
                    });
                }
                else {
                    reject(new Error(res.statusCode));
                }
            });

            if (contents) {
                req.write(contentString);
            }
            req.end();
        }).cancellable().catch(Promise.CancellationError, function (e) {
                req.abort();
                throw e;
            });
    }
}

/**
 * Does this response contain JSON?
 *
 * @param response
 * @returns {boolean}
 */
function responseContentIsJson(response) {
    return response.headers["content-type"] &&
        response.headers["content-type"].indexOf("application/json") === 0;
}

module.exports = HttpRequestService;
