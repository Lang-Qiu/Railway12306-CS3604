
const redis = require('redis');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const databaseManager = require('../infra-config/database');
const { encryptData, decryptData } = require('../utils/crypto');
const crypto = require('crypto');

class InMemoryClient {
  constructor() {
    this.store = new Map();
    this.ttl = new Map();
    this.isOpen = true;
  }
  async connect() {}
  async quit() { this.isOpen = false; }
  async get(key) { return this.store.has(key) ? this.store.get(key) : null; }
  async set(key, value, options = {}) {
    this.store.set(key, value);
    if (options.EX && Number.isFinite(options.EX)) {
      if (this.ttl.has(key)) clearTimeout(this.ttl.get(key));
      const t = setTimeout(() => {
        this.store.delete(key);
        this.ttl.delete(key);
      }, options.EX * 1000);
      this.ttl.set(key, t);
    }
  }
  async del(...keys) { for (const k of keys) { if (k) { this.store.delete(k); if (this.ttl.has(k)) { clearTimeout(this.ttl.get(k)); this.ttl.delete(k); } } } }
  async exists(key) { return this.store.has(key) ? 1 : 0; }
  multi() {
    const ops = [];
    return {
      set: (key, value) => ops.push({ type: 'set', key, value }),
      del: (key) => ops.push({ type: 'del', key }),
      exec: async () => { for (const op of ops) { if (op.type === 'set') { await this.set(op.key, op.value); } else if (op.type === 'del') { await this.del(op.key); } } }
    };
  }
  on() {}
}

class JsonDbService {
  constructor() {
    this.client = null;
  }

