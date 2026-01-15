
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')

// Generate unique DB path for this test suite
const uniqueId = crypto.randomBytes(4).toString('hex')
const dbPath = path.join(__dirname, `test-${uniqueId}.db`)

// 设置测试环境变量
process.env.NODE_ENV = 'test'
process.env.TEST_DB_PATH = dbPath
process.env.DB_PATH = dbPath
process.env.JWT_SECRET = 'test-jwt-secret-key'
process.env.JWT_EXPIRES_IN = '1h'

// 导入dbService以初始化数据库
const dbService = require('../src/services/dbService')
const databaseManager = require('../src/config/database')

// Patch createTables to use valid SQLite syntax
dbService.createTables = function() {
    this.db.serialize(() => {
      // 1. Users Table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          phone VARCHAR(20) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          id_card VARCHAR(18), -- Added for legacy support
          id_card_type VARCHAR(20),
          id_card_number VARCHAR(18),
          name VARCHAR(50),
          discount_type VARCHAR(20),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_login DATETIME,
          is_active BOOLEAN DEFAULT 1,
          UNIQUE(id_card_type, id_card_number)
        )
      `);

      // 2. SMS Codes Table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS sms_codes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          phone_number VARCHAR(20) NOT NULL,
          code VARCHAR(6) NOT NULL,
          created_at INTEGER NOT NULL,
          expires_at INTEGER NOT NULL,
          used BOOLEAN DEFAULT 0
        )
      `);
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_phone_created ON sms_codes (phone_number, created_at)`);
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_expires ON sms_codes (expires_at)`);

      // 3. Sessions Table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_id VARCHAR(36) UNIQUE NOT NULL,
          user_data TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          expires_at DATETIME NOT NULL
        )
      `);

      // 3.5 Email Verification Codes Table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS email_verification_codes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT NOT NULL,
          code TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          expires_at DATETIME NOT NULL,
          used BOOLEAN DEFAULT 0,
          sent_status TEXT DEFAULT 'sent',
          sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // 4. Verification Codes
       this.db.run(`
        CREATE TABLE IF NOT EXISTS verification_codes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          phone TEXT NOT NULL,
          code TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          expires_at DATETIME NOT NULL,
          used BOOLEAN DEFAULT 0,
          sent_status TEXT DEFAULT 'sent',
          sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          purpose TEXT DEFAULT 'login'
        )
      `);
      
      // 5. Passengers Table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS passengers (
            id TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            name VARCHAR(50) NOT NULL,
            id_card_type VARCHAR(20) DEFAULT '二代身份证',
            id_card_number VARCHAR(18) NOT NULL,
            phone VARCHAR(20),
            passenger_type VARCHAR(20) DEFAULT '成人',
            seat_preference VARCHAR(20),
            discount_type VARCHAR(20), -- Added
            points INTEGER DEFAULT 0,
            version INTEGER DEFAULT 1,
            is_deleted BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // 6. Trains Table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS trains (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            train_no VARCHAR(20) NOT NULL,
            departure_date DATE NOT NULL,
            departure_station VARCHAR(50) NOT NULL,
            arrival_station VARCHAR(50) NOT NULL,
            departure_time TIME NOT NULL,
            arrival_time TIME NOT NULL,
            duration VARCHAR(20),
            business_seat_price DECIMAL(10, 2),
            first_class_seat_price DECIMAL(10, 2),
            second_class_seat_price DECIMAL(10, 2),
            hard_sleeper_price DECIMAL(10, 2),
            hard_seat_price DECIMAL(10, 2),
            no_seat_price DECIMAL(10, 2),
            business_seat_count INTEGER DEFAULT 0,
            first_class_seat_count INTEGER DEFAULT 0,
            second_class_seat_count INTEGER DEFAULT 0,
            hard_sleeper_seat_count INTEGER DEFAULT 0,
            hard_seat_count INTEGER DEFAULT 0,
            no_seat_count INTEGER DEFAULT 0,
            is_direct BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      // 7. Train Stops Table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS train_stops (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            train_no VARCHAR(20) NOT NULL,
            station VARCHAR(50) NOT NULL,
            seq INTEGER NOT NULL,
            depart_time TIME,
            arrive_time TIME,
            distance INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 8. Train Cars Table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS train_cars (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            train_no VARCHAR(20) NOT NULL,
            car_no INTEGER NOT NULL,
            seat_type VARCHAR(20) NOT NULL,
            seat_count INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 9. Train Fares Table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS train_fares (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            train_no VARCHAR(20) NOT NULL,
            from_station VARCHAR(50) NOT NULL,
            to_station VARCHAR(50) NOT NULL,
            distance_km DECIMAL(10, 2),
            second_class_price DECIMAL(10, 2),
            first_class_price DECIMAL(10, 2),
            business_price DECIMAL(10, 2),
            hard_sleeper_price DECIMAL(10, 2),
            soft_sleeper_price DECIMAL(10, 2),
            hard_seat_price DECIMAL(10, 2),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 10. Seat Status Table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS seat_status (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            train_no VARCHAR(20) NOT NULL,
            departure_date DATE NOT NULL,
            seat_type VARCHAR(20) NOT NULL,
            seat_no VARCHAR(20) NOT NULL,
            from_station VARCHAR(50) NOT NULL,
            to_station VARCHAR(50) NOT NULL,
            status VARCHAR(20) DEFAULT 'available',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
    });
};

// 给数据库一点时间来初始化
beforeAll(async () => {
  // Monkey patch initDatabase
  if (databaseManager.initDatabase) {
      databaseManager.initDatabase = async function(isTest = false) {
           const sqlite3 = require('sqlite3').verbose()
           const { open } = require('sqlite')
           
           const dbPath = isTest 
              ? process.env.TEST_DB_PATH 
              : process.env.DB_PATH
            
           const db = await open({
              filename: dbPath,
              driver: sqlite3.Database
           })
           
           // Use corrected SQL - Same as above
           // To ensure consistency, we duplicate the schema here
           
            await db.exec(`
              CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                phone VARCHAR(20) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                id_card VARCHAR(18), -- Added
                id_card_type VARCHAR(20),
                id_card_number VARCHAR(18),
                name VARCHAR(50),
                discount_type VARCHAR(20),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_login DATETIME,
                is_active BOOLEAN DEFAULT 1,
                UNIQUE(id_card_type, id_card_number)
              )
            `)
        
            await db.exec(`
              CREATE TABLE IF NOT EXISTS sms_codes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                phone_number VARCHAR(20) NOT NULL,
                code VARCHAR(6) NOT NULL,
                created_at INTEGER NOT NULL,
                expires_at INTEGER NOT NULL,
                used BOOLEAN DEFAULT 0
              )
            `)
            await db.exec(`CREATE INDEX IF NOT EXISTS idx_phone_created ON sms_codes (phone_number, created_at)`)
            await db.exec(`CREATE INDEX IF NOT EXISTS idx_expires ON sms_codes (expires_at)`)
        
            await db.exec(`
              CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id VARCHAR(36) UNIQUE NOT NULL,
                user_data TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                expires_at DATETIME NOT NULL
              )
            `)
            
            await db.exec(`
                CREATE TABLE IF NOT EXISTS passengers (
                    id TEXT PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    name VARCHAR(50) NOT NULL,
                    id_card_type VARCHAR(20) DEFAULT '二代身份证',
                    id_card_number VARCHAR(18) NOT NULL,
                    phone VARCHAR(20),
                    passenger_type VARCHAR(20) DEFAULT '成人',
                    seat_preference VARCHAR(20),
                    discount_type VARCHAR(20), -- Added
                    points INTEGER DEFAULT 0,
                    version INTEGER DEFAULT 1,
                    is_deleted BOOLEAN DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            await db.exec(`
                CREATE TABLE IF NOT EXISTS trains (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    train_no VARCHAR(20) NOT NULL,
                    departure_date DATE NOT NULL,
                    departure_station VARCHAR(50) NOT NULL,
                    arrival_station VARCHAR(50) NOT NULL,
                    departure_time TIME NOT NULL,
                    arrival_time TIME NOT NULL,
                    duration VARCHAR(20),
                    business_seat_price DECIMAL(10, 2),
                    first_class_seat_price DECIMAL(10, 2),
                    second_class_seat_price DECIMAL(10, 2),
                    hard_sleeper_price DECIMAL(10, 2),
                    hard_seat_price DECIMAL(10, 2),
                    no_seat_price DECIMAL(10, 2),
                    business_seat_count INTEGER DEFAULT 0,
                    first_class_seat_count INTEGER DEFAULT 0,
                    second_class_seat_count INTEGER DEFAULT 0,
                    hard_sleeper_seat_count INTEGER DEFAULT 0,
                    hard_seat_count INTEGER DEFAULT 0,
                    no_seat_count INTEGER DEFAULT 0,
                    is_direct BOOLEAN DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
           
            await db.exec(`
                CREATE TABLE IF NOT EXISTS train_stops (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    train_no VARCHAR(20) NOT NULL,
                    station VARCHAR(50) NOT NULL,
                    seq INTEGER NOT NULL,
                    depart_time TIME,
                    arrive_time TIME,
                    distance INTEGER,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            await db.exec(`
                CREATE TABLE IF NOT EXISTS train_fares (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    train_no VARCHAR(20),
                    from_station VARCHAR(50),
                    to_station VARCHAR(50),
                    distance_km INTEGER,
                    second_class_price DECIMAL(10, 2),
                    first_class_price DECIMAL(10, 2),
                    business_price DECIMAL(10, 2),
                    hard_sleeper_price DECIMAL(10, 2),
                    soft_sleeper_price DECIMAL(10, 2),
                    hard_seat_price DECIMAL(10, 2),
                    no_seat_price DECIMAL(10, 2),
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            await db.exec(`
                CREATE TABLE IF NOT EXISTS seat_status (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    train_no VARCHAR(20),
                    departure_date DATE,
                    seat_type VARCHAR(20),
                    seat_no VARCHAR(20),
                    from_station VARCHAR(50),
                    to_station VARCHAR(50),
                    status VARCHAR(20) DEFAULT 'available',
                    order_id VARCHAR(36),
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                 )
             `);

             await db.exec(`
                 CREATE TABLE IF NOT EXISTS orders (
                     id VARCHAR(36) PRIMARY KEY,
                     user_id INTEGER NOT NULL,
                     train_number VARCHAR(20) NOT NULL,
                     departure_station VARCHAR(50) NOT NULL,
                     arrival_station VARCHAR(50) NOT NULL,
                     departure_date DATE NOT NULL,
                     departure_time TIME NOT NULL,
                     arrival_time TIME NOT NULL,
                     total_price DECIMAL(10, 2) NOT NULL,
                     status VARCHAR(20) DEFAULT 'PENDING',
                     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                     updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                 )
             `);

             await db.exec(`
                 CREATE TABLE IF NOT EXISTS order_details (
                     id INTEGER PRIMARY KEY AUTOINCREMENT,
                     order_id VARCHAR(36) NOT NULL,
                     passenger_id VARCHAR(36) NOT NULL,
                     passenger_name VARCHAR(50) NOT NULL,
                     id_card_type VARCHAR(20) NOT NULL,
                     id_card_number VARCHAR(18) NOT NULL,
                     seat_type VARCHAR(20) NOT NULL,
                     ticket_type VARCHAR(20) DEFAULT '成人票',
                     price DECIMAL(10, 2) NOT NULL,
                     sequence_number INTEGER,
                     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                     updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                 )
             `);
            
            if (isTest) {
              this.testDb = db
           } else {
              this.db = db
           }
           return db
      }
      
      await databaseManager.initDatabase(true)
  }
  
  // Ensure dbService is initialized
  if (dbService.init) {
      await dbService.init()
  }
  
  // 等待数据库初始化完成
  await new Promise(resolve => setTimeout(resolve, 500))
})

// 全局测试设置
afterAll(async () => {
  // 关闭数据库连接
  if (dbService.close) {
      const result = dbService.close()
      if (result && typeof result.then === 'function') {
          await result
      }
  }
  
  if (databaseManager.closeDatabase) {
      await databaseManager.closeDatabase(true)
  }
  
  // 给数据库一点时间来关闭
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // 删除测试数据库文件
  if (fs.existsSync(dbPath)) {
    try {
      fs.unlinkSync(dbPath)
    } catch (err) {
      // 忽略删除错误
      console.warn(`Failed to delete test db ${dbPath}: ${err.message}`)
    }
  }
})

module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: [__filename],
  testTimeout: 10000
}
