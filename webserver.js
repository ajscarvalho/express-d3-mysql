"use strict";

const path = require('path');

const express = require('express')
const exphbs  = require('express-handlebars');
const mysqlDB = require('./mysql_db')

const app = express();
const hbs =  exphbs.create({
    // define helper functions
});

const config = require('./config');
const conn = mysqlDB.get_db_connection(config.mysql);

// TODO Error Handlers???

const staticFileRoot = path.join(__dirname, 'static/');
//"C:\\Users\\wides\\MEOCloud\\AMBERTREE_DPLAN_charts\\express-d3-mysql\\static\\";
const listenPort = 8818;


function safeHandler(handler) {
    return function(req, res) {
        handler(req, res).catch(error => res.status(500).send(error.message));
    };
}

function validate_file(filename){
    console.log('original', filename);
    filename = filename.replace(/[^\w.-]/, ''); // allows numbers and letters . - _
    console.log('only allowed', filename);
    filename = filename.replace(/^([._-]+)/, ''); // must start with number or letter
    console.log('only allowed first', filename);
    return filename
}


function sendStaticFileForPath(path) {
    var sendStaticFile = function (req, res){
        let filename = validate_file(req.params.filename);
        res.sendFile(path + '/' + filename, {root: staticFileRoot});
    };
    return sendStaticFile;
};


app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');


// Page Handlers
app.get('/', function(req, res){
    res.render('home', {'layout': 'main'});
});


// API Handlers


var get_chart_data = function(req, res){
    let start = req.query.start;
    let end   = req.query.end;
    let seriesNames = req.query.sources.split(',');
    let seriesIds = mysqlDB.select_series_by_names(conn, seriesNames);
    console.log('seriesIds', seriesIds);

    let points  = mysqlDB.select_points(conn, seriesIds, start, end);
    console.log('points', points);

    return res.json(points);
};


var get_static_data = function(req, res){
    console.log(req.query.start, req.query.end, req.query.sources);
    //select_points(conn, seriesNames, start, end);
    let data        = [];
    let seriesNames = req.query.sources ? req.query.sources.split(',') : ['a', 'b', 'c'];
    let initialTS   = new Date(req.query.start);
    let endTS       = new Date(req.query.end);
    let deltaTS     = 15*60*1000; //15m
    let currentTS; // = initialTS;

    for (let a = 0; a < seriesNames.length; a++) {
        let seriesId = a + 10;
        currentTS = initialTS;
        while(currentTS <= endTS) {
            data.push([seriesId, currentTS, Math.random()]);
            currentTS = Date(currentTS.getTime() + deltaTS);
        }
//        for (let i = 0; i < 20; i++) {
//            data.push([seriesId, i, Math.random()]);
    }

    res.json({data: data, legend: seriesNames});
    //res.send('start=' + req.query.start + "<br />" + 'end=' + req.query.end + "<br />Sources: " + req.query.sources);
};

// [[series, x, y], ]
app.get('/api/chart', get_chart_data); //get_static_data);



// use static middleware ---> Static file handlers - or replace by handing in webserver config
app.get('/css/:filename', sendStaticFileForPath('css'));
app.get( '/js/:filename', sendStaticFileForPath('js' ));
app.get('/img/:filename', sendStaticFileForPath('img'));


app.listen(listenPort, function () {
    console.log('webserver listening on port ' + listenPort + '!');
})

