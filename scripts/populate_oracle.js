"use strict";

const path = require('path');

const MySQLConn     = require('../mysql_db');
const OracleConn    = require('../oracle_db');
const config        = require('../config');

const afs           = require('async-file'); // import * as fs from 'async-file';

let conn = null; // db connection (as a global, can also create singleton or use dependency injection)



const sqlPath = path.join(path.dirname(__dirname), 'sql');


async function main()
{
    if (process.argv[2] == 'mysql') {
        conn = await new MySQLConn().connect(config.mysql);
    } else if (process.argv[2] == 'oracle') {
        conn = await new OracleConn().connect(config.oracle);
    } else {
        console.log("supply database type to use: [mysql, oracle]");
        process.exit(1);
    }


    await dump_sql(conn, path.join(sqlPath, 'ref_concelho_ao.sql'));
    await dump_sql(conn, path.join(sqlPath, 'paint_debug.sql'));
    await dump_sql(conn, path.join(sqlPath, 'pq_ao.sql'));
}


async function dump_sql(conn, filename){
    console.log('Processing', filename);
    var data = await afs.readFile(filename, 'utf8');
    var rows = data.split('\n');


    for (let row of rows)
    {
        let query = row.trim();
        if (query.substring(0, 2) == '--') continue; // comment
    
        let ignoreTest = query.substring(0, 4).toUpperCase();
        if (ignoreTest == 'REM ' || ignoreTest == 'SET ') continue; // comment

        let command = query.replace('XDB.', ''); // remove schema
        command = command.substr(0, command.length-1); // remove ending ';'
        console.log(command)
/*
        for (let i = 0; i < command.length; i++)
            console.log(command[i], command.charCodeAt(i))
        return;
*/
        await conn.execute(command, []);
    }
    console.log('commiting');
    await conn.commit();
    console.log('commited');
};

/*
async function read_sql_line(line) {

    line = line.trim()
    if (line.substring(0, 2) == '--') return; // comment
    
    let ignoreTest = line.substring(0, 4).toUpperCase();

    if (ignoreTest == 'REM ' || ignoreTest == 'SET ') return; // comment

    let command = line.replace('XDB.', '');

    await conn.execute(command);
    });

    lineReader.on('end', function (line) {

    })
}
*/

main();