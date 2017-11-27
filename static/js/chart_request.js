"use strict";


var ChartRequests = function() {
};

ChartRequests.prototype.requestChart = function(startStr, endStr, sourcesFilter, callback) {
    //var startStr = start.toISOString();
    //var endStr   = end.toISOString();

    var uri = '/api/chart/?start=' + startStr + '&end=' + endStr + '&sources=' + sourcesFilter;
    var req = new HttpRequest('get', uri, callback);
    req.send();
};


ChartRequests.prototype.requestMunicipalities = function(callback) {
    var uri = '/api/municipalities'
    var req = new HttpRequest('get', uri, callback);
    req.send();
};
