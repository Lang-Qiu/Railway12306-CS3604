const initSqlJs = require('sql.js');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

class DatabaseManager {
  constructor() {
    this.db = null;
    this.isInitialized = false;
    this.dbFilePath = null;
    this.suspendAutosave = false;
  }

  async initDatabase() {
    if (this.isInitialized) {
      return;
    }

    const SQL = await initSqlJs();
    // 用户数据存到 user.db，车次数据保留在 railway.db
    this.dbFilePath = process.env.DB_FILE || path.resolve(__dirname, '../../database/user.db');
    fs.mkdirSync(path.dirname(this.dbFilePath), { recursive: true });

    let loadedFromFile = false;
    if (fs.existsSync(this.dbFilePath)) {
      try {
        const fileBuffer = fs.readFileSync(this.dbFilePath);
        const u8 = new Uint8Array(fileBuffer);
        this.db = new SQL.Database(u8);
        loadedFromFile = true;
      } catch (e) {
        // 如果加载失败，退回新库，后续会覆盖写入
        this.db = new SQL.Database();
      }
    } else {
      this.db = new SQL.Database();
    }

    // 初始化/补全表结构（IF NOT EXISTS，避免重复错误）
    this.suspendAutosave = true;
    this.ensureSchema();
    await this.seedIfEmpty();
    this.suspendAutosave = false;
    this.saveToFile();

    // 包装 run，任何写操作后自动落盘
    this.wrapRunWithAutosave();

    this.isInitialized = true;
    console.log(`Database initialized with sql.js (${loadedFromFile ? 'loaded from file' : 'new file'}) at: ${this.dbFilePath}`);
  }

  ensureSchema() {
    // users
    this.db.run(`
      CREATE TABLE IF NOT EXISTS users (
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
    // 对已有 users 表执行列补全（老库可能缺少这些列）
    try {
      const res = this.db.exec(`PRAGMA table_info(users);`);
      const existingCols = new Set(
        (res && res[0] && res[0].values ? res[0].values : []).map(r => String(r[1]))
      );
      const addIfMissing = (name, ddl) => {
        if (!existingCols.has(name)) {
          this.db.run(`ALTER TABLE users ADD COLUMN ${name} ${ddl};`);
        }
      };
      addIfMissing('id_card', 'VARCHAR(18)');
      addIfMissing('real_name', 'VARCHAR(50)');
      addIfMissing('created_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP');
      addIfMissing('updated_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP');
      addIfMissing('last_login', 'DATETIME');
      addIfMissing('is_active', 'BOOLEAN DEFAULT 1');
      addIfMissing('failed_login_attempts', 'INTEGER DEFAULT 0');
      addIfMissing('lockout_until', 'DATETIME');
    } catch (e) {
      // 忽略补全失败，继续后续流程
    }

    // email_verification_codes
    this.db.run(`
      CREATE TABLE IF NOT EXISTS email_verification_codes (
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

    // verification_codes
    this.db.run(`
      CREATE TABLE IF NOT EXISTS verification_codes (
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

    // sessions
    this.db.run(`
      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(36) PRIMARY KEY,
        session_id VARCHAR(36) UNIQUE NOT NULL,
        user_id INTEGER NOT NULL,
        user_data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL,
        is_active BOOLEAN DEFAULT 1
      );
    `);

    // 对已有 sessions 表执行列补全
    try {
      const res = this.db.exec(`PRAGMA table_info(sessions);`);
      const existingCols = new Set(
        (res && res[0] && res[0].values ? res[0].values : []).map(r => String(r[1]))
      );
      const addIfMissing = (name, ddl) => {
        if (!existingCols.has(name)) {
          this.db.run(`ALTER TABLE sessions ADD COLUMN ${name} ${ddl};`);
        }
      };
      addIfMissing('user_id', 'INTEGER NOT NULL DEFAULT 0');
      addIfMissing('user_data', 'TEXT');
      addIfMissing('created_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP');
      addIfMissing('expires_at', 'DATETIME');
      addIfMissing('is_active', 'BOOLEAN DEFAULT 1');
    } catch (e) {
      console.warn('Could not check/add sessions columns:', e.message);
    }

    // 对已有 verification_codes 表执行列补全
    try {
      const res = this.db.exec(`PRAGMA table_info(verification_codes);`);
      const existingCols = new Set(
        (res && res[0] && res[0].values ? res[0].values : []).map(r => String(r[1]))
      );
      const addIfMissing = (name, ddl) => {
        if (!existingCols.has(name)) {
          this.db.run(`ALTER TABLE verification_codes ADD COLUMN ${name} ${ddl};`);
        }
      };
      addIfMissing('phone', 'VARCHAR(20)');
      addIfMissing('code', 'VARCHAR(6)');
      addIfMissing('created_at', 'TEXT');
      addIfMissing('expires_at', 'TEXT');
      addIfMissing('used', 'INTEGER DEFAULT 0');
      addIfMissing('sent_status', 'TEXT');
      addIfMissing('sent_at', 'TEXT');
    } catch (e) {
      console.warn('Could not check/add verification_codes columns:', e.message);
    }

    // 对已有 email_verification_codes 表执行列补全
    try {
      const res = this.db.exec(`PRAGMA table_info(email_verification_codes);`);
      const existingCols = new Set(
        (res && res[0] && res[0].values ? res[0].values : []).map(r => String(r[1]))
      );
      const addIfMissing = (name, ddl) => {
        if (!existingCols.has(name)) {
          this.db.run(`ALTER TABLE email_verification_codes ADD COLUMN ${name} ${ddl};`);
        }
      };
      addIfMissing('email', 'VARCHAR(100)');
      addIfMissing('code', 'VARCHAR(6)');
      addIfMissing('created_at', 'TEXT');
      addIfMissing('expires_at', 'TEXT');
      addIfMissing('used', 'INTEGER DEFAULT 0');
      addIfMissing('sent_status', 'TEXT');
      addIfMissing('sent_at', 'TEXT');
    } catch (e) {
      console.warn('Could not check/add email_verification_codes columns:', e.message);
    }
  }

  async seedIfEmpty() {
    // 如果 users 表为空，插入少量测试数据
    try {
      const stmt = this.db.prepare('SELECT COUNT(1) as cnt FROM users');
      stmt.step();
      const row = stmt.getAsObject();
      stmt.free();
      if (row && Number(row.cnt) === 0) {
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
    } catch {
      // ignore
    }
  }

  saveToFile() {
    try {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(this.dbFilePath, buffer);
    } catch (e) {
      console.error('Failed to persist database file:', e);
    }
  }

  wrapRunWithAutosave() {
    const originalRun = this.db.run.bind(this.db);
    this.db.run = (...args) => {
      const res = originalRun(...args);
      if (!this.suspendAutosave) {
        this.saveToFile();
      }
      return res;
    };
  }

  getDatabase() {
    if (!this.isInitialized) {
      throw new Error('Database has not been initialized. Call initDatabase() first.');
    }
    return this.db;
  }
}

module.exports = new DatabaseManager();