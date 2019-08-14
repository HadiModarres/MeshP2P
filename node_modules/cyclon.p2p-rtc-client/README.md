cyclon.p2p-rtc-client
=====================

[![Build Status](https://travis-ci.org/nicktindall/cyclon.p2p-rtc-client.svg?branch=master)](https://travis-ci.org/nicktindall/cyclon.p2p-rtc-client)
[![Dependencies](https://david-dm.org/nicktindall/cyclon.p2p-rtc-client.png)](https://david-dm.org/nicktindall/cyclon.p2p-rtc-client)

The client component of a simple WebRTC abstraction layer.

Written for use by the [cyclon.p2p](https://github.com/nicktindall/cyclon.p2p) WebRTC [communications module](https://github.com/nicktindall/cyclon.p2p-rtc-comms) this abstraction features a simple API for establishing WebRTC data channels and sending and receiving data over them.

How to use
----------
First install cyclon.p2p-rtc-client as a runtime dependency using npm

```
npm install cyclon.p2p-rtc-client --save
```

If you are using browserify and AngularJS in your project you can include the 'cyclon-rtc' module simply:

```javascript
var cyclonRtc = require('cyclon.p2p-rtc-client');
var angular = require('angular');  // or wherever angular comes from

// Create the 'cyclon-rtc' module
cyclonRtc.createAngularModule(angular);

// Then any modules that depend on 'cyclon-rtc' can use the 'RTC' service exposed
var myModule = angular.module('myModule', ['cyclon-rtc'])
myModule.service('myService', ['RTC', function(rtcClient) {
    // ...
  }]);
  
```

The RTC API
-----------
The API for the RTC service is as follows:

### `connect(metadataProviders, rooms)`
This will connect to up to two of the signalling servers configured and prepare the client to open channels to other peers.
    
#### Parameters
* **metadataProviders** A hash of names to functions that return values that will be included in the node pointers created by the RTC client.
* **rooms** An array of 'room' names that the client wishes to join. Joining a room means the client's pointer will be a candidate to be returned by the signalling server's `./api/peers?room=RoomName` endpoint.
    
### `createNewPointer()`
Returns a new 'node pointer' to the local client, this can be sent to other clients who will be able to use it to open channels back to this client.

#### Example
 
```javascript
{
    'id' : '7368d3c4-e512-4648-a6fb-7343be840563',
    'seq': 26590,
    'age': 11,
    'metadata': {
        'location': {
            'country': 'AU'
        }
    },
    'signalling': [{
        'socket': {
            'server': 'http://signalling-socket.somedomain.com/',
            'socketResource': '/signalling/socket.io'
        },
        'signallingApiBase': 'http://signalling-api.somedomain.com/'
    },
    {
        'socket': {
            'server': 'http://signalling.otherdomain.com.au/'
        },
        'signallingApiBase': 'http://signalling.otherdomain.com.au/'
    }]
}

```

### `getLocalId()`
Returns the UUID of the local RTC client as a string.

#### Example
```javascript
'474f6416-fede-40f9-aca0-c853133e94b3'
```
    
### `onChannel(type, callback)`
Add a handler that will be invoked whenever an incoming channel of the specified type is established. Note there can be only one handler for each channel type. Invoking `onChannel('SomeType', handler)` twice will replace the first handler with the second.

#### Parameters
* **type** A string that uniquely identifies the type of channel to handle.
* **callback** A function that will be invoked with a single parameter, the Channel object when an inbound channel of the specified type is established. It is the application's responsibility to close the Channel when the exchange is completed, a failure to do so will lead to memory leaks.

#### Example
When an inbound *PingExchange* is initiated wait up to five seconds for the *PingMessage*, then reply with the *PongMessage* and finally close the channel.

```javascript
rtc.onChannel('PingExchange', function(channel) {
    channel.receive('PingMessage', 5000)
        .then(function() {
            channel.send('PongMessage');
        })
        .finally(function() {
            channel.close();
        });
});

```

### `openChannel(type, remotePointer)`
Open a channel of a particular type to a remote peer. Returns a [Bluebird](https://github.com/petkaantonov/bluebird) Promise.
    
#### Parameters
* **type** A string that uniquely identifies the type of channel to open.
* **remotePointer** The 'node pointer' of the remote peer to connect to. The remote peer can get this by calling createNewPointer() on its client and transmitting the pointer to the node peer wishing to connect.

#### Example
When initiating a *PingExchange*, open the channel, send a *PingMessage*, wait for up to five seconds for a *PongMessage* then close the channel.

```javascript
rtc.openChannel('PingExchange', remotePointer)
    .then(function(channel) {
        channel.send('PingMessage');
        channel.receiveMessage('PongMessage', 5000)
            .finally(function() {
                channel.close();
            });
    });

```
        
Configuration
-------------
By default the module created will use

* Three demonstration signalling servers deployed on Heroku. These should be used for evaluation purposes only as their availability is not guaranteed, and they are shared between anyone that uses this library with the default settings.
* The "public" STUN server provided by Google. Again, for any serious deployment users should provide their own STUN and/or TURN infrastructure. The Google STUN server probably cannot be relied upon to be there and freely available forever.

You can change these defaults by specifying configuration values on the modules that are created. e.g.

```javascript
rtc.buildAngularModule(angular)
    .value('IceServers', [
        {
            'urls': ['turn:11.22.33.44', 'turn:11.22.33.44?transport=tcp'],
            'username': 'specialUser',
            'credential': 'topSecret'
        }
    ])
    .value('SignallingServers', [
        {
            'socket': {
                'server': 'http://signalling.mycompany.com'
            },
            'signallingApiBase': 'http://signalling.mycompany.com'
        }
    ]);
```

You can also override many of the services specified in the modules if you feel like tinkering, check out the `buildAngularModule()` function in lib/index.js file for more details.

Signalling Servers
------------------
Check out the corresponding signalling server project, [cyclon.p2p-rtc-server](https://github.com/nicktindall/cyclon.p2p-rtc-server), if you would like to run your own signalling servers. The whole signalling infrastructure is abstracted so you could also implement your own and use that instead. See `lib/SocketIOSignallingServer.js` for the interface expected.



