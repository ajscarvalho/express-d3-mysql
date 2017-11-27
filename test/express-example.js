"use strict";

var express = require('express')
var app = express()

var listenPort = 8818

app.get('/', function(req, resp){
    console.log('chart=', req.query.chart);
    resp.send('chart=' + req.query.chart);
});

app.get('/energy/:type', function(req, resp){

    console.log('energy type=', req.params.type);
    resp.send('energy=' + req.params.type);
});


app.listen(listenPort, function () {
    console.log('webserver listening on port ' + listenPort + '!');
})
