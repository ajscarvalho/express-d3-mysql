"use strict";

var express = require('express')
var exphbs  = require('express-handlebars');

var app = express();
var hbs =  exphbs.create({
    // define helper functions
});



function safeHandler(handler) {
    return function(req, res) {
        handler(req, res).catch(error => res.status(500).send(error.message));
    };
}


app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

var listenPort = 8818

app.get('/', function(req, res){
    res.render('home', {'layout': 'main'});
});

app.get('/chart/:type', function(req, resp){

    let chart = req.params.type;
    resp.send('type=' + req.params.type);
});


app.listen(listenPort, function () {
    console.log('webserver listening on port ' + listenPort + '!');
})

