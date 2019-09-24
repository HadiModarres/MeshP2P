module.exports.PACKET_TYPE = {
   SEARCH_REQ:"search_req",
   SEARCH_RES:"search_res",
};

module.exports.PACKET_FIELD = {
   DATE_TIME: "date_time",
   PACKET_TYPE: "packet_type",
   PACKET_ID: "packet_id",
   PACKET_SOURCE: "packet_source",
   QUERY: "query",
   HOPS: "hops",
   BODY:"body",
   LIST: "list"
};

module.exports.EVENTS = {
   SEARCH_START: 'start',
   SEARCH_RELAY: 'relay',
   SEARCH_DISCARDED: 'discard',
   SEARCH_REVISITED: 'revisit',
   SEARCH_RESPOND: 'respond',
};

module.exports.STATS_RECORDER = {
   HTTP: "http",
   FILE: "file",
};

module.exports.STATS_FILE_PATH = './stats.txt';
module.exports.STATS_HTTP_URL = "http://localhost:3500/stats";
