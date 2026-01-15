const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库文件路径
const dbPath = process.env.NODE_ENV === 'test' 
  ? process.env.TEST_DB_PATH || path.join(__dirname, '../database/test.db')
  : process.env.DB_PATH || path.join(__dirname, '../database/railway.db');

let dbInstance = null;

/**
 * 获取数据库实例
 */
function getDatabase() {
  if (!dbInstance) {
    dbInstance = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('数据库连接失败:', err.message);
      }
    });
  }
  return dbInstance;
}

/**
 * Execute query (return multiple rows)
 * @param {string} sql - SQL statement
 * @param {Array} params - Parameters
 * @returns {Promise<Array>} Query result
 */
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
}

/**
 * Execute query (return single row)
 * @param {string} sql - SQL statement
 * @param {Array} params - Parameters
 * @returns {Promise<Object|null>} Query result
 */
function queryOne(sql, params = []) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row || null);
      }
    });
  });
}

/**
 * Execute update/insert/delete operation
 * @param {string} sql - SQL statement
 * @param {Array} params - Parameters
 * @returns {Promise<Object>} Object containing lastID and changes
 */
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({
          lastID: this.lastID,
          changes: this.changes
        });
      }
    });
  });
}

/**
 * Close database connection
 */
function close() {
  if (dbInstance) {
    dbInstance.close((err) => {
      if (err) {
        logger.error('Failed to close database connection', { error: err.message });
      }
      dbInstance = null;
    });
  }
}

module.exports = {
  getDatabase,
  query,
  queryOne,
  run,
  close
};
