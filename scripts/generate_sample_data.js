"use strict";

var config = require('../config');

var MySQLConn   = require('../mysql_db');
var OracleConn  = require('../oracle_db');

var DataPoint   = require('../db_object/data_point');


const SERIES_NAMES = ['fossil', 'hidráulica', 'solar', 'eólica', 'marés'];
var seriesList = {}; // from DB



function generate_random_points(seriesId, min, max, startDate, endDate, interval) {

    let currentTime = startDate.getTime();
    let     endTime =   endDate.getTime();
    let dataPoints = [];
    
    while (currentTime < endTime) {
        let currentDate = new Date(currentTime);
        let val = min + Math.random() * (max - min);
        let point = new DataPoint(null, currentDate, seriesId, val);
        //console.log('DataPoint', point);
        dataPoints.push(point);
        currentTime = currentTime + interval;
    }
    console.log('Generated ', dataPoints.length, 'data points');
    return dataPoints;
}


async function insert_points(conn, points)
{
    let promises = []
    for (let p of points)
        promises.push( conn.insert_point(p) );

    await Promise.all(promises);
}


async function main() {
    let conn = null;

    console.log('starting');
//    console.log("ARGV", process.argv);

    if (process.argv[2] == 'mysql') {
        conn = await new MySQLConn().connect(config.mysql);
    } else if (process.argv[2] == 'oracle') {
        conn = await new OracleConn().connect(config.oracle);
    } else {
        console.log("supply database type to use: [mysql, oracle]");
        process.exit(1);
    }
    
    let points = [];
//    const conn = await mysqlDB.get_db_connection(config.mysql);
    for (let seriesName of SERIES_NAMES) {
        seriesList[seriesName] = await conn.fetch_series(seriesName);
    }
    
    for (let seriesKey in seriesList){
        //console.log('generating values for series', seriesKey, seriesList[seriesKey]);
        let series = seriesList[seriesKey];
        points = points.concat(
            generate_random_points(
                series.id, 0, 10, new Date('2017-01-01 00:00:00'), new Date('2017-01-08 00:00:00'), 15*60*1000
        ));
    }

    await insert_points(conn, points);
    await conn.commit();
    conn.end();
    console.log('ended');
}



main();

