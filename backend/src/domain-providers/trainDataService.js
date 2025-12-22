const dbService = require('./dbService');
const fs = require('fs');
const path = require('path');

let stationMapCache = null;

function loadStationMap() {
  if (stationMapCache) return stationMapCache;
  try {
    const p = path.resolve(process.cwd(), '../frontend/public/station_name.js');
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
  const db = dbService.getDb();
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

function getTrainDetail(trainNo) {
  throw new Error('not implemented')
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
