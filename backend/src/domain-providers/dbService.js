const databaseManager = require('../infra-config/database');

class DatabaseService {
  constructor() {
    this.db = null;
  }

  async init() {
    if (!this.db) {
      await databaseManager.initDatabase();
      this.db = databaseManager.getDatabase();
    }
  }

  getDb() {
    if (!this.db) {
      // Ensure database is initialized before fetching instance
      // initDatabase() is idempotent inside DatabaseManager
      return (async () => {
        await databaseManager.initDatabase();
        this.db = databaseManager.getDatabase();
        return this.db;
      })();
    }
    return this.db;
  }

  async run(sql, params = []) {
    const db = await this.getDb();
    db.run(sql, params);
    let lastID = null;
    try {
      const stmt = db.prepare('SELECT last_insert_rowid() AS id');
      if (stmt.step()) {
        const obj = stmt.getAsObject();
        lastID = obj.id;
      }
      stmt.free();
    } catch (e) {}
    let changes = null;
    try {
      const stmt2 = db.prepare('SELECT changes() AS changes');
      if (stmt2.step()) {
        const obj2 = stmt2.getAsObject();
        changes = obj2.changes;
      }
      stmt2.free();
    } catch (e) {}
    return { lastID, changes };
  }

  async get(sql, params = []) {
    const db = await this.getDb();
    const stmt = db.prepare(sql);
    stmt.bind(params);
    let row = null;
    if (stmt.step()) {
      row = stmt.getAsObject();
    }
    stmt.free();
    return row;
  }

  async all(sql, params = []) {
    const db = await this.getDb();
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
  }

  close() {
    // sql.js Database does not require explicit close; release reference for tests
    this.db = null;
    return true;
  }
}

module.exports = new DatabaseService();
