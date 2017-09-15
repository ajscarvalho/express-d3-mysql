"use strict";

var config = require('./config');

var DataSeries = require('./db_object/data_series');
var DataPoint = require('./db_object/data_point');

// get the client
const mysql = require('mysql2/promise');



const SERIES_NAMES = ['fossil', 'hidráulica', 'solar', 'eólica', 'marés']
var seriesList = {}; // from DB



async function get_db_connection(config) {
    // create the connection to database
    return await mysql.createConnection({
  	    host: 		config.host,
        port:		config.port,
        database: 	config.database,
  	    user: 		config.username,
        password:   config.password
    });
};



async function fetch_series(conn, seriesName)
{
   let s = await get_series(conn, seriesName);
   if (!s) s = await create_series(conn, seriesName);
   return s;
}

async function get_series(conn, seriesName){
    let sql = "select id from data_series where series_name = ?";
    let result = await conn.query(sql, [seriesName]);
    let row = result[0][0];
    console.log('get', seriesName, row);
    if (!row) return null;
    return new DataSeries(row.id, seriesName); // 0 -> query result; 0 -> first row; id -> field
}

async function create_series(conn, seriesName) {
    let sql = "insert into data_series(series_name) values(?)";
    let result = await conn.execute(sql, [seriesName]);
    console.log('set', seriesName, result[0].insertId);
    return new DataSeries(result[0].insertId, seriesName); // 0 -> query result; 0 -> first row; id -> field
}

async function insert_points(conn, points) {
    let sql = "insert into data_point(ts, data_series_id, value) values (?, ?, ?)"
//    console.log('points', points);
    for (let p of points){
//        console.log('inserting point ', p);
//        break;
        await conn.query(sql, [p.ts, p.data_series_id, p.value]);
    }
}

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
    const conn = await get_db_connection(config.mysql);
    for (let seriesName of SERIES_NAMES) {
        seriesList[seriesName] = await fetch_series(conn, seriesName);
    }

    for (let seriesKey in seriesList){
        //console.log('generating values for series', seriesKey, seriesList[seriesKey]);
        let series = seriesList[seriesKey];
        points = points.concat(
            generate_random_points(
                series.id, 0, 10, new Date('2017-01-01 00:00:00'), new Date('2017-01-08 00:00:00'), 15*60*1000
        ));
    }

    await insert_points(conn, points)
    
    conn.end();
};



console.log('starting');

main();

console.log('ended');
