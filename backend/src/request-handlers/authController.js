const { validationResult } = require('express-validator');
const authService = require('../domain-providers/authService');
const messages = require('../message-catalog/messages');
const crypto = require('../utils/crypto');
const loginRateMap = new Map();

class AuthController {
  /**
   * 账号口令登录入口（语义重写：凭据受理）
   * 内部采用策略选择与早退控制，外部契约保持一致
   */
  async login(req, res) {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'local';
    const now = Date.now();
    const windowMs = 60 * 1000;
    const limit = 10;
    const record = loginRateMap.get(ip) || { count: 0, start: now };
    if (now - record.start > windowMs) {
      record.count = 0;
      record.start = now;
    }
    record.count += 1;
    loginRateMap.set(ip, record);
    if (record.count > limit) {
      return res.status(429).json({ success: false, error: '请求过于频繁，请稍后再试' });
    }
    // CSRF 校验
    try {
      if (['POST','PUT','DELETE'].includes(req.method)) {
        const headerToken = req.headers['x-csrf-token'];
        const cookieHeader = req.headers['cookie'] || '';
        const cookieTokenMatch = cookieHeader.match(/XSRF-TOKEN=([^;]+)/);
        const cookieToken = cookieTokenMatch ? cookieTokenMatch[1] : null;
        if (!headerToken || !cookieToken || headerToken !== cookieToken) {
          return res.status(403).json({ success: false, error: 'CSRF token 无效' });
        }
      }
    } catch {}
    const { identifier, password } = req.body;
    console.log(`[Login Attempt] identifier: ${identifier}`);

    try {
      const missing = [];
      if (!identifier || identifier.trim() === '') missing.push(messages.login.missingIdentifier);
      if (!password || password.trim() === '') missing.push(messages.login.missingPassword);
      if (missing.length) {
        console.log(`[Login Failed] Missing fields: ${missing.join(', ')}`);
        return res.status(400).json({ success: false, errors: missing });
      }

      if (password.length < 6) {
        console.log(`[Login Failed] Password too short for identifier: ${identifier}`);
        return res.status(400).json({ success: false, error: messages.login.passwordTooShort });
      }

      const result = await authService.validateCredentials(identifier, password);
      if (!result.success) {
        console.log(`[Login Failed] Invalid credentials for identifier: ${identifier}`);
        return res.status(401).json({ success: false, error: result.error });
      }

      const sessionId = await authService.createLoginSession(result.user);
      const token = authService.generateToken({ userId: result.user.userId, username: result.user.username, step: 'pending_verification' });

      console.log(`[Login Success] Session created for user: ${result.user.username} (ID: ${result.user.userId})`);
      return res.status(200).json({ success: true, sessionId, token, message: messages.login.pendingVerification });
    } catch (error) {
      console.error('Login error:', error);
      if (error.message && error.message.includes('decryption')) {
        return res.status(500).json({ success: false, message: '密码解密失败' });
      }
      return res.status(500).json({ success: false, message: '服务器内部错误' });
    }
  }

