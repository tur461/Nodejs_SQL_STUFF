const { Con, DB, FS } = require('./utils');

const fs = new FS();

const con = new Con();
con.setDB('cbdb');

const db = new DB(con.getCon());

let schema = 'dbo', table = 'AddOn';

let p = new Promise((resolve, reject) => {
    db.init();
    setTimeout(_ => {
        if(db.isConnected()) resolve();
        else reject();
    }, 1500);
});

p.then(async _ => {
    console.log('Connected to db');

    let d = await db.select(`
            select * from information_schema.columns 
            where table_schema = '${schema}' and table_name   = '${table}'`
        );
    let columns = d.rows.map(r => r.column_name);
    
    d = await db.select(`select count(*) from "${schema}"."${table}"`);
    
    let json = await fs.getTableData(table);
    
    let totalCount = json.length,
        currentCount = +d.rows[0].count;
    
    console.log('# of already added rows: ' + currentCount);
    console.log('# of total rows: ' + totalCount);
    
    if(!(totalCount - currentCount)) return;
    
    json = json.slice(currentCount); //skip the already added rows
    
    for(let j of json) {
        cols = columns.map(c => `"${c}"`).join(',');
        vals = columns.map(c => {
            // handle null values and invalid characters
            k = j[c] == null ? '0' : j[c];
            k = typeof k == 'string' ? k.replace(/'/g, "") : k;
            return `'${k}'`;
        }).join(',');
        
        await db.insert(`
            insert into 
            "${schema}"."${table}" 
            (${cols}) 
            values(${vals})`
        );
    }
    console.log("Insertion Completed.");
})
.catch(e => console.log('Not connected to db:', e))
.finally(_ => db.disconnect());
