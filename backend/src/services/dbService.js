const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const logger = require('../utils/logger');

class DatabaseService {
  constructor() {
    this.db = null;
    this.init();
  }

  // Initialize database connection
  init() {
    const dbPath = process.env.NODE_ENV === 'test' 
      ? process.env.TEST_DB_PATH || path.join(__dirname, '../../database/test.db')
      : process.env.DB_PATH || path.join(__dirname, '../../database/railway.db');
    
    logger.info(`Database path: ${dbPath}`);
    
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        logger.error('Database connection error', err);
      } else {
        logger.info('Connected to SQLite database');
        this.createTables();
      }
    });
  }

  // Create tables
  createTables() {
    this.db.serialize(() => {
      // Create users table
      const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          name TEXT,
          email TEXT,
          phone TEXT UNIQUE NOT NULL,
          id_card_type TEXT,
          id_card_number TEXT,
          discount_type TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_login DATETIME,
          UNIQUE(id_card_type, id_card_number)
        )
      `;

      // Create verification codes table
      const createVerificationCodesTable = `
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
      `;

      // 创建邮箱验证码表
      const createEmailVerificationCodesTable = `
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
      `;

      // 创建会话表
      const createSessionsTable = `
        CREATE TABLE IF NOT EXISTS sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_id TEXT UNIQUE NOT NULL,
          user_data TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          expires_at DATETIME NOT NULL
        )
      `;

      this.db.run(createUsersTable);
      this.db.run(createVerificationCodesTable);
      this.db.run(createEmailVerificationCodesTable);
      this.db.run(createSessionsTable, (err) => {
        if (!err) {
           // Database migration: Add purpose column to existing verification_codes table
           // Execute migration after all tables are created
           this.migrateVerificationCodesTable();
        }
      });
    });
  }
  
  // Database migration: Add purpose column
  migrateVerificationCodesTable() {
    // Check if purpose column exists
    this.db.all("PRAGMA table_info(verification_codes)", (err, columns) => {
      if (err) {
        logger.error('Error checking table info', { error: err });
        return;
      }
      
      const hasPurposeColumn = columns.some(col => col.name === 'purpose');
      
      if (!hasPurposeColumn) {
        // Add purpose column
        this.db.run(
          "ALTER TABLE verification_codes ADD COLUMN purpose TEXT DEFAULT 'login'",
          (err) => {
            if (err) {
              logger.error('Error adding purpose column', { error: err });
            } else {
              logger.info('Successfully added purpose column to verification_codes table');
            }
          }
        );
      }
    });
  }

  // General query method - Returns single row
  async get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // General query method - Returns all rows
  async all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // General execution method - INSERT, UPDATE, DELETE
  async run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ lastID: this.lastID, changes: this.changes });
        }
      });
    });
  }

  // Execute transaction
  async transaction(callback) {
    return new Promise((resolve, reject) => {
      this.db.serialize(async () => {
        try {
          await this.run('BEGIN TRANSACTION');
          try {
            const result = await callback(this);
            await this.run('COMMIT');
            resolve(result);
          } catch (err) {
            await this.run('ROLLBACK');
            reject(err);
          }
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  // Close database connection
  async close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            logger.error('Error closing database', { error: err });
            reject(err);
          } else {
            logger.info('Database connection closed');
            this.db = null; // Clear reference
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = new DatabaseService();