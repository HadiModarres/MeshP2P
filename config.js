let CONFIG = {
    NEIGHBOR_SIZE: 7,
    SHUFFLE_SIZE: 3,
    TICK_INTERVAL: 20000,
    DEFAULT_SIGNALLING_SERVERS: [
        {
            "socket": {
                "server": "http://localhost:12345"
            },
            "signallingApiBase": "http://localhost:12345"
        },
        {
            "socket": {
                "server": "http://localhost:12346"
            },
            "signallingApiBase": "http://localhost:12346"
        }
    ],
    DEFAULT_BATCHING_DELAY_MS: 300,
    DEFAULT_ICE_SERVERS: [
        // The public Google STUN server
        {urls: ['stun:stun.l.google.com:19302']},
    ],
    DEFAULT_CHANNEL_STATE_TIMEOUT_MS: 30000, DEFAULT_SIGNALLING_SERVER_RECONNECT_DELAY_MS: 5000
};

module.exports = CONFIG;
