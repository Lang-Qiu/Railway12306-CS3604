/**
 * 会话服务
 * 处理用户注册会话的管理
 */

const dbService = require('./dbService');
const { v4: uuidv4 } = require('uuid');

class SessionService {
  constructor() {
    this.dbService = dbService;
    this.db = null;
  }

  async init() {
    if (!this.db) {
      await this.dbService.init();
      this.db = this.dbService.getDb();
    }
  }

  /**
   * 创建会话
   * 支持两种调用方式：
   * 1. createSession(userData) - 自动生成sessionId和过期时间（用于注册）
   * 2. createSession(sessionId, userData, expiresAt) - 使用指定的sessionId和过期时间（用于登录）
   */
  async createSession(sessionIdOrUserData, userData, expiresAt) {
    await this.init();
    try {
      let sessionId, sessionData, expireTime;
      
      // 判断调用方式
      if (typeof sessionIdOrUserData === 'string') {
        // 方式2: createSession(sessionId, userData, expiresAt)
        sessionId = sessionIdOrUserData;
        sessionData = userData;
        expireTime = expiresAt || new Date(Date.now() + 30 * 60 * 1000);
      } else {
        // 方式1: createSession(userData)
        sessionId = uuidv4();
        sessionData = sessionIdOrUserData;
        expireTime = new Date(Date.now() + 30 * 60 * 1000); // 30分钟后过期
      }
      
      this.db.run(
        `INSERT OR REPLACE INTO sessions (id, session_id, user_id, user_data, expires_at, is_active) VALUES (?, ?, ?, ?, ?, 1)`,
        [sessionId, sessionId, sessionData.userId, JSON.stringify(sessionData), expireTime.toISOString()]
      );
      
      return sessionId;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  /**
   * 获取会话数据
   */
  async getSession(sessionId) {
    await this.init();
    try {
      if (!sessionId) {
        return null;
      }

      const stmt = this.db.prepare(`SELECT * FROM sessions WHERE id = ?`);
      stmt.bind([sessionId]);
      let session = null;
      if (stmt.step()) {
        session = stmt.getAsObject();
      }
      stmt.free();

      if (!session) {
        return null;
      }

      const notExpired = new Date(session.expires_at) > new Date();
      if (!notExpired) {
        return null;
      }
      return {
        ...session,
        user_data: JSON.parse(session.user_data)
      };
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  /**
   * 删除会话
   */
  async deleteSession(sessionId) {
    await this.init();
    try {
      this.db.run(
        `DELETE FROM sessions WHERE id = ?`,
        [sessionId]
      );
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  }

  /**
   * 检查邮箱验证码发送频率
   */
  async checkEmailSendFrequency(email) {
    await this.init();
    try {
      // 检查最近1分钟内是否已发送
      const stmt = this.db.prepare(`SELECT * FROM email_verification_codes 
         WHERE email = ? 
         AND datetime(sent_at) > datetime('now', '-1 minute')
         ORDER BY sent_at DESC LIMIT 1`);
      stmt.bind([email]);
      let recentCode = null;
      if (stmt.step()) {
        recentCode = stmt.getAsObject();
      }
      stmt.free();

      return !recentCode; // 没有最近发送记录则返回true（可以发送）
    } catch (error) {
      console.error('Error checking email send frequency:', error);
      return false;
    }
  }

  /**
   * 检查短信验证码发送频率
   */
  async checkSmsSendFrequency(phone) {
    await this.init();
    try {
      // 检查最近1分钟内是否已发送
      const stmt = this.db.prepare(`SELECT * FROM verification_codes 
         WHERE phone = ? 
         AND datetime(sent_at) > datetime('now', '-1 minute')
         ORDER BY sent_at DESC LIMIT 1`);
      stmt.bind([phone]);
      let recentCode = null;
      if (stmt.step()) {
        recentCode = stmt.getAsObject();
      }
      stmt.free();

      return !recentCode; // 没有最近发送记录则返回true（可以发送）
    } catch (error) {
      console.error('Error checking sms send frequency:', error);
      return false;
    }
  }
}

module.exports = new SessionService();

