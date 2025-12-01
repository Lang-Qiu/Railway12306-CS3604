const initSqlJs = require('sql.js');
const bcrypt = require('bcryptjs');

class DatabaseManager {
  constructor() {
    this.db = null;
    this.isInitialized = false;
  }

  async initDatabase() {
    if (this.isInitialized) {
      return;
    }

    const SQL = await initSqlJs();
    this.db = new SQL.Database();

    this.db.run(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        phone VARCHAR(20) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        id_card VARCHAR(18),
        real_name VARCHAR(50),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME,
        is_active BOOLEAN DEFAULT 1,
        failed_login_attempts INTEGER DEFAULT 0,
        lockout_until DATETIME
      );
    `);

    this.db.run(`
      CREATE TABLE email_verification_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email VARCHAR(100) NOT NULL,
        code VARCHAR(6) NOT NULL,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        used INTEGER DEFAULT 0,
        sent_status TEXT,
        sent_at TEXT
      );
    `);

    this.db.run(`
      CREATE TABLE verification_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone VARCHAR(20) NOT NULL,
        code VARCHAR(6) NOT NULL,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        used INTEGER DEFAULT 0,
        sent_status TEXT,
        sent_at TEXT
      );
    `);

    this.db.run(`
      CREATE TABLE sessions (
        id VARCHAR(36) PRIMARY KEY,
        session_id VARCHAR(36) UNIQUE NOT NULL,
        user_id INTEGER NOT NULL,
        user_data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL,
        is_active BOOLEAN DEFAULT 1
      );
    `);

    await this.insertTestData();

    this.isInitialized = true;
    console.log('Database initialized successfully with sql.js.');
  }

  async insertTestData() {
    const hashedPassword1 = await bcrypt.hash('password123', 10);
    const hashedPassword2 = await bcrypt.hash('password456', 10);

    this.db.run(
      `INSERT OR IGNORE INTO users (username, email, phone, password_hash, real_name, id_card) VALUES (?, ?, ?, ?, ?, ?)`,
      ['testuser', 'test@example.com', '13800138000', hashedPassword1, '张三', '110101199001011234']
    );
    this.db.run(
      `INSERT OR IGNORE INTO users (username, email, phone, password_hash, real_name, id_card) VALUES (?, ?, ?, ?, ?, ?)`,
      ['user2', 'user2@example.com', '13900139000', hashedPassword2, '李四', '110101199002022345']
    );

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000);
    this.db.run(
      `INSERT OR IGNORE INTO verification_codes (phone, code, created_at, expires_at, used, sent_status, sent_at) VALUES (?, ?, ?, ?, 0, 'seed', ?)`,
      ['13800138000', '123456', now.toISOString(), expiresAt.toISOString(), now.toISOString()]
    );
    this.db.run(
      `INSERT OR IGNORE INTO verification_codes (phone, code, created_at, expires_at, used, sent_status, sent_at) VALUES (?, ?, ?, ?, 0, 'seed', ?)`,
      ['13900139000', '654321', now.toISOString(), expiresAt.toISOString(), now.toISOString()]
    );
    console.log('Test data inserted.');
  }

  getDatabase() {
    if (!this.isInitialized) {
      throw new Error('Database has not been initialized. Call initDatabase() first.');
    }
    return this.db;
  }
}

module.exports = new DatabaseManager();
