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