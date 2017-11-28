"use strict";


var ChartRequests = function() {
};

ChartRequests.prototype.requestChart = function(endpoint, drc, startStr, endStr, callback) {
    //var startStr = start.toISOString();
    //var endStr   = end.toISOString();

    var uri = '/api/' + endpoint + '?drc=' + drc + '&start=' + startStr + '&end=' + endStr;// + '&sources=' + sourcesFilter;
    var req = new HttpRequest('get', uri, callback);
    req.send();
};

/*
ChartRequests.prototype.requestMunicipalities = function(callback) {
    var uri = '/api/municipalities'
    var req = new HttpRequest('get', uri, callback);
    req.send();
};
*/

ChartRequests.prototype.get_drc_list = function(callback) {
    var uri = '/api/drcs'
    var req = new HttpRequest('get', uri, callback);
    req.send();
};
