"use strict";
/**
 * if this is to be really used, turn code and globals (e.g. conn, LastConfig) into class and properties 
 */


// Charset AL32UTF8 or use NVARCHAR2 columns

var DataSeries  = require('./db_object/data_series');
var DataPoint   = require('./db_object/data_point');


// get the client
const oracledb = require('oracledb');
// to return rows as objects:     // objects are slower, btw...
//      either pass in the options:  conn.execute(sql, params, {outFormat: oracledb.OBJECT, ...}, ...)
// or to set globally:               oracledb.outFormat = oracledb.OBJECT;

class DbHandler {

    constructor() {
        this.conn = null;
        this.lastConfig = null;
        this.dateFormat = "'YYYY-MM-DD HH24:MI:SS'";
    }


    async connect(config) {
        if (!config)          config = this.lastConfig;
        else         this.lastConfig = config;
        let CS_PortPartial = config.port ? (':' + config.port) : '';

//        console.log(config.host + CS_PortPartial);
        this.conn = await oracledb.getConnection({
            user:           config.username,
            password:       config.password,
      	    connectString: 	config.host + CS_PortPartial
        });

        if (config.database)
            await this.conn.execute('ALTER SESSION SET CURRENT_SCHEMA = ' + config.database);

//oracledb.fetchAsString = [ oracledb.NUMBER ];
        return this;
    }

    end() { this.conn.close(); }


    async fetch_series(seriesName) {
        let s = await this.get_series(seriesName);
        if (!s) s = await this.create_series(seriesName);
        return s;
    }

    async get_series(seriesName) {
        console.log('get_series');
        let sql = "select id from data_series where series_name = :series_name";
        let result = await this.query(sql, {series_name: seriesName});
        console.log("get_series", result);
        let row = result[0]; // first row
//        console.log('get', seriesName, row);
        if (!row) return null;
        return new DataSeries(row[0], seriesName); // 0 -> first field
    }


