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

    // --- NEW TABLES FOR ORDER MODULE ---

    this.db.run(`
      CREATE TABLE passengers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name VARCHAR(50) NOT NULL,
        phone VARCHAR(20),
        id_card_type VARCHAR(20) DEFAULT '居民身份证',
        id_card_number VARCHAR(50),
        discount_type VARCHAR(20) DEFAULT '成人',
        email VARCHAR(100),
        is_frequent BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);

    this.db.run(`
      CREATE TABLE stations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(50) NOT NULL,
        code VARCHAR(20) NOT NULL UNIQUE
      );
    `);

    this.db.run(`
      CREATE TABLE trains (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        train_no VARCHAR(20) NOT NULL,
        start_station_id INTEGER,
        end_station_id INTEGER,
        start_time VARCHAR(20),
        end_time VARCHAR(20),
        type VARCHAR(10)
      );
    `);

    this.db.run(`
      CREATE TABLE seat_types (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(50) NOT NULL,
        code VARCHAR(20)
      );
    `);

    this.db.run(`
      CREATE TABLE train_seats (
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
      CREATE TABLE orders (
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
      CREATE TABLE order_items (
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

    // Seed Trains (G27)
    // Assuming IDs: Beijing South=1, Shanghai Hongqiao=2
    this.db.run(
      `INSERT INTO trains (train_no, start_station_id, end_station_id, start_time, end_time, type) VALUES (?, ?, ?, ?, ?, ?)`,
      ['G27', 1, 2, '19:00', '23:35', 'G']
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
