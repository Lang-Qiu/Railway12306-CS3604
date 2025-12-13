const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const jsonDbService = require('./jsonDbService'); // <-- Replaced old DB services
const crypto = require('../utils/crypto');

class AuthService {
  // ... (constructor and init can be removed if jsonDbService handles its own connection)

  // 验证用户凭据 (Refactored)
  async validateCredentials(identifier, password) {
    try {
      console.log('[Validate Credentials] Received:', { identifier, password: password ? '******' : undefined });
      const type = this.identifyIdentifierType(identifier);
      console.log('[Validate Credentials] Identifier type:', type);

      if (type === 'invalid') {
        return { success: false, error: '用户名或密码错误' };
      }

      let decryptedPassword;
      try {
        decryptedPassword = crypto.decryptPassword(password);
      } catch (e) {
        console.error('[Validate Credentials] Password decryption failed:', e);
        throw new Error('Password decryption failed');
      }

      let user = await jsonDbService.findUserBy(identifier, type);
      console.log('[Validate Credentials] User found:', user ? { id: user.userId, username: user.username } : null);

      if (!user) {
        // Fallback: query SQLite users table for compatibility
        try {
          const registrationDbService = require('./registrationDbService');
          let dbUser = null;
          if (type === 'username') {
            dbUser = await registrationDbService.findUserByUsername(identifier);
          } else if (type === 'email') {
            dbUser = await registrationDbService.findUserByEmail(identifier);
          } else if (type === 'phone') {
            dbUser = await registrationDbService.findUserByPhone(identifier);
          }
          if (!dbUser) {
            return { success: false, error: '用户名或密码错误' };
          }
          user = {
            id: dbUser.id,
            userId: dbUser.id,
            username: dbUser.username,
            email: dbUser.email,
            phone: dbUser.phone,
            id_card_type: dbUser.id_card_type,
            id_card_number: dbUser.id_card_number,
            passwordHash: dbUser.password,
            loginInfo: { failedLoginAttempts: 0, lockoutUntil: null }
          };
        } catch (e) {
          console.error('[Validate Credentials] Fallback to DB failed:', e);
          return { success: false, error: '用户名或密码错误' };
        }
      }

      if (user.loginInfo.lockoutUntil && new Date(user.loginInfo.lockoutUntil) > new Date()) {
        return { success: false, error: '账户已被锁定，请稍后再试' };
      }

      const passwordMatch = await bcrypt.compare(decryptedPassword, user.passwordHash);
      console.log('[Validate Credentials] Password match result:', passwordMatch);

      if (!passwordMatch) {
        const newAttempts = (user.loginInfo.failedLoginAttempts || 0) + 1;
        let loginInfo = { failedLoginAttempts: newAttempts };
        let error = '用户名或密码错误';

        if (newAttempts >= 5) {
          const lockoutUntil = new Date(Date.now() + 15 * 60 * 1000);
          loginInfo.lockoutUntil = lockoutUntil.toISOString();
          loginInfo.failedLoginAttempts = 0; // Reset after locking
          error = '登录失败次数过多，账户已锁定15分钟';
        }
        
        await jsonDbService.updateUser(user.userId, { loginInfo });
        return { success: false, error };
      }

      // 登录成功，重置失败尝试次数
      try {
        await jsonDbService.updateUser(user.userId, { 
          loginInfo: { failedLoginAttempts: 0, lockoutUntil: null, lastLogin: new Date().toISOString() }
        });
      } catch (_) {
        // if user comes from SQLite fallback, JSON store may not have the record; ignore
      }

      console.log('[Validate Credentials] Validation successful.');
      return { success: true, user };
    } catch (error) {
      console.error('Validate credentials error:', error);
      throw error;
    }
  }

  // ... (generateSessionId remains the same)
  generateSessionId(userId) {
    try {
      return uuidv4();
    } catch (error) {
      console.error('Generate session id error:', error);
      throw error;
    }
  }

