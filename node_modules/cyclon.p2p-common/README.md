cyclon.p2p-common
====================

[![Build Status](https://travis-ci.org/nicktindall/cyclon.p2p-common.svg)](https://travis-ci.org/nicktindall/cyclon.p2p-common)
[![Dependencies](https://david-dm.org/nicktindall/cyclon.p2p-common.png)](https://david-dm.org/nicktindall/cyclon.p2p-common)

Some utilities used by various [cyclon.p2p](https://github.com/nicktindall/cyclon.p2p) modules

Usage
-----
First install cyclon.p2p-common as a runtime dependency

```javascript
npm install cyclon.p2p-common --save
```

Then include the library using require

```javascript
var cyclonUtils = require('cyclon.p2p-common');
```

The API
-------

### `randomSample(inputArray, sampleSize)`

Select a random sample of items from an array using reservoir sampling.

#### Parameters
* **inputArray** The array to sample from.
* **sampleSize** The number of items to sample.

### `checkArguments(argumentsArray, expectedCount)`

Check that an arguments array contains the expected number of items, throw an Error otherwise.

#### Parameters
* **argumentsArray** The arguments array to check.
* **expectedCount** The expected size of the arguments array.

### `consoleLogger()`

Get the singleton ConsoleLogger instance.

### `newInMemoryStorage()`

Create instances of an in-memory implementation of the [DOM storage API](http://dev.w3.org/html5/webstorage/#storage-0).

### `asyncExecService()`

Get the singleton instance of the AsyncExecService interface that's used in a lot of places.

### `obfuscateStorage(storage)`

Decorate implementations of the DOM storage API with an obfuscating layer

#### Parameters
* **storage** The storage to obfuscate.

### `shuffleArray(inputArray)`

Shuffle an array in place.

#### Parameters
* **inputArray** The array to shuffle.

