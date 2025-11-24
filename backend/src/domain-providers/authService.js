const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const dbService = require('./dbService');
const sessionService = require('./sessionService');
const registrationDbService = require('./registrationDbService');
const crypto = require('../utils/crypto');

class AuthService {
  constructor() {
    this.db = null;
  }

  async init() {
    if (!this.db) {
      await dbService.init();
      this.db = dbService.getDb();
    }
  }
  // 验证用户凭据
  async validateCredentials(identifier, password) {
    try {
      await this.init();
      console.log('[Validate Credentials] Received:', { identifier, password: password ? '******' : undefined });
      // 识别标识符类型
      const type = this.identifyIdentifierType(identifier);
      console.log('[Validate Credentials] Identifier type:', type);
      
      if (type === 'invalid') {
        console.log('[Validate Credentials] Invalid identifier type.');
        return { success: false, error: '用户名或密码错误' };
      }

                  let decryptedPassword;
      try {
        decryptedPassword = crypto.decryptPassword(password);
      } catch (e) {
        console.error('[Validate Credentials] Password decryption failed:', e);
        throw new Error('Password decryption failed');
      }
      console.log('[Validate Credentials] Decrypted password (first 5 chars):', decryptedPassword.substring(0, 5));

      // 根据类型查找用户
      let user = null;
      if (type === 'username') {
        user = await registrationDbService.findUserByUsername(identifier);
      } else if (type === 'email') {
        user = await registrationDbService.findUserByEmail(identifier);
      } else if (type === 'phone') {
        user = await registrationDbService.findUserByPhone(identifier);
      }

      if (process.env.NODE_ENV === 'test') {
        console.log('login-debug', { type, found: !!user, id: user?.id, username: user?.username });
      }
      console.log('[Validate Credentials] User found:', user ? { id: user.id, username: user.username, password_hash: user.password } : null);


      if (!user) {
        console.log('[Validate Credentials] User not found in database.');
        return { success: false, error: '用户名或密码错误' };
      }

      if (user.lockout_until && new Date(user.lockout_until) > new Date()) {
        console.log(`[Validate Credentials] Account locked for user: ${user.username}`);
        return { success: false, error: '账户已被锁定，请稍后再试' };
      }

      // 验证密码
      console.log('[Validate Credentials] Comparing passwords...');
            const passwordMatch = await bcrypt.compare(decryptedPassword, user.password_hash);
      console.log('[Validate Credentials] Password match result:', passwordMatch);
      if (process.env.NODE_ENV === 'test') {
        console.log('login-debug-compare', { match: passwordMatch });
      }
      console.log('[Validate Credentials] Password match result:', passwordMatch);

      if (!passwordMatch) {
        console.log('[Validate Credentials] Password does not match.');
        const newAttempts = (user.failed_login_attempts || 0) + 1;
        if (newAttempts >= 5) {
          const lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // 锁定15分钟
          await this.db.run('UPDATE users SET failed_login_attempts = 0, lockout_until = ? WHERE id = ?', [lockoutUntil.toISOString(), user.id]);
          return { success: false, error: '登录失败次数过多，账户已锁定15分钟' };
        } else {
          await this.db.run('UPDATE users SET failed_login_attempts = ? WHERE id = ?', [newAttempts, user.id]);
        }
        return { success: false, error: '用户名或密码错误' };
      }

      // 登录成功，重置失败尝试次数
      await this.db.run('UPDATE users SET failed_login_attempts = 0, lockout_until = NULL WHERE id = ?', [user.id]);

      console.log('[Validate Credentials] Validation successful.');
      return { success: true, user };
    } catch (error) {
      console.error('Validate credentials error:', error);
      throw error;
    }
  }

  // 生成会话ID
  generateSessionId(userId) {
    try {
      return uuidv4();
    } catch (error) {
      console.error('Generate session ID error:', error);
      throw error;
    }
  }

  // 创建登录会话
  async createLoginSession(user) {
    try {
      const sessionId = this.generateSessionId(user.id);
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30分钟后过期

      const sessionData = {
        userId: user.id,
        username: user.username,
        phone: user.phone,
        // 数据库里存的是 id_card 字段，这里统一映射为会话里的 id_card_number 方便后续逻辑使用
        id_card_type: user.id_card_type || null,
        id_card_number: user.id_card || user.id_card_number,
        step: 'pending_verification' // 等待短信验证
      };

      await sessionService.createSession(sessionId, sessionData, expiresAt);
      
      return sessionId;
    } catch (error) {
      console.error('Create login session error:', error);
      throw error;
    }
  }

