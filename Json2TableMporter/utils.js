require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const Constants = {
    SUCCESS: 'Successful',
    FAILURE: 'Failure',
    FILE_PATH: './db/am_shm_cb_db/',
};

class FS {
    constructor() {
        this.tableNames = fs.readdirSync(Constants.FILE_PATH).map(f => f.split('.')[0]);
        // console.log(this.tableNames);
    }

    getTableData(table) {
        return new Promise((r, x) => {
            fs.readFile(`${Constants.FILE_PATH}${table}.json`, (e, d) => {
                if(e) x(e);
                else r(JSON.parse(d));
            })
        });
    }
}

class Con {
    constructor() {
        this.host = process.env.HOST + '',
        this.port = process.env.PORT;
        this.user = process.env.USER + '';
        this.pass = process.env.PASS + '';
        this.db = '';
    }
    setDB (dbName) {
        this.db = dbName;
    }

    getCon() {
        return {
            host: this.host, 
            port: this.port, 
            user: this.user, 
            database: this.db,
            password: this.pass, 
        };
    }
}

class DB {
    constructor(con) {
        this.client = new Client(con);
        this.action = '';
        this.actions = {
            INSERT: 'Insertion',
            SELECT: 'Selection',
            CREATE: 'Creation',
            CONNECT: 'Connection',
            DISCONNECT: 'Dis-connection',
        };
    }

    init() {
        this.connect();
    }

    connect() {
        console.log('trying to connect...');
        this.setAction(this.actions.CONNECT);
        this.client
            .connect()
            .then(_ => {
                this.success();
            })
            .catch(e => this.error(e));
    }

    disconnect() {
        this.setAction(this.actions.DISCONNECT);
        this.client
            .end()
            .then(_ => this.success())
            .catch(e => this.error());        
    }

    getFormatedQuery(q, d) {
        q = { text: q };
        if(d) q.values = d;
        return {...q};
    }

    runQuery(q, data) {
        return this.client.query(this.getFormatedQuery(q, data))
    }

    insert(q, data) {
        this.setAction(this.actions.INSERT);
        return this.runQuery(q, data);
    }

    create(q) {
        this.setAction(this.actions.CREATE);
        return this.runQuery(q);
    }

    select(q) {
        this.setAction(this.actions.SELECT);
        return this.runQuery(q);
    }

    setAction(act) {
        this.action = act;
    }

    getAction() {
        return this.action;
    }

    error(e) {
        console.log(`${this.getAction()} ${Constants.FAILURE}`, e ? e : '');
    }

    success() {
        console.log(`${this.getAction()} ${Constants.SUCCESS}`);
    }

    isConnected() {
        return this.client._connected;
    }
}

module.exports = {
    FS,
    DB,
    Con,
    Constants,
};