const databaseManager = require('../infra-config/database');

class DatabaseService {
  constructor() {
    this.db = null;
  }

  async init() {
    if (!this.db) {
      this.db = databaseManager.getDatabase();
    }
  }

  getDb() {
    if (!this.db) {
      try {
        this.db = databaseManager.getDatabase();
      } catch (e) {
        console.error('Failed to get database instance:', e);
        throw e;
      }
    }
    return this.db;
  }

  close() {
    if (this.db) {
      try {
        this.db.close();
      } catch (e) {
        console.warn('Error closing database:', e);
      }
      this.db = null;
    }
  }

  // Wrapper for sql.js to match sqlite3/better-sqlite3 style used by services
  all(sql, params = []) {
    const db = this.getDb();
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
  }

  get(sql, params = []) {
    const rows = this.all(sql, params);
    return rows.length > 0 ? rows[0] : undefined;
  }

  run(sql, params = []) {
    const db = this.getDb();
    db.run(sql, params);
    
    // Attempt to get lastID and changes
    let lastID = 0;
    try {
        const res = db.exec('SELECT last_insert_rowid()');
        if (res.length > 0 && res[0].values.length > 0) {
            lastID = res[0].values[0][0];
        }
    } catch (e) {}

    let changes = 0;
    try {
        changes = db.getRowsModified();
    } catch (e) {}

    return { lastID, changes };
  }
}

module.exports = new DatabaseService();
