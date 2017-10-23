"use strict";

var mapaRequests = function() {
};

mapaRequests.prototype.requestmapa = function(nome,callback) {
console.log("NEtwork");
    var uri = '/api/mapa/?';
    var req = new HttpRequest('get', uri,callback);
    req.send();
};
