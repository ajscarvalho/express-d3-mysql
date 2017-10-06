"use strict";
/**
 * if this is to be really used, turn code and globals (e.g. conn, LastConfig) into class and properties 
 */

var DataSeries  = require('./db_object/data_series');
var DataPoint   = require('./db_object/data_point');


// get the client
const mysql = require('mysql2/promise');


class DbHandler {

    constructor() {
        this.conn = null;
        this.lastConfig = null;
    }


    async connect(config) {
        if (!config)          config = this.lastConfig;
        else         this.lastConfig = config;

        this.conn = await mysql.createConnection({
      	    host: 		config.host,
            port:		config.port,
            database: 	config.database,
      	    user: 		config.username,
            password:   config.password
        });

        return this;
    }

    end() { this.conn.end(); }


    async fetch_series(seriesName) {
        let s = await this.get_series(seriesName);
        if (!s) s = await this.create_series(seriesName);
        return s;
    }

    async get_series(seriesName) {
        let sql = "select id from data_series where series_name = ?";
        let result = await this.query(sql, [seriesName]);
        let row = result[0][0];
//        console.log('get', seriesName, row);
        if (!row) return null;
        return new DataSeries(row.id, seriesName); // 0 -> query result; 0 -> first row; id -> field
    }


    async create_series(seriesName) {
        let sql = "insert into data_series(series_name) values(?)";
        let result = await this.execute(sql, [seriesName]);
//        console.log('set', seriesName, result[0].insertId);
        return new DataSeries(result[0].insertId, seriesName); // 0 -> query result; 0 -> first row; id -> field
    }

    async insert_point(point) {
        let sql = "insert into data_point(ts, data_series_id, value) values (?, ?, ?)";
        let resultPromise = this.query(sql, [point.ts, point.data_series_id, point.value]);
        return resultPromise;
    }

/*
use: await Promise.all([])
    async  insert_points(conn, points) {
        let sql = "insert into data_point(ts, data_series_id, value) values (?, ?, ?)"
    //    console.log('points', points);
        for (let p of points){
    //        console.log('inserting point ', p);
    //        break;
            await conn.query(sql, [p.ts, p.data_series_id, p.value]);
        }
    };
*/

    async select_series_by_names(seriesNames) {
        // series_name is auxiliary
        let sql = "select id, series_name " +  
            "from data_series ";
        let params = [];

        if (seriesNames) {
            sql += "where series_name in (?) ";
            params = [seriesNames];
        }

        let result = await this.query(sql, params);
        let row = result[0][0];
        console.log('Series By Names -  Sample Row: ', row)
        if (!row) return null;
        return result[0]; // 0 -> query result; 0 -> first row; id -> field
    }


    async select_points(seriesIds, start, end) {
        // series_name is auxiliary
        let sql = "select data_series_id, ts, value " +  
            "from data_point " + 
            "where data_series_id in (?) and ts >= ? and ts < ? " + 
            "order by ts asc ";

        let result = await this.query(sql, [seriesIds, start, end]);
        let row = result[0][0];
        console.log('Points - Sample Row: ', row)
        if (!row) return null;
        return result[0]; // 0 -> query result; 0 -> first row; id -> field
    }



    /* somewhat private functions */

    async query(sql, params) {
        do {
            try {
                return await this.conn.query(sql, params);
            } catch(e) {
                console.error('E', e, 'e.name', e.name, 'e.code', e.code, 'e.message', e.message, 'e.trace', e.trace);
                // detect and understand error -> reconnect
            }
            return null;
        } while(true);
    }

    async execute(sql, params) {
        do {
            try {
                return await this.conn.execute(sql, params);
            } catch(e) {
                console.error('E', e, 'e.name', e.name, 'e.code', e.code, 'e.message', e.message, 'e.trace', e.trace);
                // detect and understand error -> reconnect
            }
            return null;
        } while(true);
    }
}

module.exports = DbHandler;
/*
{
    get_db_connection:  get_db_connection,

// writing data
    fetch_series:       fetch_series,
    insert_points:      insert_points,

// getting data
    select_series_by_names: select_series_by_names,
    select_points:          select_points
};
*/