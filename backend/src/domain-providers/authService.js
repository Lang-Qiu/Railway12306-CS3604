const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const jsonDbService = require('./jsonDbService');
const dbService = require('./dbService');
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

      const decryptedPassword = crypto.decryptPassword(password);

      await dbService.init();
      let user = null;
      if (type === 'username') {
        user = await dbService.get('SELECT * FROM users WHERE username = ?', [identifier]);
      } else if (type === 'email') {
        user = await dbService.get('SELECT * FROM users WHERE email = ?', [identifier]);
      } else if (type === 'phone') {
        user = await dbService.get('SELECT * FROM users WHERE phone = ?', [identifier]);
      }
      console.log('[Validate Credentials] User found:', user ? { id: user.id, username: user.username } : null);

      if (!user) {
        const jUser = await jsonDbService.findUserBy(identifier, type);
        console.log('[Validate Credentials] JSON user found:', jUser ? { userId: jUser.userId, username: jUser.username } : null);
        if (!jUser) {
          return { success: false, error: '用户名或密码错误' };
        }

        const jLock = jUser.loginInfo?.lockoutUntil;
        if (jLock && new Date(jLock) > new Date()) {
          return { success: false, error: '账户已被锁定，请稍后再试' };
        }

        const jHashed = jUser.passwordHash;
        const jMatch = jHashed ? await bcrypt.compare(decryptedPassword, jHashed) : false;
        console.log('[Validate Credentials] JSON user password match:', jMatch);
        if (!jMatch) {
          const newAttempts = (jUser.loginInfo?.failedLoginAttempts || 0) + 1;
          let lockoutUntil = null;
          let error = '用户名或密码错误';
          if (newAttempts >= 5) {
            lockoutUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
            error = '登录失败次数过多，账户已锁定15分钟';
          }
          await jsonDbService.updateUser(jUser.userId, { loginInfo: { failedLoginAttempts: newAttempts % 5, lockoutUntil } });
          return { success: false, error };
        }

        await jsonDbService.updateUser(jUser.userId, { loginInfo: { failedLoginAttempts: 0, lockoutUntil: null, lastLogin: new Date().toISOString() } });
        console.log('[Validate Credentials] Validation successful (JSON store).');
        return { success: true, user: jUser };
      }

      if (user.lockout_until && new Date(user.lockout_until) > new Date()) {
        return { success: false, error: '账户已被锁定，请稍后再试' };
      }

      const hashed = user.password || user.password_hash;
      const passwordMatch = hashed ? await bcrypt.compare(decryptedPassword, hashed) : false;
      console.log('[Validate Credentials] Password match result:', passwordMatch);

      if (!passwordMatch) {
        const currentAttempts = Number(user.failed_login_attempts || 0);
        const newAttempts = currentAttempts + 1;
        let lockoutUntil = null;
        let error = '用户名或密码错误';

        if (newAttempts >= 5) {
          lockoutUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
          error = '登录失败次数过多，账户已锁定15分钟';
        }
        await dbService.run('UPDATE users SET failed_login_attempts = ?, lockout_until = ? WHERE id = ?', [newAttempts % 5, lockoutUntil, user.id]);
        return { success: false, error };
      }

      await dbService.run('UPDATE users SET failed_login_attempts = 0, lockout_until = NULL, last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

      console.log('[Validate Credentials] Validation successful.');
      return { success: true, user };
    } catch (error) {
      console.error('Validate credentials error:', error);
      throw error;
    }
  }

  // ... (generateSessionId remains the same)

  // 创建登录会话 (Refactored)
  async createLoginSession(user) {
    try {
      const sessionId = this.generateSessionId(user.id || user.userId);
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30分钟后过期
      
      const sessionData = {
        userId: user.id || user.userId,
        username: user.username,
        phone: user.phone,
        id_card_type: user.id_card_type || 'ID',
        id_card_number: user.id_card_number || user.id_card || '',
        step: 'pending_verification'
      };

      await jsonDbService.createSession(sessionId, sessionData, expiresAt);
      
      return sessionId;
    } catch (error) {
      console.error('Create login session error:', error);
      throw error;
    }
  }

  generateSessionId(userId) {
    return uuidv4();
  }

  // 验证证件号后4位 (Refactored)
  async validateIdCardLast4(sessionId, idCardLast4) {
    try {
      const session = await jsonDbService.getSession(sessionId);
      if (!session) {
        return { success: false, error: '会话无效或已过期' };
      }

      if (session.id_card_number.slice(-4) === idCardLast4) {
        session.step = 'pending_sms_verification';
        await jsonDbService.createSession(sessionId, session, new Date(session.expiresAt)); // Update session
        return { success: true, phone: session.phone };
      } else {
        return { success: false, error: '证件号验证失败' };
      }
    } catch (error) {
      console.error('Validate ID card error:', error);
      throw error;
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

  refreshToken(token) {
    try {
      const secret = process.env.JWT_SECRET || 'your-default-secret';
      const decoded = jwt.verify(token, secret);
      return this.generateJwtToken(decoded.id, decoded.username);
    } catch (_) {
      return null;
    }
  }

  // 识别标识符类型 (No changes needed)
  identifyIdentifierType(identifier) {
    if (/^\d{11}$/.test(identifier)) {
      return 'phone';
    } else if (/^\S+@\S+\.\S+$/.test(identifier)) {
      return 'email';
    } else if (/^[a-zA-Z0-9_]{3,20}$/.test(identifier)) {
      return 'username';
    } else {
      return 'invalid';
    }
  }
}

module.exports = new AuthService();
