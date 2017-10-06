"use strict";

const path = require('path');

const express   = require('express')
const exphbs    = require('express-handlebars');

const MySQLConn = require('./mysql_db')
const config    = require('./config');


let conn = null; // db connection (as a global, can also create singleton or use dependency injection)

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
    filename = filename.replace(/[^\w.-]/, ''); // allows numbers and letters . - _
    filename = filename.replace(/^([._-]+)/, ''); // must start with number or letter
    return filename
}


function sendStaticFileForPath(path) {
    var sendStaticFile = function (req, res){
        let filename = validate_file(req.params.filename);
        res.sendFile(path + '/' + filename, {root: staticFileRoot});
    };
    return sendStaticFile;
};


// API Handlers


var get_chart_data = async function(req, res){
    let start = req.query.start;
    let end   = req.query.end;
    let seriesNames = req.query.sources.split(',');
//console.log('get_chart_data', start, end, seriesNames);

    let series = await conn.select_series_by_names(seriesNames);
//console.log('series', series);

    let seriesDict = {};
    for (let s of series) seriesDict[s.id] = s.series_name;
//console.log('seriesDict', seriesDict);

    let seriesIds = series.map( (x) => x.id);
//console.log('series ids', seriesIds);
    
    let points  = await conn.select_points(seriesIds, start, end);
//console.log('points', points.length, 'example', points[0]);

//console.log("typeof", typeof points[0].ts, points[0].ts, typeof points[0].ts.toString())

// create xLegend
    let xLegend = [];
    for (let p of points) {
        let ts = p.ts.toISOString(); // or other format for date (if this is indeed a date object...)
        ts = ts.substring(0, 19).replace('T', ' ');
        let xpos = xLegend.indexOf(ts)
        if (xpos == -1) {
            xpos = xLegend.length;
            xLegend.push(ts);
        } 
        p.x = xpos;
    }

    return res.json({points: points, seriesLegend: seriesDict, xLegend: xLegend});
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



async function main()
{
    conn = await new MySQLConn().connect(config.mysql);

    const app = express();
    const hbs =  exphbs.create({ // express handlebars rendering engine initialization
        // define helper functions here
        // fncX: function(a, b){ return a + b; }
    });

    // configure application rendering engine
    app.engine('handlebars', hbs.engine);
    app.set('view engine', 'handlebars');

    // Page Handlers
    app.get('/', function(req, res){
        res.render('home', {'layout': 'main'});
    });

    // [[series, x, y], ]
    app.get('/api/chart', get_chart_data); //get_static_data);

    // use static middleware ---> Static file handlers - or replace by handing in webserver config
    app.get('/css/:filename', sendStaticFileForPath('css'));
    app.get( '/js/:filename', sendStaticFileForPath('js' ));
    app.get('/img/:filename', sendStaticFileForPath('img'));

    // open port for listening to connections
    app.listen(listenPort, function () {
        console.log('webserver listening on port ' + listenPort + '!');
    })
}



main();