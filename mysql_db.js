"use strict";


var DataSeries  = require('./db_object/data_series');
var DataPoint   = require('./db_object/data_point');


// get the client
const mysql = require('mysql2/promise');


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


async function select_series_by_names(conn, seriesNames) {
    // series_name is auxiliary
    let sql = "select id, series_name" +  
        "from data_series ds ";
    let params = [];

    if (seriesNames) {
        sql += "where series_name in (?) ";
        params = [seriesNames];
    }

    let result = await conn.query(sql, params);
    let row = result[0][0];
    console.log('Sample Row: ', row)
    if (!row) return null;
    return result[0]; // 0 -> query result; 0 -> first row; id -> field
}


async function select_points(conn, seriesIds, start, end) {
    // series_name is auxiliary
    let sql = "select data_series_id, ts, value " +  
        "from data_point dp " + 
        "where data_series_id in (?) and ts between ? and ? "

    let result = await conn.query(sql, [seriesNames, start, end]);
    let row = result[0][0];
    console.log('Sample Row: ', row)
    if (!row) return null;
    return result[0]; // 0 -> query result; 0 -> first row; id -> field
}


module.exports = {
    get_db_connection:  get_db_connection,

// writing data
    fetch_series:       fetch_series,
    insert_points:      insert_points,

// getting data
    select_series_by_names: select_series_by_names,
    select_points:          select_points
};
