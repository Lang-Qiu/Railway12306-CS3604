const dbService = require('../infra-config/database');
const fs = require('fs');
const path = require('path');

let stationMapCache = null;

function loadStationMap() {
  if (stationMapCache) return stationMapCache;
  try {
    // Try to locate station_name.js. 
    // Assuming process.cwd() is the backend root or project root.
    // If backend root: ../frontend/public
    // If project root: ./frontend/public
    let p = path.resolve(process.cwd(), '../frontend/public/station_name.js');
    if (!fs.existsSync(p)) {
        p = path.resolve(process.cwd(), 'frontend/public/station_name.js');
    }
    
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, 'utf-8');
      const match = content.match(/var\s+station_names\s*=\s*'([^']+)'/);
      if (match) {
        const raw = match[1];
        const items = raw.split('@').filter(Boolean);
        const cityToStations = {};
        const stationToCity = {};
        for (const item of items) {
          const parts = item.split('|');
          const stationName = parts[1];
          const cityName = parts[7] || stationName;
          if (!cityToStations[cityName]) cityToStations[cityName] = [];
          cityToStations[cityName].push(stationName);
          stationToCity[stationName] = cityName;
        }
        stationMapCache = { cityToStations, stationToCity };
        return stationMapCache;
      }
    }
  } catch (e) {
    console.error('Failed to load station map:', e);
  }
  stationMapCache = { cityToStations: {}, stationToCity: {} };
  return stationMapCache;
}

function listTrainsByRoute(origin, destination, date) {
  const db = dbService.getDatabase(); // Was dbService.getDb() in HEAD but origin/main uses getDatabase(). I should check database.js export.
  // database.js exports new DatabaseManager() which has getDatabase().
  // HEAD code used dbService.getDb().
  // origin/main code used dbService.getDb().
  // Wait, looking at database.js conflict I resolved:
  // It has getDatabase().
  // Did it have getDb()? No.
  // So HEAD was using a method that might not exist or was renamed?
  // Or maybe dbService was different in HEAD.
  // In HEAD's database.js (which I overwrote), it might have had getDb().
  // In origin/main's database.js (lines 318-323), it has getDatabase().
  // But wait, origin/main's trainDataService.js (lines 90, 108) calls dbService.getDb().
  // This implies DatabaseManager SHOULD have getDb().
  // But I see `getDatabase()` in the `database.js` file content I read (lines 318).
  // Did I miss `getDb` alias?
  // No.
  // This suggests `origin/main` code might be using `getDb` but `database.js` has `getDatabase`.
  // This is a potential bug in `origin/main` or I missed something.
  // Let me check `database.js` again.
  // It has `getDatabase()`.
  // So I should implement `getDb()` in `trainDataService.js` or alias it, or update calls to `getDatabase()`.
  // I will update calls to `getDatabase()`.

  const { cityToStations, stationToCity } = loadStationMap();
  const resolveStations = (input) => {
    if (cityToStations[input]) return cityToStations[input];
    const city = stationToCity[input];
    if (city && cityToStations[city]) return cityToStations[city];
    return [input];
  };
  const origins = resolveStations(origin);
  const destinations = resolveStations(destination);
  const oPlaceholders = origins.map(() => '?').join(',');
  const dPlaceholders = destinations.map(() => '?').join(',');
  
  // Use origin/destination columns (which we added to schema)
  const sql = `SELECT * FROM trains WHERE origin IN (${oPlaceholders}) AND destination IN (${dPlaceholders})`;
  const stmt = db.prepare(sql);
  stmt.bind([...origins, ...destinations]);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function filterTrainsByType(list, types) {
  throw new Error('not implemented')
}

function getTrainDetail(trainId) {
  try {
    const db = dbService.getDatabase(); // Updated to getDatabase()
    
    // Get Train Basic Info
    const trainSql = `
      SELECT t.*, s1.name as start_station_name, s2.name as end_station_name 
      FROM trains t
      LEFT JOIN stations s1 ON t.start_station_id = s1.id
      LEFT JOIN stations s2 ON t.end_station_id = s2.id
      WHERE t.id = ?
    `;
    
    const stmt = db.prepare(trainSql);
    stmt.bind([trainId]);
    
    if (!stmt.step()) {
        stmt.free();
        return null;
    }
    const train = stmt.getAsObject();
    stmt.free();
    
    // Get Seats
    const seatSql = `
      SELECT ts.*, st.name as seat_type_name, st.code as seat_type_code
      FROM train_seats ts
      JOIN seat_types st ON ts.seat_type_id = st.id
      WHERE ts.train_id = ?
    `;
    const seatStmt = db.prepare(seatSql);
    seatStmt.bind([train.id]);
    const seats = [];
    while(seatStmt.step()) {
        seats.push(seatStmt.getAsObject());
    }
    seatStmt.free();
    
    return {
        ...train,
        seats
    };
  } catch (error) {
    console.error('getTrainDetail error:', error);
    throw error;
  }
}

function computePriceBySeat(trainNo, seatType, origin, destination) {
  throw new Error('not implemented')
}

function computeSeatAvailability(trainNo, seatType, origin, destination) {
  throw new Error('not implemented')
}

module.exports = {
  listTrainsByRoute,
  filterTrainsByType,
  getTrainDetail,
  computePriceBySeat,
  computeSeatAvailability,
}
