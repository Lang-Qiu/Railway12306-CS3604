
const redis = require('redis');
process.env.JSON_DB_INMEMORY = process.env.JSON_DB_INMEMORY || '1';
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const STORE_FILE = path.join(__dirname, '../../.data/jsondb_store.json');

class JsonDbService {
  constructor() {
    this.client = null;
  }

  async connect() {
    if (this.client && this.client.isOpen) {
      return;
    }
    if (process.env.JSON_DB_INMEMORY === '1') {
      if (!this.client) this.client = new InMemoryClient();
      return;
    }
    let candidate = null;
    try {
      candidate = redis.createClient({
        // 默认连接到 localhost:6379
        // 如果您的 Redis 有密码或在不同的主机上，请在此处配置
        // url: 'redis://:password@hostname:port'
      });
      candidate.on('error', (err) => console.error('Redis Client Error', err));
      await candidate.connect();
      this.client = candidate;
      console.log('✅ Successfully connected to Redis.');
    } catch (error) {
      console.error('❌ Failed to connect to Redis:', error);
      try { if (candidate) await candidate.quit(); } catch (_) {}
      this.client = new InMemoryClient();
      console.log('⚠️ Using in-memory JSON store fallback.');
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
  }

  /**
   * Creates a new user in the JSON document store.
   * This operation is atomic.
   * @param {object} userData - The user data.
   * @returns {string} The new user's ID.
   */
  async createUser(userData) {
    await this.connect();
    const { username, email, phone, password, ...rest } = userData;

    // 1. Check for existing username, email, or phone
    if (await this.client.exists(`username_to_id:${username}`)) {
      throw new Error('该用户名已被注册');
    }
    if (email && await this.client.exists(`email_to_id:${email}`)) {
      throw new Error('该邮箱已被注册');
    }
    if (phone && await this.client.exists(`phone_to_id:${phone}`)) {
      throw new Error('该手机号已被注册');
    }
    if (userData.id_card_type && userData.id_card_number) {
      const idKey = `idcard_to_id:${userData.id_card_type}:${userData.id_card_number}`;
      if (await this.client.exists(idKey)) {
        throw new Error('该证件号码已经被注册过');
      }
    }

    const userId = uuidv4();
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const userDocument = {
      userId,
      username,
      email,
      phone,
      passwordHash,
      ...rest,
      registrationDate: new Date().toISOString(),
      loginInfo: {
        lastLogin: null,
        failedLoginAttempts: 0,
        lockoutUntil: null,
      },
    };

    const multi = this.client.multi();
    multi.set(`users:${userId}`, JSON.stringify(userDocument));
    multi.set(`username_to_id:${username}`, userId);
    if (email) {
      multi.set(`email_to_id:${email}`, userId);
    }
    if (phone) {
      multi.set(`phone_to_id:${phone}`, userId);
    }
    if (userData.id_card_type && userData.id_card_number) {
      multi.set(`idcard_to_id:${userData.id_card_type}:${userData.id_card_number}`, userId);
    }

    try {
      await multi.exec();
      console.log(`✅ User created successfully with ID: ${userId}`);
      return userId;
    } catch (error) {
      console.error('❌ Failed to create user in Redis:', error);
      // Attempt to clean up if the transaction failed mid-way (though less likely with MULTI/EXEC)
      await this.client.del(`users:${userId}`);
      await this.client.del(`username_to_id:${username}`);
      if (email) await this.client.del(`email_to_id:${email}`);
      if (phone) await this.client.del(`phone_to_id:${phone}`);
      if (userData.id_card_type && userData.id_card_number) await this.client.del(`idcard_to_id:${userData.id_card_type}:${userData.id_card_number}`);
      throw new Error('创建用户时发生数据库错误');
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
    const keyMap = {
      username: `username_to_id:${identifier}`,
      email: `email_to_id:${identifier}`,
      phone: `phone_to_id:${identifier}`,
    };

    const indexKey = keyMap[type];
    if (!indexKey) {
      throw new Error('Invalid identifier type specified.');
    }

    const userId = await this.client.get(indexKey);
    if (!userId) {
      return null;
    }

    const userJson = await this.client.get(`users:${userId}`);
    if (!userJson) {
      console.error(`Data inconsistency: Index ${indexKey} points to non-existent user ${userId}`);
      return null;
    }

    return JSON.parse(userJson);
  }

  /**
   * Finds a user by id card type and number.
   * @param {string} idCardType
   * @param {string} idCardNumber
   * @returns {object | null}
   */
  async findUserByIdCard(idCardType, idCardNumber) {
    await this.connect();
    const indexKey = `idcard_to_id:${idCardType}:${idCardNumber}`;
    const userId = await this.client.get(indexKey);
    if (!userId) return null;
    const userJson = await this.client.get(`users:${userId}`);
    return userJson ? JSON.parse(userJson) : null;
  }

  /**
   * Updates a user document.
   * @param {string} userId - The ID of the user to update.
   * @param {object} updates - An object containing the fields to update.
   * @returns {object} The updated user document.
   */
  async updateUser(userId, updates) {
    await this.connect();
    const userKey = `users:${userId}`;

    const userJson = await this.client.get(userKey);
    if (!userJson) {
      throw new Error('User not found.');
    }

    const userDocument = JSON.parse(userJson);
    
    // Merge updates. A deep merge would be better for nested objects.
    const updatedDocument = { ...userDocument, ...updates };
    if (updates.loginInfo) {
        updatedDocument.loginInfo = { ...userDocument.loginInfo, ...updates.loginInfo };
    }

    await this.client.set(userKey, JSON.stringify(updatedDocument));
    return updatedDocument;
  }

  /**
   * Creates a new session.
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
class InMemoryClient {
  constructor() {
    this.store = new Map();
    this.ttl = new Map();
    this.isOpen = true;
    this.ttlExpiry = new Map();
    try {
      const dir = path.dirname(STORE_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      if (fs.existsSync(STORE_FILE)) {
        const raw = fs.readFileSync(STORE_FILE, 'utf-8');
        const data = JSON.parse(raw || '{}');
        const s = data.store || {};
        const t = data.ttlExpiry || {};
        for (const k of Object.keys(s)) this.store.set(k, s[k]);
        const now = Date.now();
        for (const k of Object.keys(t)) {
          const exp = Number(t[k] || 0);
          if (exp > now) {
            const remain = exp - now;
            if (this.ttl.has(k)) clearTimeout(this.ttl.get(k));
            const timer = setTimeout(() => {
              this.store.delete(k);
              this.ttl.delete(k);
              this.ttlExpiry.delete(k);
              this.save();
            }, remain);
            this.ttl.set(k, timer);
            this.ttlExpiry.set(k, exp);
          } else {
            this.store.delete(k);
          }
        }
      }
    } catch (_) {}
  }
  async connect() {}
  async quit() { this.isOpen = false; }
  async get(key) { return this.store.has(key) ? this.store.get(key) : null; }
  async set(key, value, options = {}) {
    this.store.set(key, value);
    if (options.EX && Number.isFinite(options.EX)) {
      if (this.ttl.has(key)) clearTimeout(this.ttl.get(key));
      const exp = Date.now() + options.EX * 1000;
      const t = setTimeout(() => {
        this.store.delete(key);
        this.ttl.delete(key);
        this.ttlExpiry.delete(key);
        this.save();
      }, options.EX * 1000);
      this.ttl.set(key, t);
      this.ttlExpiry.set(key, exp);
    } else {
      if (this.ttl.has(key)) { clearTimeout(this.ttl.get(key)); this.ttl.delete(key); this.ttlExpiry.delete(key); }
    }
    this.save();
  }
  async del(...keys) { for (const k of keys) { if (k) { this.store.delete(k); if (this.ttl.has(k)) { clearTimeout(this.ttl.get(k)); this.ttl.delete(k); this.ttlExpiry.delete(k); } } } this.save(); }
  async exists(key) { return this.store.has(key) ? 1 : 0; }
  multi() {
    const ops = [];
    return {
      set: (key, value) => ops.push({ type: 'set', key, value }),
      del: (key) => ops.push({ type: 'del', key }),
      exec: async () => { for (const op of ops) { if (op.type === 'set') { await this.set(op.key, op.value); } else if (op.type === 'del') { await this.del(op.key); } } this.save(); }
    };
  }
  on() {}
  save() {
    try {
      const dir = path.dirname(STORE_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const payload = {
        store: Object.fromEntries(this.store.entries()),
        ttlExpiry: Object.fromEntries(this.ttlExpiry.entries()),
      };
      fs.writeFileSync(STORE_FILE, JSON.stringify(payload));
    } catch (_) {}
  }
}
