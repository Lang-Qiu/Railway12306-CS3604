const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(process.cwd(), 'database/12306-code-database-2023-12-15-main/db/train_basic.db');
console.log('Opening DB:', dbPath);

try {
    const db = new Database(dbPath, { readonly: true });
    
    // List tables
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('Tables:', tables);

    if (tables.length > 0) {
        const tableName = tables[0].name;
        const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
        console.log(`Columns of ${tableName}:`, columns);
        
        const rows = db.prepare(`SELECT * FROM ${tableName} LIMIT 5`).all();
        console.log('Sample rows:', rows);
    }
} catch (e) {
    console.error('Error:', e);
}
