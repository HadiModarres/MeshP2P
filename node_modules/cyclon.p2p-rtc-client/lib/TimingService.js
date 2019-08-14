'use strict';

function TimingService() {

    this.getCurrentTimeInMilliseconds = function () {
        return new Date().getTime();
    };
}

module.exports = TimingService;