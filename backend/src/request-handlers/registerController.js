/**
 * 注册控制器
 * 文件：backend/src/controllers/registerController.js
 * 
 * 处理所有注册相关的业务逻辑
 */

const jsonDbService = require('../domain-providers/jsonDbService');
const messages = require('../message-catalog/messages');
const { v4: uuidv4 } = require('uuid');

class RegisterController {
  /**
   * 标识符可用性评估：用户名
   */
  async validateUsername(req, res) {
    try {
      console.log('[Register] validateUsername called')
      const { username } = req.body;
      if (!username || username.length < 6) return res.status(400).json({ valid: false, error: '用户名长度不能少于6个字符！' });
      if (username.length > 30) return res.status(400).json({ valid: false, error: '用户名长度不能超过30个字符！' });
      if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(username)) return res.status(400).json({ valid: false, error: '用户名只能由字母、数字和_组成，须以字母开头！' });
      const existingUser = await jsonDbService.findUserBy(username, 'username');
      if (existingUser) return res.status(409).json({ valid: false, error: '该用户名已经占用，请重新选择用户名！' });
      return res.status(200).json({ valid: true, message: '用户名可用' });
    } catch (error) {
      console.error('Validate username error:', error);
      return res.status(500).json({ valid: false, error: messages.common.serverError });
    }
  }

  /**
   * 凭据复杂度评估：密码
   */
  async validatePassword(req, res) {
    try {
      const { password } = req.body;
      if (!password || password.length < 6) return res.status(400).json({ valid: false, error: '密码长度不能少于6个字符！' });
      if (!/^[a-zA-Z0-9_]+$/.test(password)) return res.status(400).json({ valid: false, error: '格式错误，必须且只能包含字母、数字和下划线中的两种或两种以上！' });
      const typeCount = Number(/[a-zA-Z]/.test(password)) + Number(/[0-9]/.test(password)) + Number(/_/.test(password));
      if (typeCount < 2) return res.status(400).json({ valid: false, error: '格式错误，必须且只能包含字母、数字和下划线中的两种或两种以上！' });
      return res.status(200).json({ valid: true, message: '密码格式正确' });
    } catch (error) {
      console.error('Validate password error:', error);
      return res.status(500).json({ valid: false, error: messages.common.serverError });
    }
  }

  /**
   * 实名表达式检查：姓名
   */
  async validateName(req, res) {
    try {
      const { name } = req.body;
      if (!name) return res.status(400).json({ valid: false, error: '请输入姓名！' });
      const charLength = name.split('').reduce((len, ch) => len + (/^[\u4e00-\u9fa5]$/.test(ch) ? 2 : 1), 0);
      if (charLength < 3 || charLength > 30) return res.status(400).json({ valid: false, error: '允许输入的字符串在3-30个字符之间！' });
      if (!/^[\u4e00-\u9fa5a-zA-Z.\s]+$/.test(name)) return res.status(400).json({ valid: false, error: '请输入姓名！' });
      return res.status(200).json({ valid: true, message: '姓名格式正确' });
    } catch (error) {
      console.error('Validate name error:', error);
      return res.status(500).json({ valid: false, error: messages.common.serverError });
    }
  }

  /**
   * 身份载体校验：证件号码
   */
  async validateIdCard(req, res) {
    try {
      const { idCardNumber } = req.body;
      if (idCardNumber && !/^[a-zA-Z0-9]+$/.test(idCardNumber)) return res.status(400).json({ valid: false, error: '输入的证件编号中包含中文信息或特殊字符！' });
      if (!idCardNumber || idCardNumber.length !== 18) return res.status(400).json({ valid: false, error: '请正确输入18位证件号码！' });
      return res.status(200).json({ valid: true, message: '证件号码格式正确' });
    } catch (error) {
      console.error('Validate ID card error:', error);
      return res.status(500).json({ valid: false, error: messages.common.serverError });
    }
  }

  /**
   * 联系渠道核验：邮箱
   */
  async validateEmail(req, res) {
    try {
      const { email } = req.body;
      if (!email) return res.status(200).json({ valid: true, message: '邮箱格式正确' });
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ valid: false, error: '请输入有效的电子邮件地址！' });
      return res.status(200).json({ valid: true, message: '邮箱格式正确' });
    } catch (error) {
      console.error('Validate email error:', error);
      return res.status(500).json({ valid: false, error: messages.common.serverError });
    }
  }

  /**
   * 短信通道核验：手机号
   */
  async validatePhone(req, res) {
    try {
      const { phone } = req.body;
      if (!phone || phone.length !== 11) return res.status(400).json({ valid: false, error: '您输入的手机号码不是有效的格式！' });
      if (!/^[0-9]+$/.test(phone)) return res.status(400).json({ valid: false, error: '您输入的手机号码不是有效的格式！' });
      return res.status(200).json({ valid: true, message: '手机号码格式正确' });
    } catch (error) {
      console.error('Validate phone error:', error);
      return res.status(500).json({ valid: false, error: '服务器错误' });
    }
  }

  /**
   * 资料采集与会话封装：注册
   */
  async register(req, res) {
    try {
      console.log('[Register] register called')
      const { username, password, confirmPassword, idCardType, name, idCardNumber, discountType, email, phone, agreedToTerms } = req.body;
      if (!username || !password || !confirmPassword || !idCardType || !name || !idCardNumber || !discountType || !phone) return res.status(400).json({ error: messages.register.fillAll });
      if (password !== confirmPassword) return res.status(400).json({ error: messages.register.passwordMismatch });
      if (!agreedToTerms) return res.status(400).json({ error: messages.register.termsRequired });
      if (await jsonDbService.findUserBy(username, 'username')) return res.status(409).json({ error: '该用户名已经占用，请重新选择用户名！' });
      if (await jsonDbService.findUserByIdCard(idCardType, idCardNumber)) return res.status(409).json({ error: '该证件号码已经被注册过，请确认是否您本人注册，"是"请使用原账号登录，"不是"请通过铁路12306App办理抢注或持该证件到就近的办理客运业务的铁路车站办理被抢注处理，完成后即可继续注册，或致电12306客服咨询。' });
      if (await jsonDbService.findUserBy(phone, 'phone')) return res.status(409).json({ error: '您输入的手机号码已被其他注册用户使用，请确认是否本人注册。如果此手机号是本人注册，您可使用此手机号进行登录，或返回登录页点击忘记密码进行重置密码;如果手机号不是您注册的，您可更换手机号码或致电12306客服协助处理。' });
      if (email) {
        if (await jsonDbService.findUserBy(email, 'email')) return res.status(409).json({ error: '您输入的邮箱已被其他注册用户使用，请确认是否本人注册。如果此邮箱是本人注册，您可使用此邮箱进行登录，或返回登录页点击忘记密码进行重置密码;如果邮箱不是您注册的，您可更换邮箱或致电12306客服协助处理。' });
      }
      const sessionId = uuidv4();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      await jsonDbService.createSession(sessionId, { user_data: { username, password, idCardType, name, idCardNumber, discountType, email, phone } }, expiresAt);
      return res.status(201).json({ message: '注册信息已提交，请进行验证', sessionId });
    } catch (error) {
      console.error('Register error:', error);
      return res.status(500).json({ error: '服务器错误' });
    }
  }

  /**
   * 多通道一次性码下发：注册
   */
  async sendRegistrationVerificationCode(req, res) {
    try {
      console.log('[Register] sendRegistrationVerificationCode called')
      const { sessionId, phone: reqPhone, email: reqEmail } = req.body;
      const session = await jsonDbService.getSession(sessionId);
      if (!session) return res.status(400).json({ error: messages.session.invalid });
      const sessionData = session.user_data;
      const phone = reqPhone || sessionData.phone;
      const email = reqEmail || sessionData.email;
      if (email) {
        const canSendEmail = await jsonDbService.tryRateLimit(`email_send:${email}`, 60);
        if (!canSendEmail) return res.status(429).json({ error: messages.sms.tooFrequent });
      }
      if (phone) {
        const canSendSms = await jsonDbService.tryRateLimit(`sms_send:${phone}`, 60);
        if (!canSendSms) return res.status(429).json({ error: messages.sms.tooFrequent });
      }
      let emailCode = null;
      if (email) {
        emailCode = Math.floor(100000 + Math.random() * 900000).toString();
        await jsonDbService.createVerificationCode(`email_code:register:${email}`, emailCode, 300);
      }
      let smsCode = null;
      if (phone) {
        smsCode = Math.floor(100000 + Math.random() * 900000).toString();
        await jsonDbService.createVerificationCode(`sms_code:register:${phone}`, smsCode, 300);
        console.log(`\n=================================`);
        console.log(`📱 注册验证码已生成`);
        console.log(`手机号: ${phone}`);
        console.log(`验证码: ${smsCode}`);
        console.log(`有效期: 5分钟`);
        console.log(`=================================\n`);
      }
      return res.status(200).json({ message: '验证码发送成功', verificationCode: smsCode });
    } catch (error) {
      console.error('Send verification code error:', error);
      return res.status(500).json({ error: '服务器错误' });
    }
  }

  /**
   * 校验完成与资源入库：完成注册
   */
  async completeRegistration(req, res) {
    try {
      console.log('[Register] completeRegistration called')
      const { sessionId, smsCode, emailCode } = req.body;
      const session = await jsonDbService.getSession(sessionId);
      if (!session) return res.status(400).json({ error: messages.session.invalid });
      const userData = session.user_data;
      if (smsCode) {
        const stored = await jsonDbService.getVerificationCode(`sms_code:register:${userData.phone}`);
        if (stored !== smsCode) return res.status(400).json({ error: '验证码错误或已过期' });
      }
      if (emailCode) {
        const storedEmail = await jsonDbService.getVerificationCode(`email_code:register:${userData.email}`);
        if (storedEmail !== emailCode) return res.status(400).json({ error: '验证码错误或已过期' });
      }
      try {
        const userId = await jsonDbService.createUser(userData);
        await jsonDbService.deleteSession(sessionId);
        return res.status(201).json({ message: '恭喜您注册成功，请到登录页面进行登录！', userId });
      } catch (error) {
        if (error.message && (error.message.includes('已被注册') || error.message === 'User already exists')) {
          return res.status(409).json({ error: error.message });
        }
        throw error;
      }
    } catch (error) {
      console.error('Complete registration error:', error);
      return res.status(500).json({ error: '注册失败，请稍后重试' });
    }
  }

  /**
   * 获取服务条款
   */
  async getServiceTerms(req, res) {
    try {
      res.status(200).json({
        title: '服务条款',
        content: '中国铁路客户服务中心网站服务条款内容...'
      });
    } catch (error) {
      console.error('Get service terms error:', error);
      res.status(500).json({
        error: messages.common.serverError
      });
    }
  }

  /**
   * 获取隐私政策
   */
  async getPrivacyPolicy(req, res) {
    try {
      res.status(200).json({
        title: '隐私权政策',
        englishTitle: 'NOTICE',
        content: '隐私权政策内容...'
      });
    } catch (error) {
      console.error('Get privacy policy error:', error);
      res.status(500).json({
        error: messages.common.serverError
      });
    }
  }
}

module.exports = new RegisterController();