    async create_series(seriesName) {
//        console.log('create_series');
        let sql = "insert into data_series(series_name) values(:series_name) returning id into :out_id";
        let params = {
            series_name:    seriesName, 
            out_id:         { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
        };

        let result = await this.execute(sql, params);
        let insertId = result.outBinds.out_id[0];
//        console.log('set', seriesName, result[0].insertId);
        return new DataSeries(insertId, seriesName); // 0 -> query result; 0 -> first row; id -> field
    }

    async insert_point(point) {
        let sql = "insert into data_point(ts, data_series_id, value) values (:ts, :ds, :pv) returning id into :out_id";
        let params = {
            ts:     point.ts, 
            ds:     point.data_series_id, 
            pv:     point.value,
            out_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
        }
        let resultPromise = this.query(sql, params);
        // dont care about the insert id...        let insertId = result.outBinds.out_id[0];

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
        let params = [];
        let sql = "select id, series_name from data_series ds";

        if (seriesNames) {
            let seriesNamesStr = seriesNames.join(',');
            sql = "with id_generator as (" +
                    "SELECT regexp_substr(:seriesNames, '[^,]+', 1, LEVEL) token " +
                    "FROM dual " +
                    "CONNECT BY LEVEL <= length(:seriesNames) - length(REPLACE(:seriesNames, ',', '')) + 1) " +
                "select id, series_name " +  
                "from data_series ds, id_generator g " +
                "where ds.series_name = g.token";
            params = {seriesNames: seriesNamesStr};
        }

        let result = await this.query(sql, params);
        let row = result[0];
        console.log('Series By Names -  Sample Row: ', row)
        if (!row) return null;
        return result.map( function(x) { return {id: x[0], series_name: x[1]} } );
    }


    async select_points(seriesIds, start, end) {
        
        let seriesIdsStr = seriesIds.join(',');
        let sql = "with id_generator as (" +
                "SELECT regexp_substr(:seriesIds, '[^,]+', 1, LEVEL) token " +
                "FROM dual " +
                "CONNECT BY LEVEL <= length(:seriesIds) - length(REPLACE(:seriesIds, ',', '')) + 1) " +
            "select data_series_id, ts, value " +  
            "from data_point, id_generator g " + 
            "where data_series_id = g.token and ts >= :startTs and ts < :endTs " + 
            "order by ts asc ";

//        console.log({seriesIds: seriesIds, start: start, end: end})
        let params = {
            seriesIds:  seriesIdsStr, 
            startTs:    {type: oracledb.DATE, val: new Date(start)},
            endTs:      {type: oracledb.DATE, val: new Date(end)}
        };
        console.log('params: ', params)
        let result = await this.query(sql, params);
        let row = result[0];
        console.log('Points - Sample Row: ', row)
        if (!row) return null;

        // for performance reasons you should be better of using plain arrays!
        return result.map( function(x) { return {data_series_id: x[0], ts: x[1], value: x[2]} } );
    }


    async get_colour() {
    
        let sql = "select concelho, drc, ao, colour, colour_drc, colour_ao from ref_concelho_ao"; // where colour is not null group by concelho, colour";
        let result = await this.query(sql,{},{maxRows: 300});
        let row = result[0];
        if (!row) return null;
//        for (let i = 0; i < 10; i++) console.log(result[i][0]);
        //console.log("Result" , result);
		return result.map( function(x) { return {
            concelho: x[0], drc: x[1], ao: x[2], colour: x[3], colour_drc: x[4], colour_ao: x[5]
        } } );
    }

    async get_distinct_drc() {
    
        let sql = "select distinct drc from ref_concelho_ao"; // where colour is not null group by concelho, colour";
        let result = await this.query(sql, {});
        let row = result[0];
        if (!row) return null;
//        for (let i = 0; i < result.length; i++) console.log('DRC', result[i][0]);
        //console.log("Result" , result);

        return result.map( function(x) { return x[0] } );
    }


    async get_pq_for_drc(drc, start, end) {
    
        let drcSubquery = 'and ao in (select distinct ao from ref_concelho_ao where drc = :drc) '

        let sql = "select sum(p), sum(q), " + this.oracle_output_date('time_data') + 
            "from PQ_AO " + 
//            "where time_data between " + this.oracle_to_date(':startTs') + 
//                "and " + this.oracle_to_date(':endTs') + 
            "where time_data >= " + this.oracle_to_date(':startTs') + 
            "and   time_data <  " + this.oracle_to_date(':endTs') +
            "{sq} " +
            "group by time_data " +
            "order by time_data asc";


        if (!drc) drcSubquery = '';
        sql = sql.replace('{sq}', drcSubquery);

        let params = {
            startTs: start,
            endTs:   end
        }

        if (drc) params['drc'] = drc;
console.log(sql, params);
        let result = await this.query(sql, params);
        console.log(result);

        //console.log("Result" , result);
        return result.map( function(x) { return {p: x[0], q: x[1], t: x[2] } });
    }


    /** makes sense? 
    async get_ao_drc_mapping() {
    
        let sql = "select distinct ao, drc from ref_concelho_ao"; // where colour is not null group by concelho, colour";
        let result = await this.query(sql, {});
        let row = result[0];
        if (!row) return null;
        let aoMap = {}
        for (row of result)
            aoMap[row[0]] = row[1];

        //console.log("Result" , result);
        return aoMap;
    }
    */

    /* somewhat private functions */

    oracle_to_date(param) {
        return "to_date(" + param + ", " + this.dateFormat + ") ";
    }

    oracle_output_date(param) {
        return "to_char(" + param + ", " + this.dateFormat + ") ";
    }



    async query(sql, params, options) {
        options = options || {};
        do {
            try {
//               readableStream = this.conn.queryStream(sql, params); // options
//               readableStream.on('data', function)
//                let result = await this.conn.execute(sql, params); // options
//               console.log(result);
                let result = await this.conn.execute(sql, params, options);
                return result.rows;
                
            } catch(e) {
                if (this.is_disconnect_error(e)) { this.connect(); continue; }
                console.error('E', e, 'e.name', e.name, 'e.code', e.code, 'e.message', e.message, 'e.trace', e.trace);
            }
            return null;
        } while(true);
    }

    async execute(sql, params, options) {
        options = options || {};
        do {
            try {
                let result = await this.conn.execute(sql, params, options);
                console.log(result);
                return result;
            } catch(e) {
                if (this.is_disconnect_error(e)) { this.connect(); continue; }
                console.error('E', e, 'e.name', e.name, 'e.code', e.code, 'e.message', e.message, 'e.trace', e.trace);
            }
            return null;
        } while(true);
    }

    async commit() { await this.conn.commit(); } // commit is async, but for the moment no need for it to block

    is_disconnect_error(e) {
        if (['EPIPE'].indexOf(e.code) === -1) return false;
        return true;
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