const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database/railway.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  console.log('Checking stations...');
  db.all("SELECT name FROM stations LIMIT 10", (err, rows) => {
    if (err) console.error(err);
    else console.log('Stations sample:', rows);
  });

  console.log('Checking stops for G103...');
  db.all("SELECT * FROM train_stops WHERE train_no = 'G103' ORDER BY seq", (err, rows) => {
    if (err) console.error(err);
    else {
      console.log('Stops for G103:', rows);
      if (rows && rows.length > 0) {
        console.log('First stop station:', rows[0].station);
        console.log('Last stop station:', rows[rows.length - 1].station);
      }
    }
  });
});

db.close();
