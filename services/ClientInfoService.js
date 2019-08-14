'use strict';

function ClientInfoService(StorageService) {

    var infoKey = "cyclonDemoClientInfo";
    var neighbourCacheKey = "cyclonDemoNeighbourCacheKey";

    return {

        getClientInfo: function () {
            return StorageService.getItem(infoKey);
        },

        setClientInfo: function (value) {
            StorageService.setItem(infoKey, value);
        },

        getStoredNeighbourCache: function() {
            var storedValue = StorageService.getItem(neighbourCacheKey);
            return storedValue ? JSON.parse(storedValue) : null;
        },

        setStoredNeighbourCache: function(value) {
            StorageService.setItem(neighbourCacheKey, JSON.stringify(value));
        }
    };
}

module.exports = ClientInfoService;