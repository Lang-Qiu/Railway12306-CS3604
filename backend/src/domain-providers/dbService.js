const databaseManager = require('../infra-config/database');

class DatabaseService {
  constructor() {
    this.db = null;
  }

  async init() {
    if (!this.db) {
      try {
        this.db = databaseManager.getDatabase();
      } catch (_) {
        await databaseManager.initDatabase();
        this.db = databaseManager.getDatabase();
      }
    }
  }

  getDb() {
    if (!this.db) {
      // This is a fallback to ensure db is initialized if accessed before init()
      this.db = databaseManager.getDatabase();
    }
    return this.db;
  }

  close() {
    this.db = null;
  }

  async run(sql, params = []) {
    await this.init();
    const stmt = this.db.prepare(sql);
    if (params && params.length) stmt.bind(params);
    stmt.step();
    stmt.free();
  }

  async get(sql, params = []) {
    await this.init();
    const stmt = this.db.prepare(sql);
    if (params && params.length) stmt.bind(params);
    let row = null;
    if (stmt.step()) {
      row = stmt.getAsObject();
    }
    stmt.free();
    return row;
  }

  async all(sql, params = []) {
    await this.init();
    const stmt = this.db.prepare(sql);
    if (params && params.length) stmt.bind(params);
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
  }
}

module.exports = new DatabaseService();
