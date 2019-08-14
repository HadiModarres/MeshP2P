cyclon.p2p-rtc-comms
====================

[![Build Status](https://travis-ci.org/nicktindall/cyclon.p2p-rtc-comms.svg?branch=master)](https://travis-ci.org/nicktindall/cyclon.p2p-rtc-comms)
[![Dependencies](https://david-dm.org/nicktindall/cyclon.p2p-rtc-comms.png)](https://david-dm.org/nicktindall/cyclon.p2p-rtc-comms)

A WebRTC implementation of the [cyclon.p2p](https://github.com/nicktindall/cyclon.p2p) `Comms` and `Bootstrap` interfaces.

This project implements the cyclon.p2p `Comms` and `Bootstrap` interfaces using [cyclon.p2p-rtc-client](https://github.com/nicktindall/cyclon.p2p-rtc-client). For more information about the `Comms` and `Bootstrap` interfaces, see [cyclon.p2p](https://github.com/nicktindall/cyclon.p2p).

How to use
----------
First install `cyclon.p2p-rtc-client` and `cyclon.p2p-rtc-comms` as runtime dependencies using npm

```
npm install cyclon.p2p-rtc-client --save
npm install cyclon.p2p-rtc-comms --save
```

If you are using browserify and AngularJS in your project you can include the 'cyclon-rtc' and 'cyclon-rtc-comms' modules simply:

```javascript
var angular = require('angular');  // or wherever angular comes from
var cyclon = require('cyclon.p2p');
var cyclonRtc = require('cyclon.p2p-rtc-client');
var cyclonRtcComms = require('cyclon.p2p-rtc-comms');

// Create the 'cyclon-rtc' module
cyclonRtc.createAngularModule(angular);
// Create the 'cyclon-rtc-comms' module
cyclonRtcComms.createAngularModule(angular);

// Then any modules that depend on 'cyclon-rtc-comms' can use the 'Comms' and 'Bootstrap' services exposed
var myModule = angular.module('myModule', ['cyclon-rtc-comms'])
myModule.service('myService', ['RTC', 'Comms', 'Bootstrap', function(rtcClient, rtcComms, rtcBootstrap) {
        var cyclonNode = cyclon.builder(rtcComms, rtcBootstrap);
        cyclonNode.start();
  }]);
  
```