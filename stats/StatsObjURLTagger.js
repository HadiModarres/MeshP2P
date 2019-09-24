let constants = require("../constants");
/**
 * responsibility: tags stats objects with the url they should be sent to.
 */
class StatsObjURLTagger {
   tagStatsObj(obj){
      switch (obj.event) {
         case constants.EVENTS.SEARCH_RELAY:
            this.__handleSearchRelay(obj);
            break;
         case constants.EVENTS.SEARCH_START:
            this.__handleSearchReq(obj);
            break;

      }
   }
   __handleSearchReq(obj){
      let url =  `${constants.STATS_HTTP_URL}/search_started?id=${obj.id}&source_name=${obj.source_name}&query=${obj.query}`;
      obj.url = url;
   }
   __handleSearchRes(obj){
      let url =  `${constants.STATS_HTTP_URL}/search_responded?id=${obj.id}&node_name=${obj.source_name}`;
      obj.url = url;
   }
   __handleSearchRelay(obj){
      let url =  `${constants.STATS_HTTP_URL}/search_relayed?id=${obj.id}&node_name=${obj.source_name}`;
      obj.url = url;
   }
   __handleSearchDiscard(obj){
      let url =  `${constants.STATS_HTTP_URL}/search_discarded?id=${obj.id}&node_name=${obj.source_name}`;
      obj.url = url;
   }
   __handleSearchRevisit(obj){
      let url =  `${constants.STATS_HTTP_URL}/search_revisited?id=${obj.id}&node_name=${obj.source_name}`;
      obj.url = url;
   }
}

module.exports = StatsObjURLTagger;