  /**
   * 登录短信验证码下发（语义重写：校验关键信息并触发一次性码）
   * 分支采用守卫式早退，避免深层嵌套
   */
  async sendVerificationCode(req, res) {
    const { phoneNumber, sessionId, idCardLast4 } = req.body;
    console.log(`[SMS Code Request] SID: ${sessionId}, Phone: ${phoneNumber}`);

    try {
      if (sessionId && idCardLast4) {
        if (!idCardLast4 || idCardLast4.length !== 4) {
          console.log(`[SMS Code Failed] Invalid ID card format for SID: ${sessionId}`);
          return res.status(400).json({ success: false, error: '证件号后4位格式不正确' });
        }

        const result = await authService.generateAndSendSmsCode(sessionId, idCardLast4);
        if (result.code === 429) {
          console.log(`[SMS Code Failed] Rate limit exceeded for SID: ${sessionId}`);
          return res.status(429).json({ success: false, error: result.error });
        }
        if (!result.success) {
          console.log(`[SMS Code Failed] Error for SID: ${sessionId}: ${result.error}`);
          return res.status(400).json({ success: false, error: result.error });
        }
        console.log(`[SMS Code Success] Code sent for SID: ${sessionId}`);
        return res.status(200).json({ success: true, message: result.message, verificationCode: result.verificationCode, phone: result.phone });
      }

      if (phoneNumber) {
        if (!authService.validatePhone(phoneNumber)) {
          console.log(`[SMS Code Failed] Invalid phone number: ${phoneNumber}`);
          return res.status(400).json({ success: false, errors: ['请输入有效的手机号'] });
        }

        const registrationDbService = require('../domain-providers/registrationDbService');
        const sessionService = require('../domain-providers/sessionService');
        const canSend = await sessionService.checkSmsSendFrequency(phoneNumber);
        if (!canSend) {
          console.log(`[SMS Code Failed] Rate limit exceeded for phone: ${phoneNumber}`);
          return res.status(429).json({ success: false, error: messages.sms.tooFrequent });
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        await registrationDbService.createSmsVerificationCode(phoneNumber, code);
        console.log(`[SMS] 发送验证码 ${code} 到 ${phoneNumber}`);
        return res.status(200).json({ success: true, message: messages.sms.codeSent });
      }

      console.log(`[SMS Code Failed] Missing sessionId or phoneNumber`);
      return res.status(400).json({ success: false, message: '会话ID不能为空' });
    } catch (error) {
      console.error('Send verification code error:', error);
      return res.status(500).json({ success: false, message: '服务器内部错误' });
    }
  }

  /**
   * 短信验证码核验并登录（语义重写：双通道校验）
   * 支持会话通道与手机号通道，分支早退保证等价逻辑
   */
  async verifyLogin(req, res) {
    const { sessionId, verificationCode, phoneNumber } = req.body;
    console.log(`[Verify Login Attempt] SID: ${sessionId}, Phone: ${phoneNumber}`);

    try {
      if (!verificationCode || !/^\d{6}$/.test(verificationCode)) {
        const msg = !verificationCode ? '验证码不能为空' : '验证码必须为6位数字';
        console.log(`[Verify Login Failed] Invalid code format for SID/Phone: ${sessionId || phoneNumber}`);
        return res.status(400).json({ success: false, errors: [msg] });
      }

      if (sessionId) {
        const result = await authService.verifySmsCode(sessionId, verificationCode);
        if (!result.success) {
          console.log(`[Verify Login Failed] Invalid code for SID: ${sessionId}`);
          const statusCode = result.error.includes('会话') ? 400 : 401;
          return res.status(statusCode).json({ success: false, error: result.error });
        }
        console.log(`[Verify Login Success] Login successful for SID: ${sessionId}`);
        return res.status(200).json({ success: true, sessionId: result.sessionId, token: result.token, user: result.user, message: messages.login.success });
      }

      if (phoneNumber) {
        const registrationDbService = require('../domain-providers/registrationDbService');
        const dbService = require('../domain-providers/dbService');
        const verifyResult = await registrationDbService.verifySmsCode(phoneNumber, verificationCode);
        if (!verifyResult.success) {
          console.log(`[Verify Login Failed] Invalid code for phone: ${phoneNumber}`);
          return res.status(401).json({ success: false, error: verifyResult.error });
        }

        await dbService.init();
        const db = dbService.getDb();
        const stmt = db.prepare('SELECT * FROM users WHERE phone = ?');
        stmt.bind([phoneNumber]);
        let user = null;
        if (stmt.step()) {
          user = stmt.getAsObject();
        }
        stmt.free();
        if (!user) {
          console.log(`[Verify Login Failed] User not found for phone: ${phoneNumber}`);
          return res.status(401).json({ success: false, error: '用户不存在' });
        }

        const newSessionId = authService.generateSessionId(user.id);
        const token = authService.generateToken({ userId: user.id, username: user.username, step: 'verified' });
        await db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

        console.log(`[Verify Login Success] Login successful for phone: ${phoneNumber}`);
        return res.status(200).json({ success: true, sessionId: newSessionId, token, user: { id: user.id, username: user.username, email: user.email, phone: user.phone }, message: messages.login.success });
      }

      console.log(`[Verify Login Failed] Missing sessionId or phoneNumber`);
      return res.status(400).json({ success: false, message: '会话ID或手机号不能为空' });
    } catch (error) {
      console.error('Verify login error:', error);
      return res.status(500).json({ success: false, message: '服务器内部错误' });
    }
  }

  // 获取首页内容
  async getHomePage(req, res) {
    try {
      res.status(200).json({
        success: true,
        content: {
          title: '欢迎使用中国铁路12306',
          features: [
            { id: 1, name: '车票预订', icon: 'train', description: '便捷的车票预订服务' },
            { id: 2, name: '行程管理', icon: 'calendar', description: '个人行程提醒和管理' },
            { id: 3, name: '积分兑换', icon: 'gift', description: '积分兑换车票和礼品' },
            { id: 4, name: '餐饮特产', icon: 'food', description: '列车餐饮和特产预订' }
          ],
          announcements: []
        }
      });
    } catch (error) {
      console.error('Get homepage error:', error);
      res.status(500).json({ 
        success: false, 
        message: '服务器内部错误' 
      });
    }
  }

  // 忘记密码页面
  async getForgotPassword(req, res) {
    try {
      res.status(200).json({
        success: true,
        content: {
          title: '忘记密码',
          instructions: [
            '请输入您注册时使用的手机号或邮箱',
            '我们将发送验证码到您的手机或邮箱',
            '验证成功后可以重置密码'
          ],
          contactInfo: {
            phone: '12306',
            email: 'service@12306.cn'
          }
        }
      });
    } catch (error) {
      console.error('Get forgot password error:', error);
      res.status(500).json({ 
        success: false, 
        message: '服务器内部错误' 
      });
    }
  }

  async getPublicKey(req, res) {
    try {
      const publicKey = crypto.getPublicKey();
      res.status(200).json({ success: true, publicKey });
    } catch (error) {
      console.error('Get public key error:', error);
      res.status(500).json({ success: false, message: '服务器内部错误' });
    }
  }

  async getCsrfToken(req, res) {
    try {
      const { v4: uuidv4 } = require('uuid');
      const token = uuidv4();
      res.cookie('XSRF-TOKEN', token, {
        httpOnly: false,
        sameSite: 'lax',
        secure: false
      });
      return res.status(200).json({ success: true, token });
    } catch (error) {
      return res.status(500).json({ success: false, message: '服务器内部错误' });
    }
  }

  async refreshToken(req, res) {
    try {
      const { token } = req.body;
      const newToken = authService.refreshToken(token);
      if (!newToken) {
        return res.status(401).json({ success: false, error: '令牌无效或已过期' });
      }
      return res.status(200).json({ success: true, token: newToken });
    } catch (error) {
      return res.status(500).json({ success: false, message: '服务器内部错误' });
    }
  }
}

module.exports = new AuthController();
