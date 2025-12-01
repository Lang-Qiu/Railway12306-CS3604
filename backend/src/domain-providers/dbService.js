const databaseManager = require('../infra-config/database');

class DatabaseService {
  constructor() {
    this.db = null;
  }

  async init() {
    if (!this.db) {
      // The database is now initialized and managed by DatabaseManager
      // We just need to get the instance from it.
      this.db = databaseManager.getDatabase();
    }
  }

  getDb() {
    if (!this.db) {
      // This is a fallback to ensure db is initialized if accessed before init()
      this.db = databaseManager.getDatabase();
    }
    return this.db;
  }
}

module.exports = new DatabaseService();
