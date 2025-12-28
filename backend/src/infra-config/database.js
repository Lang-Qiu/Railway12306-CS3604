const initSqlJs = require('sql.js');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const DB_FILE_PATH = path.join(__dirname, '../../database/railway.db');

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
    
    // Try to load existing database from file
    if (fs.existsSync(DB_FILE_PATH)) {
      try {
        const filebuffer = fs.readFileSync(DB_FILE_PATH);
        this.db = new SQL.Database(filebuffer);
        console.log('Database loaded from disk.');
      } catch (err) {
        console.error('Failed to load database from disk, creating new one:', err);
        this.db = new SQL.Database();
      }
    } else {
      console.log('No existing database found, creating new one.');
      this.db = new SQL.Database();
    }

    // Ensure tables exist (idempotent if loaded from disk)
    this.createTables();

    // --- Schema Migration & Repair ---
    try {
      const tableInfo = this.db.exec("PRAGMA table_info(users)")[0].values;
      const columns = tableInfo.map(c => c[1]);
      
      // Check for 'password_hash' vs 'password'
      if (!columns.includes('password_hash') && columns.includes('password')) {
        console.log("Migrating 'password' to 'password_hash'...");
        this.db.run("ALTER TABLE users RENAME COLUMN password TO password_hash");
      } else if (!columns.includes('password_hash')) {
        console.log("Adding missing 'password_hash' column...");
        this.db.run("ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) DEFAULT ''");
      }

      // Check for 'real_name' vs 'name'
      if (!columns.includes('real_name') && columns.includes('name')) {
        console.log("Migrating 'name' to 'real_name'...");
        this.db.run("ALTER TABLE users RENAME COLUMN name TO real_name");
      } else if (!columns.includes('real_name')) {
        console.log("Adding missing 'real_name' column...");
        this.db.run("ALTER TABLE users ADD COLUMN real_name VARCHAR(50)");
      }

      // Check for 'id_card' vs 'id_card_number'
      if (!columns.includes('id_card') && columns.includes('id_card_number')) {
        console.log("Migrating 'id_card_number' to 'id_card'...");
        this.db.run("ALTER TABLE users RENAME COLUMN id_card_number TO id_card");
      } else if (!columns.includes('id_card')) {
        console.log("Adding missing 'id_card' column...");
        this.db.run("ALTER TABLE users ADD COLUMN id_card VARCHAR(100)");
      }

      // Check for 'id_card_hash'
      if (!columns.includes('id_card_hash')) {
        console.log("Adding missing 'id_card_hash' column...");
        this.db.run("ALTER TABLE users ADD COLUMN id_card_hash VARCHAR(64)");
      }

      // Check for 'discount_type'
      if (!columns.includes('discount_type')) {
        console.log("Adding missing 'discount_type' column...");
        this.db.run("ALTER TABLE users ADD COLUMN discount_type VARCHAR(20) DEFAULT '成人'");
      }

      // Check for 'failed_login_attempts'
      if (!columns.includes('failed_login_attempts')) {
        console.log("Adding missing 'failed_login_attempts' column...");
        this.db.run("ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0");
      }

      // Check for 'lockout_until'
      if (!columns.includes('lockout_until')) {
        console.log("Adding missing 'lockout_until' column...");
        this.db.run("ALTER TABLE users ADD COLUMN lockout_until DATETIME");
      }

      // Check for 'last_login'
      if (!columns.includes('last_login')) {
        console.log("Adding missing 'last_login' column...");
        this.db.run("ALTER TABLE users ADD COLUMN last_login DATETIME");
      }

      this.saveDatabase();
      console.log("Schema migration completed.");

    } catch (e) {
      console.error("Schema migration failed:", e);
      // Fallback: If migration fails badly, we might need to recreate the table
      // But for now, just logging error is safer than deleting data.
    }

    // Only insert test data if users table is empty
    const result = this.db.exec("SELECT count(*) as count FROM users");
    if (result[0].values[0][0] === 0) {
      await this.insertTestData();
      this.saveDatabase();
    }

    this.isInitialized = true;
    console.log('Database initialized successfully with sql.js.');
  }

  saveDatabase() {
    if (!this.db) return;
    try {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      // Ensure directory exists
      const dir = path.dirname(DB_FILE_PATH);
      if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_FILE_PATH, buffer);
      console.log('Database saved to disk.');
    } catch (err) {
      console.error('Failed to save database to disk:', err);
    }
  }

  getDb() {
    return this.db;
  }

  createTables() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE,
        phone VARCHAR(20) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        id_card VARCHAR(100), -- Increased length for encryption
        real_name VARCHAR(50),
        discount_type VARCHAR(20) DEFAULT '成人',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME,
        is_active BOOLEAN DEFAULT 1,
        failed_login_attempts INTEGER DEFAULT 0,
        lockout_until DATETIME
      );
    `);

    // ... (rest of the tables with IF NOT EXISTS) ...
    // To be concise, I'm just replacing the initDatabase block, 
    // but the tool requires exact match or complete file rewrite. 
    // I will rewrite the createTables part to be robust.

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

    this.db.run(`
      CREATE TABLE IF NOT EXISTS passengers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name VARCHAR(50) NOT NULL,
        phone VARCHAR(20),
        id_card_type VARCHAR(20) DEFAULT '二代居民身份证',
        id_card_number VARCHAR(50),
        discount_type VARCHAR(20) DEFAULT '成人',
        verification_status VARCHAR(20) DEFAULT '已通过',
        email VARCHAR(100),
        is_frequent BOOLEAN DEFAULT 1,
        seat_preference VARCHAR(20),
        special_needs VARCHAR(200),
        is_common BOOLEAN DEFAULT 1,
        version INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS stations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(50) NOT NULL,
        code VARCHAR(20) NOT NULL UNIQUE
      );
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS trains (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        train_no VARCHAR(20) NOT NULL,
        train_type VARCHAR(10),
        origin VARCHAR(50),
        destination VARCHAR(50),
        departure_time VARCHAR(10),
        arrival_time VARCHAR(10),
        planned_duration_min INTEGER,
        business_price REAL,
        first_class_price REAL,
        second_class_price REAL,
        no_seat_price REAL,
        soft_sleeper_price REAL,
        hard_sleeper_price REAL,
        dong_sleeper_price REAL,
        start_station_id INTEGER,
        end_station_id INTEGER,
        start_time VARCHAR(20),
        end_time VARCHAR(20),
        type VARCHAR(10)
      );
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS seat_types (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(50) NOT NULL,
        code VARCHAR(20)
      );
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS train_seats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        train_id INTEGER,
        seat_type_id INTEGER,
        price DECIMAL(10, 2),
        total_count INTEGER,
        available_count INTEGER,
        FOREIGN KEY (train_id) REFERENCES trains(id),
        FOREIGN KEY (seat_type_id) REFERENCES seat_types(id)
      );
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        train_id INTEGER,
        status VARCHAR(20) DEFAULT 'PENDING',
        total_price DECIMAL(10, 2),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (train_id) REFERENCES trains(id)
      );
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER,
        passenger_id INTEGER,
        seat_type_id INTEGER,
        seat_no VARCHAR(20),
        price DECIMAL(10, 2),
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (passenger_id) REFERENCES passengers(id),
        FOREIGN KEY (seat_type_id) REFERENCES seat_types(id)
      );
    `);
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

    // Seed Passengers for testuser (id: 1)
    this.db.run(
      `INSERT INTO passengers (user_id, name, phone, id_card_number, discount_type) VALUES (?, ?, ?, ?, ?)`,
      [1, '王小明', '13800138001', '330101199001015678', '成人']
    );
    this.db.run(
      `INSERT INTO passengers (user_id, name, phone, id_card_number, discount_type) VALUES (?, ?, ?, ?, ?)`,
      [1, '李小红', '13800138002', '110101199002026789', '成人']
    );

    // Seed Stations
    this.db.run(`INSERT INTO stations (name, code) VALUES ('北京南', 'BJP')`);
    this.db.run(`INSERT INTO stations (name, code) VALUES ('上海虹桥', 'SHH')`);
    this.db.run(`INSERT INTO stations (name, code) VALUES ('南京南', 'NJH')`);

    // Seed Seat Types
    this.db.run(`INSERT INTO seat_types (name, code) VALUES ('二等座', 'O')`); // O is code for 2nd class
    this.db.run(`INSERT INTO seat_types (name, code) VALUES ('一等座', 'M')`); // M is code for 1st class
    this.db.run(`INSERT INTO seat_types (name, code) VALUES ('商务座', '9')`); // 9 is code for business

    // Seed Trains (G27) - origin/main style
    // Assuming IDs: Beijing South=1, Shanghai Hongqiao=2
    this.db.run(
      `INSERT INTO trains (train_no, start_station_id, end_station_id, start_time, end_time, type, origin, destination) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['G27', 1, 2, '19:00', '23:35', 'G', '北京南', '上海虹桥'] // Populating both sets of fields for compatibility
    );
    
    // Seed Train Seats for G27 (train_id=1)
    // 2nd Class (seat_type_id=1)
    this.db.run(
      `INSERT INTO train_seats (train_id, seat_type_id, price, total_count, available_count) VALUES (?, ?, ?, ?, ?)`,
      [1, 1, 553.0, 500, 100]
    );
    // 1st Class (seat_type_id=2)
    this.db.run(
      `INSERT INTO train_seats (train_id, seat_type_id, price, total_count, available_count) VALUES (?, ?, ?, ?, ?)`,
      [1, 2, 933.0, 100, 20]
    );

    // Insert test trains from HEAD
    // Note: IDs will autoincrement from 2
    const trains = [
      // 上海 -> 北京
      ['G1', 'G', '上海', '北京', '09:00', '13:30', 270, 1500, 900, 550, 100, null, null, null],
      ['G2', 'G', '上海', '北京', '10:00', '14:30', 270, 1500, 900, 550, 100, null, null, null],
      ['G101', 'G', '上海虹桥', '北京南', '08:00', '12:30', 270, 1600, 950, 580, 100, null, null, null],
      ['D1', 'D', '上海', '北京', '11:00', '21:00', 600, null, 400, 250, 100, null, null, null],
      // 普速含卧铺
      ['Z1', 'Z', '上海', '北京', '19:00', '07:00', 720, null, null, null, 150, 320, 260, null],
      ['K101', 'K', '上海南', '北京西', '13:00', '13:00', 1440, null, null, null, 120, 280, 220, null],
      // 北京 -> 上海
      ['G3', 'G', '北京', '上海', '07:00', '11:30', 270, 1500, 900, 550, 100, null, null, null],
      ['G5', 'G', '北京南', '上海虹桥', '08:05', '12:35', 270, 1600, 950, 580, 100, null, null, null],
      ['G7', 'G', '北京南', '上海虹桥', '10:00', '14:28', 268, 1600, 950, 580, 100, null, null, null],
      ['D2', 'D', '北京', '上海', '12:00', '22:00', 600, null, 400, 250, 100, null, null, null],
      // 普速含卧铺
      ['K102', 'K', '北京西', '上海南', '14:00', '14:00', 1440, null, null, null, 120, 300, 240, null],
      // 动卧示例（夜间动车组动卧）
      ['D305', 'D', '北京南', '上海虹桥', '22:10', '06:30', 500, null, 500, 320, null, null, null, 680]
      ,
      // 北京 ↔ 广州
      ['G801', 'G', '北京南', '广州南', '07:30', '15:00', 450, 2200, 1300, 800, 100, null, null, null],
      ['G802', 'G', '广州南', '北京南', '08:10', '15:40', 450, 2200, 1300, 800, 100, null, null, null],
      ['Z35', 'Z', '北京', '广州', '18:30', '10:20', 950, null, null, null, 160, 380, 300, null],
      ['K1203', 'K', '广州', '北京西', '12:20', '18:00', 1740, null, null, null, 120, 320, 260, null],
      // 上海 ↔ 广州
      ['G1301', 'G', '上海虹桥', '广州南', '09:20', '14:50', 330, 2100, 1250, 780, 100, null, null, null],
      ['G1302', 'G', '广州南', '上海虹桥', '10:10', '15:40', 330, 2100, 1250, 780, 100, null, null, null],
      ['D367', 'D', '上海', '广州', '08:00', '18:30', 630, null, 600, 380, 100, null, null, null],
      ['K511', 'K', '广州', '上海南', '16:40', '18:20', 1500, null, null, null, 120, 300, 240, null],
      // 北京 ↔ 天津（短途高铁）
      ['G201', 'G', '北京南', '天津', '08:10', '09:00', 50, 300, 180, 95, null, null, null, null],
      ['G202', 'G', '天津', '北京南', '09:30', '10:20', 50, 300, 180, 95, null, null, null, null],
      ['G203', 'G', '北京南', '天津西', '11:00', '11:35', 35, 250, 150, 80, null, null, null, null],
      // 天津 ↔ 上海
      ['G2102', 'G', '天津西', '上海虹桥', '12:30', '17:30', 300, 1800, 1100, 700, 100, null, null, null],
      ['D2103', 'D', '上海虹桥', '天津西', '13:10', '22:40', 570, null, 550, 340, 100, null, null, null],
      ['K2104', 'K', '天津', '上海南', '15:00', '15:00', 1440, null, null, null, 120, 280, 220, null],
      // 上海 ↔ 重庆
      ['G197', 'G', '上海虹桥', '重庆北', '08:30', '15:20', 410, 2000, 1200, 750, 100, null, null, null],
      ['D2205', 'D', '上海虹桥', '重庆西', '10:00', '20:30', 630, null, 620, 390, 100, null, null, null],
      ['K1122', 'K', '重庆北', '上海南', '12:10', '18:30', 1860, null, null, null, 120, 340, 280, null],
      // 北京 ↔ 重庆
      ['G309', 'G', '北京西', '重庆北', '07:00', '14:20', 440, 2100, 1250, 780, 100, null, null, null],
      ['D310', 'D', '重庆北', '北京西', '09:00', '19:40', 640, null, 620, 390, 100, null, null, null],
      ['K430', 'K', '北京', '重庆西', '18:20', '18:00', 1380, null, null, null, 120, 320, 260, null],
      // 广州 ↔ 重庆
      ['G2951', 'G', '广州南', '重庆西', '09:40', '16:30', 410, 2000, 1180, 720, 100, null, null, null],
      ['K2952', 'K', '重庆西', '广州', '14:20', '20:00', 1740, null, null, null, 120, 320, 260, null]
    ];

    for (const t of trains) {
      this.db.run(
        `INSERT INTO trains (train_no, train_type, origin, destination, departure_time, arrival_time, planned_duration_min, business_price, first_class_price, second_class_price, no_seat_price, soft_sleeper_price, hard_sleeper_price, dong_sleeper_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        t
      );
    }

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