  // 验证证件号后4位
  async validateIdCardLast4(sessionId, idCardLast4) {
    try {
      // 获取会话数据
      const session = await sessionService.getSession(sessionId);
      if (!session) {
        console.log('❌ 会话无效或已过期, sessionId:', sessionId);
        return { success: false, error: '会话无效或已过期' };
      }

      const sessionData = session.user_data;

      console.log('🔍 会话数据:', {
        userId: sessionData.userId,
        username: sessionData.username,
        phone: sessionData.phone,
        id_card_number: sessionData.id_card_number ? '***' + sessionData.id_card_number.slice(-4) : 'undefined'
      });

      // 验证证件号后4位
      if (!sessionData.id_card_number) {
        console.log('❌ 会话中没有证件号信息');
        return { success: false, error: '请输入正确的用户信息！' };
      }

      const last4 = sessionData.id_card_number.slice(-4);
      console.log('🔍 验证证件号后4位:', {
        expected: last4,
        provided: idCardLast4,
        match: last4 === idCardLast4
      });

      if (last4 !== idCardLast4) {
        console.log('❌ 证件号后4位不匹配');
        return { success: false, error: '请输入正确的用户信息！' };
      }

      console.log('✅ 证件号验证通过');
      return { success: true, sessionData };
    } catch (error) {
      console.error('Validate ID card last 4 error:', error);
      throw error;
    }
  }

  // 生成并发送短信验证码
  async generateAndSendSmsCode(sessionId, idCardLast4) {
    try {
      // 验证证件号
      const validation = await this.validateIdCardLast4(sessionId, idCardLast4);
      if (!validation.success) {
        return validation;
      }

      const { sessionData } = validation;
      // 登录场景下先不做短信频率限制，避免正常用户被过于严格的限制拦截

      // 生成并保存验证码
      const code = await registrationDbService.createSmsVerificationCode(sessionData.phone);

      // TODO: 实际发送短信（这里模拟）
      console.log(`[SMS] 发送验证码 ${code} 到 ${sessionData.phone}`);

      return { 
        success: true, 
        message: '验证码已发送', 
        verificationCode: code,
        phone: sessionData.phone  // 返回手机号，便于前端显示
      };
    } catch (error) {
      console.error('Generate and send SMS code error:', error);
      throw error;
    }
  }

  // 验证短信验证码
  async verifySmsCode(sessionId, verificationCode) {
    try {
      await this.init();
      // 获取会话数据
      const session = await sessionService.getSession(sessionId);
      
      if (!session) {
        return { success: false, error: '会话无效或已过期' };
      }

      const sessionData = session.user_data;

      // 验证短信验证码
      const verifyResult = await registrationDbService.verifySmsCode(sessionData.phone, verificationCode);
      if (!verifyResult.success) {
        return { success: false, error: verifyResult.error };
      }

      // 更新 last_login
      await this.db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [sessionData.userId]);

      // 生成 JWT 令牌
      const token = this.generateToken({ userId: sessionData.userId, username: sessionData.username, step: 'verified' });

      return { 
        success: true, 
        sessionId, 
        token, 
        user: { 
          id: sessionData.userId, 
          username: sessionData.username, 
          email: sessionData.email, 
          phone: sessionData.phone 
        } 
      };




    } catch (error) {
      console.error('Verify SMS code error:', error);
      throw error;
    }
  }

  // 生成JWT token
  generateToken(payload, expiresIn = '30m') {
    try {
      const secret = process.env.JWT_SECRET || 'dev-secret-change-me';
      return jwt.sign({ userId: payload.userId, username: payload.username }, secret, { expiresIn });
    } catch (error) {
      console.error('Generate token error:', error);
      throw error;
    }
  }

  verifyToken(token) {
    try {
      const secret = process.env.JWT_SECRET || 'dev-secret-change-me';
      return jwt.verify(token, secret);
    } catch (error) {
      return null;
    }
  }

  refreshToken(token) {
    try {
      const decoded = this.verifyToken(token);
      if (!decoded) return null;
      return this.generateToken({ userId: decoded.userId, username: decoded.username }, '30m');
    } catch (error) {
      console.error('Refresh token error:', error);
      return null;
    }
  }

  // 验证用户名格式
  validateUsername(username) {
    // 用户名：6-30位，字母开头，只能包含字母、数字、下划线
    const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_]{5,29}$/;
    return usernameRegex.test(username);
  }

  // 验证邮箱格式
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // 验证手机号格式
  validatePhone(phone) {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  }

  // 识别标识符类型
  identifyIdentifierType(identifier) {
    if (this.validateEmail(identifier)) {
      return 'email';
    } else if (this.validatePhone(identifier)) {
      return 'phone';
    } else if (this.validateUsername(identifier)) {
      return 'username';
    }
    return 'invalid';
  }
}

module.exports = new AuthService();
