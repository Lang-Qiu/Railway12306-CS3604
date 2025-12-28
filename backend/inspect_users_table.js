const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_FILE_PATH = path.join(__dirname, 'database/railway.db');

async function inspect() {
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_FILE_PATH)) {
    const filebuffer = fs.readFileSync(DB_FILE_PATH);
    const db = new SQL.Database(filebuffer);
    const res = db.exec("PRAGMA table_info(users)");
    console.log("Columns in users table:");
    res[0].values.forEach(row => {
      console.log(`- ${row[1]} (${row[2]})`);
    });
  } else {
    console.log("Database file not found.");
  }
}

inspect();