  async connect() {
    if (this.client && this.client.isOpen) {
      return;
    }
    // Ensure SQLite is initialized
    await databaseManager.initDatabase();

    if (process.env.JSON_DB_INMEMORY === '1') {
      if (!this.client) this.client = new InMemoryClient();
      return;
    }
    let candidate = null;
    try {
      candidate = redis.createClient({
        // 默认连接到 localhost:6379
      });
      candidate.on('error', (err) => console.error('Redis Client Error', err));
      await candidate.connect();
      this.client = candidate;
      console.log('✅ Successfully connected to Redis.');
    } catch (error) {
      console.error('❌ Failed to connect to Redis:', error);
      try { if (candidate) await candidate.quit(); } catch (_) {}
      this.client = new InMemoryClient();
      console.log('⚠️ Using in-memory JSON store fallback for Sessions/Cache.');
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
  }

  /**
   * Creates a new user in the SQLite database.
   * This operation is persistent.
   * @param {object} userData - The user data.
   * @returns {string} The new user's ID.
   */
  async createUser(userData) {
    await this.connect();
    const { username, email, phone, password, idCardType, idCardNumber, name, discountType } = userData;

    // Check uniqueness (SQLite UNIQUE constraints will also enforce this, but good to check early)
    // Actually, we can rely on try/catch of db.run but explicit checks return better errors.
    if (await this.findUserBy(username, 'username')) throw new Error('该用户名已被注册');
    if (email && await this.findUserBy(email, 'email')) throw new Error('该邮箱已被注册');
    if (phone && await this.findUserBy(phone, 'phone')) throw new Error('该手机号已被注册');
    
    if (idCardNumber) {
        // Hash for searching
        const idHash = crypto.createHash('sha256').update(idCardNumber).digest('hex');
        const db = databaseManager.getDb();
        const existing = db.exec("SELECT id FROM users WHERE id_card_hash = ?", [idHash]);
        if (existing.length > 0 && existing[0].values.length > 0) {
             throw new Error('该证件号码已经被注册过');
        }
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Encrypt sensitive data
    const idCardEncrypted = idCardNumber ? encryptData(idCardNumber) : null;
    const idHash = idCardNumber ? crypto.createHash('sha256').update(idCardNumber).digest('hex') : null;

    try {
      const db = databaseManager.getDb();
      db.run(
        `INSERT INTO users (username, email, phone, password_hash, real_name, id_card, id_card_hash, discount_type) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [username, email, phone, passwordHash, name, idCardEncrypted, idHash, discountType]
      );
      
      // Get the ID of the inserted user
      const res = db.exec("SELECT last_insert_rowid() as id");
      const userId = res[0].values[0][0];
      
      // Persist to disk
      databaseManager.saveDatabase();
      
      console.log(`✅ User created successfully in SQLite with ID: ${userId}`);
      return userId.toString();
    } catch (error) {
      console.error('❌ Failed to create user in SQLite:', error);
      throw new Error('创建用户时发生数据库错误: ' + error.message);
    }
  }

  /**
   * Finds a user by a given identifier (username, email, or phone).
   * @param {string} identifier - The value to search for.
   * @param {'username' | 'email' | 'phone'} type - The type of identifier.
   * @returns {object | null} The user document or null if not found.
   */
  async findUserBy(identifier, type) {
    await this.connect();
    const db = databaseManager.getDb();
    
    const fieldMap = {
        'username': 'username',
        'email': 'email',
        'phone': 'phone'
    };
    
    if (!fieldMap[type]) throw new Error('Invalid identifier type');
    
    const sql = `SELECT * FROM users WHERE ${fieldMap[type]} = ?`;
    const result = db.exec(sql, [identifier]);
    
    if (result.length === 0 || result[0].values.length === 0) return null;
    
    const row = result[0].values[0];
    const columns = result[0].columns;
    const user = {};
    columns.forEach((col, index) => {
        user[col] = row[index];
    });
    
    // Map to expected format
    user.userId = user.id.toString();
    // Decrypt ID card
    if (user.id_card) user.idCardNumber = decryptData(user.id_card);
    
    // Map snake_case columns to camelCase
    user.passwordHash = user.password_hash;
    user.discountType = user.discount_type;
    user.name = user.real_name;

    // Add loginInfo structure expected by authService
    user.loginInfo = {
        lastLogin: user.last_login,
        failedLoginAttempts: user.failed_login_attempts,
        lockoutUntil: user.lockout_until
    };
    
    return user;
  }

  /**
   * Finds a user by id card type and number.
   * @param {string} idCardType
   * @param {string} idCardNumber
   * @returns {object | null}
   */
  async findUserByIdCard(idCardType, idCardNumber) {
    await this.connect();
    const db = databaseManager.getDb();
    const idHash = crypto.createHash('sha256').update(idCardNumber).digest('hex');
    
    const result = db.exec("SELECT * FROM users WHERE id_card_hash = ?", [idHash]);
    if (result.length === 0 || result[0].values.length === 0) return null;
    
    const row = result[0].values[0];
    const columns = result[0].columns;
    const user = {};
    columns.forEach((col, index) => { user[col] = row[index]; });
    
    user.userId = user.id.toString();
    if (user.id_card) user.idCardNumber = decryptData(user.id_card);
    
    // Map snake_case to camelCase
    user.passwordHash = user.password_hash;
    user.discountType = user.discount_type;
    user.name = user.real_name;
    
    return user;
  }

  /**
   * Finds a user by user ID.
   * @param {string} userId
   * @returns {object | null}
   */
  async getUserById(userId) {
    await this.connect();
    const db = databaseManager.getDb();
    const result = db.exec("SELECT * FROM users WHERE id = ?", [userId]);
    
    if (result.length === 0 || result[0].values.length === 0) return null;
    
    const row = result[0].values[0];
    const columns = result[0].columns;
    const user = {};
    columns.forEach((col, index) => { user[col] = row[index]; });
    
    user.userId = user.id.toString();
    if (user.id_card) user.idCardNumber = decryptData(user.id_card);
    
    // Map snake_case to camelCase
    user.passwordHash = user.password_hash;
    user.name = user.real_name;
    user.discountType = user.discount_type;
    
    return user;
  }

  /**
   * Updates a user document.
   * @param {string} userId - The ID of the user to update.
   * @param {object} updates - An object containing the fields to update.
   * @returns {object} The updated user document.
   */
  async updateUser(userId, updates) {
    await this.connect();
    const db = databaseManager.getDb();
    
    // Construct SQL UPDATE
    const fields = [];
    const values = [];
    
    if (updates.email) { fields.push("email = ?"); values.push(updates.email); }
    if (updates.phone) { fields.push("phone = ?"); values.push(updates.phone); }
    if (updates.discountType) { fields.push("discount_type = ?"); values.push(updates.discountType); }
    if (updates.loginInfo) {
        if (updates.loginInfo.failedLoginAttempts !== undefined) { 
            fields.push("failed_login_attempts = ?"); values.push(updates.loginInfo.failedLoginAttempts); 
        }
        if (updates.loginInfo.lockoutUntil !== undefined) { 
            fields.push("lockout_until = ?"); values.push(updates.loginInfo.lockoutUntil); 
        }
        if (updates.loginInfo.lastLogin !== undefined) { 
            fields.push("last_login = ?"); values.push(updates.loginInfo.lastLogin); 
        }
    }
    
    if (fields.length === 0) return await this.getUserById(userId);
    
    fields.push("updated_at = CURRENT_TIMESTAMP");
    
    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    values.push(userId);
    
    try {
        db.run(sql, values);
        databaseManager.saveDatabase();
        return await this.getUserById(userId);
    } catch (error) {
        console.error('Update user error:', error);
        throw error;
    }
  }

  /**
   * Creates a new session.
   * (Kept in Redis/Memory)
   * @param {string} sessionId - The ID for the new session.
   * @param {object} sessionData - The data to store in the session.
   * @param {Date} expiresAt - The session's expiration date.
   */
  async createSession(sessionId, sessionData, expiresAt) {
    await this.connect();
    const sessionKey = `sessions:${sessionId}`;
    const sessionDocument = {
      sessionId,
      ...sessionData,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
    };
    
    const expiresIn = Math.round((expiresAt.getTime() - Date.now()) / 1000);
    if (expiresIn > 0) {
      await this.client.set(sessionKey, JSON.stringify(sessionDocument), {
        EX: expiresIn,
      });
    }
  }

  /**
   * Retrieves a session.
   * @param {string} sessionId - The ID of the session to retrieve.
   * @returns {object | null} The session document or null.
   */
  async getSession(sessionId) {
    await this.connect();
    const sessionKey = `sessions:${sessionId}`;
    const sessionJson = await this.client.get(sessionKey);
    return sessionJson ? JSON.parse(sessionJson) : null;
  }

  /**
   * Deletes a session immediately.
   * @param {string} sessionId
   */
  async deleteSession(sessionId) {
    await this.connect();
    const sessionKey = `sessions:${sessionId}`;
    await this.client.del(sessionKey);
  }

  /**
   * Creates a verification code with an expiration.
   * @param {string} key - The key to store the code against (e.g., `sms_code:sessionId`).
   * @param {string} code - The verification code.
   * @param {number} expiresInSeconds - The expiration time in seconds.
   */
  async createVerificationCode(key, code, expiresInSeconds) {
    await this.connect();
    await this.client.set(key, code, { EX: expiresInSeconds });
  }

  /**
   * Retrieves a verification code.
   * @param {string} key - The key where the code is stored.
   * @returns {string | null} The verification code or null.
   */
  async getVerificationCode(key) {
    await this.connect();
    return await this.client.get(key);
  }

  /**
   * Try rate limit on a key within a time window.
   * Returns true if allowed, false if limited.
   */
  async tryRateLimit(key, windowSeconds) {
    await this.connect();
    const exists = await this.client.exists(key);
    if (exists) return false;
    await this.client.set(key, '1', { EX: windowSeconds });
    return true;
  }
}

module.exports = new JsonDbService();