  // 创建登录会话 (Refactored)
  async createLoginSession(user) {
    try {
      const sessionId = this.generateSessionId(user.userId);
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30分钟后过期
      
      const sessionData = {
        userId: user.userId,
        username: user.username,
        phone: user.phone,
        id_card_type: user.id_card_type || user.idCardType,
        id_card_number: user.id_card_number || user.idCardNumber,
        step: 'pending_verification'
      };

      await jsonDbService.createSession(sessionId, sessionData, expiresAt);
      
      return sessionId;
    } catch (error) {
      console.error('Create login session error:', error);
      throw error;
    }
  }

  // 验证证件号后4位 (Refactored)
  async validateIdCardLast4(sessionId, idCardLast4) {
    try {
      const session = await jsonDbService.getSession(sessionId);
      if (!session) {
        return { success: false, error: '会话无效或已过期' };
      }
      const last4 = (session.id_card_number || '').slice(-4);
      if (last4 && last4 === idCardLast4) {
        session.step = 'pending_sms_verification';
        await jsonDbService.createSession(sessionId, session, new Date(session.expiresAt));
        return { success: true, phone: session.phone };
      }
      return { success: false, error: '证件号验证失败' };
    } catch (error) {
      console.error('Validate ID card error:', error);
      return { success: false, error: '会话无效或已过期' };
    }
  }

  // 生成并发送短信验证码 (Refactored)
  async generateAndSendSmsCode(sessionId) {
    try {
      const session = await jsonDbService.getSession(sessionId);
      if (!session || session.step !== 'pending_sms_verification') {
        return { success: false, error: '会话无效或状态不正确' };
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const smsKey = `sms_code:${sessionId}`;
      await jsonDbService.createVerificationCode(smsKey, code, 300); // 5分钟有效

      console.log(`[SMS Service] Sending code ${code} to phone ${session.phone}`);
      // 在这里集成真实的短信服务提供商

      return { success: true };
    } catch (error) {
      console.error('Send SMS code error:', error);
      throw error;
    }
  }

  // 验证短信验证码 (Refactored)
  async verifySmsCode(sessionId, code) {
    try {
      const session = await jsonDbService.getSession(sessionId);
      if (!session) {
        return { success: false, error: '会话无效或已过期' };
      }

      const smsKey = `sms_code:${sessionId}`;
      const storedCode = await jsonDbService.getVerificationCode(smsKey);

      if (storedCode === code) {
        session.step = 'verified';
        await jsonDbService.createSession(sessionId, session, new Date(session.expiresAt)); // Update session
        const token = this.generateJwtToken(session.userId, session.username);
        return { success: true, token };
      } else {
        return { success: false, error: '短信验证码错误' };
      }
    } catch (error) {
      console.error('Verify SMS code error:', error);
      throw error;
    }
  }

  // 生成JWT令牌 (No changes needed)
  generateJwtToken(userId, username) {
    try {
      const payload = { id: userId, username: username };
      const secret = process.env.JWT_SECRET || 'your-default-secret';
      const options = { expiresIn: '1h' };
      return jwt.sign(payload, secret, options);
    } catch (error) {
      console.error('Generate JWT token error:', error);
      throw error;
    }
  }

  // 兼容旧接口：生成简化令牌
  generateToken(user) {
    try {
      const tokenData = {
        userId: user.userId,
        username: user.username,
        timestamp: Date.now()
      };
      return Buffer.from(JSON.stringify(tokenData)).toString('base64');
    } catch (error) {
      console.error('Generate token error:', error);
      throw error;
    }
  }

  // 识别标识符类型 (No changes needed)
  identifyIdentifierType(identifier) {
    if (/^\S+@\S+\.\S+$/.test(identifier)) {
      return 'email';
    }
    if (/^\d{11}$/.test(identifier)) {
      return 'phone';
    }
    if (/^[a-zA-Z0-9_]{3,20}$/.test(identifier)) {
      return 'username';
    }
    return 'invalid';
  }

  validatePhone(phone) {
    try {
      if (!phone || typeof phone !== 'string') return false;
      if (!/^\d{11}$/.test(phone)) return false;
      return true;
    } catch (_) {
      return false;
    }
  }
}

module.exports = new AuthService();
