"use strict";

var config = require('./config');

var mysqlDB     = require('./mysql_db');
var DataPoint   = require('./db_object/data_point');


const SERIES_NAMES = ['fossil', 'hidráulica', 'solar', 'eólica', 'marés']
var seriesList = {}; // from DB



function generate_random_points(seriesId, min, max, startDate, endDate, interval) {

    let currentTime = startDate.getTime();
    let     endTime =   endDate.getTime();
    let dataPoints = []
    
    while (currentTime < endTime) {
        let currentDate = new Date(currentTime);
        let val = min + Math.random() * (max - min);
        let point = new DataPoint(null, currentDate, seriesId, val);
        //console.log('DataPoint', point);
        dataPoints.push(point);
        currentTime = currentTime + interval;
    }
    return dataPoints
}

async function main() {
    let points = []
    const conn = await mysqlDB.get_db_connection(config.mysql);
    for (let seriesName of SERIES_NAMES) {
        seriesList[seriesName] = await mysqlDB.fetch_series(conn, seriesName);
    }

    for (let seriesKey in seriesList){
        //console.log('generating values for series', seriesKey, seriesList[seriesKey]);
        let series = seriesList[seriesKey];
        points = points.concat(
            generate_random_points(
                series.id, 0, 10, new Date('2017-01-01 00:00:00'), new Date('2017-01-08 00:00:00'), 15*60*1000
        ));
    }

    await mysqlDB.insert_points(conn, points)
    
    conn.end();
};



console.log('starting');

main();

console.log('ended');
