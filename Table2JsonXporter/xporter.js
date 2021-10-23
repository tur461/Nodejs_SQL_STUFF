require('dotenv').config();

const { Client } = require('pg')
const fs = require('fs');
const path = require('path');

const { Con } = require('./utils');
const con = new Con();

const db = []; // list of db names here

let client = null;

// change dir to ./db in current folder
process.chdir('./db');

// everything starts with the follwing call!
processDb(0);

function processDb(k) {
    let db_ = db[k];
    console.log('DB: ' + db_);
    con.setDB(db_);
    client = new Client(con);
    client.connect(e => {
        if(e) {
            console.log('Error connecting to db: ' + db_);
            nextDb(k+1);
            return;
        }
        getAllTables(db_, k); 
    });
}


function nextDb(k) { 
    client.end();
    if(k < db.length) processDb(k); // process next db
    else console.log('Processing on all DBs Completed.\nHave a nice day!.');
}

function getAllTables(db_, k) {
    let q = `select table_name as name from information_schema.tables where table_schema = 'dbo'`;
    client.query(q, (e, r) => {
        if(!e){
            let tables = r.rows.map(r => r.name).sort();
            console.log(`Got ${tables.length} tables from DB:  ${db_}`);
            if(tables.length) processTables(tables, db_, k);
            else nextDb(k+1);
        } else
            console.log('error:', e);
    });
}

function processTables(tables, db_, k) {
    for(let i = 0, 
            l = tables.length,
            t = '', 
            d = '', 
            f = '', 
            q = ''; i<l; ++i
    ){
        t = tables[i];
        d = `${db_}`;
        f = `${t}.json`;
        q = `SELECT * from "dbo"."${t}"`;
        console.log('table: ' + t);
        client.query(q, (e, dat) => {
            if(!e){
                
                if(!fs.existsSync(d)) fs.mkdirSync(d);
                
                fs.writeFile(`${d}/${f}`, JSON.stringify(dat.rows), {
                    encoding: "utf8",
                    flag: "w"
                }, e => {
                    if(e) console.log('Error writing file: ' + f);
                    else console.log('wrote file: ' + f);
                    if(i === l-1){
                        console.log(`File Writing completed at i: ${i} and table: ${t}`);
                        nextDb(k+1);
                    }
                });
            }
        })
    }
        
}
