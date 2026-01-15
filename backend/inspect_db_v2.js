const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'database/12306-code-database-2023-12-15-main/db/train_basic.db');
const logPath = path.join(__dirname, 'db_inspect_result.txt');
const logStream = fs.createWriteStream(logPath);

function log(msg) {
    console.log(msg);
    logStream.write(msg + '\n');
}

log('Opening DB: ' + dbPath);

if (!fs.existsSync(dbPath)) {
    log('File does not exist!');
    process.exit(1);
}

try {
    const db = new Database(dbPath, { readonly: true, fileMustExist: true });
    log('DB opened.');
    
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    log('Tables: ' + JSON.stringify(tables, null, 2));

    if (tables.length > 0) {
        for (const t of tables) {
            const tableName = t.name;
            log(`--- Table: ${tableName} ---`);
            const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
            log(`Columns: ` + columns.map(c => c.name).join(', '));
            
            const count = db.prepare(`SELECT count(*) as c FROM ${tableName}`).get();
            log(`Row count: ${count.c}`);
            
            const rows = db.prepare(`SELECT * FROM ${tableName} LIMIT 2`).all();
            log('Sample rows: ' + JSON.stringify(rows, null, 2));
        }
    } else {
        log('No tables found.');
    }
} catch (e) {
    log('Error: ' + e.message);
} finally {
    logStream.end();
}
