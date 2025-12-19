const dbService = require('./dbService');

function listTrainsByRoute(origin, destination, date) {
  const db = dbService.getDb();
  const sql = 'SELECT * FROM trains WHERE origin = ? AND destination = ?';
  const stmt = db.prepare(sql);
  stmt.bind([origin, destination]);
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
    const db = dbService.getDb();
    
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