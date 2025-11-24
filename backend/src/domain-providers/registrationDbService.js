/**
 * 注册相关数据库服务
 * 源文件：backend/src/services/registrationDbService.js
 * 测试文件：backend/test/services/registrationDbService.test.js
 */

const dbService = require('./dbService');
const bcrypt = require('bcryptjs');

class RegistrationDbService {
  constructor() {
    this.db = null;
  }

  async init() {
    if (!this.db) {
      await dbService.init();
      this.db = dbService.getDb();
    }
  }
  /**
   * DB-FindUserByUsername - 根据用户名查找用户信息
   */
  async findUserByUsername(username) {
    try {
      await this.init();
      const stmt = this.db.prepare('SELECT * FROM users WHERE username = ?');
      stmt.bind([username]);
      const user = stmt.step() ? stmt.getAsObject() : null;
      stmt.free();
      return user || null;
    } catch (error) {
      console.error('Error finding user by username:', error);
      throw error;
    }
  }

  /**
   * DB-FindUserByIdCardNumber - 根据证件类型和证件号码查找用户信息
   */
  async findUserByIdCardNumber(idCardType, idCardNumber) {
    try {
      await this.init();
      const stmt = this.db.prepare('SELECT * FROM users WHERE id_card_type = ? AND id_card_number = ?');
      stmt.bind([idCardType, idCardNumber]);
      const user = stmt.step() ? stmt.getAsObject() : null;
      stmt.free();
      return user || null;
    } catch (error) {
      console.error('Error finding user by ID card:', error);
      throw error;
    }
  }

  /**
   * DB-FindUserByPhone - 根据手机号查找用户
   */
  async findUserByPhone(phone) {
    try {
      await this.init();
      const stmt = this.db.prepare('SELECT * FROM users WHERE phone = ?');
      stmt.bind([phone]);
      const user = stmt.step() ? stmt.getAsObject() : null;
      stmt.free();
      return user || null;
    } catch (error) {
      console.error('Error finding user by phone:', error);
      throw error;
    }
  }

  /**
   * DB-FindUserByEmail - 根据邮箱查找用户
   */
  async findUserByEmail(email) {
    try {
      await this.init();
      if (!email) {
        return null;
      }
      const stmt = this.db.prepare('SELECT * FROM users WHERE email = ?');
      stmt.bind([email]);
      const user = stmt.step() ? stmt.getAsObject() : null;
      stmt.free();
      return user || null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }



  /**
   * DB-CreateUser - 在数据库中创建新用户记录
   */
  async createUser(userData) {
    try {
      await this.init();
      console.log('🚀 [createUser] 开始创建用户，接收到数据:', userData);

      // 1. 加密密码
      const saltRounds = 10;
      console.log('🔒 [createUser] 准备加密密码...');
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
      console.log('✅ [createUser] 密码加密完成。');

      // 2. 准备插入用户记录
      const insertData = [
        userData.username,
        hashedPassword,
        userData.name,
        userData.email || null,
        userData.phone || null,
        userData.id_card_type || null,
        userData.id_card_number || null,
        userData.discount_type || null
      ];
      console.log('📝 [createUser] 准备插入数据库，数据:', insertData);

      // 插入用户记录
      this.db.run(
        `INSERT INTO users (
          username, password, name, email, phone, 
          id_card_type, id_card_number, discount_type, 
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        insertData
      );
      console.log('✅ [createUser] 用户记录插入成功。');

      // 3. 返回用户ID
      console.log('🆔 [createUser] 准备获取新用户的ID...');
      const stmt = this.db.prepare('SELECT last_insert_rowid() as lastID');
      stmt.step();
      const row = stmt.getAsObject();
      stmt.free();
      console.log('✅ [createUser] 成功获取新用户ID:', row.lastID);
      return row.lastID;
    } catch (error) {
      console.error('❌ [createUser] 创建用户时发生错误:', error);
      // 检查唯一性约束错误
      if (error.message && error.message.includes('UNIQUE constraint failed')) {
        // 检查是哪个字段冲突
        if (error.message.includes('users.username')) {
          throw new Error('该用户名已被注册');
        } else if (error.message.includes('users.phone')) {
          throw new Error('该手机号已被注册');
        } else if (error.message.includes('users.email')) {
          throw new Error('该邮箱已被注册');
        } else if (error.message.includes('users.id_card_number')) {
          throw new Error('该证件号已被注册');
        } else {
          throw new Error('该账号信息已被注册');
        }
      }
      throw error;
    }
  }

  /**
   * DB-CreateEmailVerificationCode - 创建并存储邮箱验证码记录
   */
  async createEmailVerificationCode(email) {
    try {
      await this.init();
      // 1. 生成6位数字验证码
      const code = Math.floor(100000 + Math.random() * 900000).toString();

      // 2. 计算过期时间（10分钟）
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);

      // 3. 存储到数据库
      this.db.run(
        `INSERT INTO email_verification_codes (
          email, code, created_at, expires_at, sent_status, sent_at
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          email,
          code,
          now.toISOString(),
          expiresAt.toISOString(),
          'sent',
          now.toISOString()
        ]
      );

      return {
        email: email,
        code: code,
        created_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        sent_status: 'sent',
        sent_at: now.toISOString()
      };
    } catch (error) {
      console.error('Error creating email verification code:', error);
      throw error;
    }
  }

  /**
   * DB-VerifyEmailCode - 验证邮箱验证码是否正确且未过期
   */
  async verifyEmailCode(email, code) {
    try {
      await this.init();
      // 1. 查找验证码记录（未使用的最新记录）
      const stmt = this.db.prepare(`SELECT * FROM email_verification_codes 
         WHERE email = ? AND code = ? AND used = 0
         ORDER BY created_at DESC LIMIT 1`);
      stmt.bind([email, code]);
      const record = stmt.step() ? stmt.getAsObject() : null;
      stmt.free();

      if (!record) {
        return false;
      }

      // 2. 检查是否过期
      const now = new Date();
      const expiresAt = new Date(record.expires_at);
      if (now > expiresAt) {
        return false;
      }

      // 3. 标记为已使用
      this.db.run(
        'UPDATE email_verification_codes SET used = 1 WHERE id = ?',
        [record.id]
      );

      return true;
    } catch (error) {
      console.error('Error verifying email code:', error);
      throw error;
    }
  }

  /**
   * 创建短信验证码
   */
  async createSmsVerificationCode(phone) {
    try {
      await this.init();
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5分钟后过期

      this.db.run(
        `INSERT INTO verification_codes (phone, code, created_at, expires_at, sent_status, sent_at) 
         VALUES (?, ?, ?, ?, 'sent', ?)`,
        [phone, code, now.toISOString(), expiresAt.toISOString(), now.toISOString()]
      );

      return code;
    } catch (error) {
      console.error('Error creating sms verification code:', error);
      throw error;
    }
  }

  /**
   * 验证短信验证码
   * @returns {Object} { success: boolean, error: string }
   */
  async verifySmsCode(phone, code) {
    try {
      await this.init();
      console.log(`
🔍 验证短信验证码:`);
      console.log(`手机号: ${phone}`);
      console.log(`验证码: ${code}`);
      
      // 首先检查该手机号是否有未使用且未过期的验证码
      const now = new Date();
      const stmt = this.db.prepare(`SELECT * FROM verification_codes 
         WHERE phone = ? AND used = 0
         ORDER BY created_at DESC LIMIT 1`);
      stmt.bind([phone]);
      const validCode = stmt.step() ? stmt.getAsObject() : null;
      stmt.free();

      if (!validCode) {
        console.log('❌ 该手机号没有有效的验证码（未成功获取过验证码）');
        // 查看该手机号的所有验证码
        const stmt_all = this.db.prepare('SELECT code, created_at, expires_at, used FROM verification_codes WHERE phone = ? ORDER BY created_at DESC LIMIT 5');
        stmt_all.bind([phone]);
        const allCodes = [];
        while (stmt_all.step()) {
          allCodes.push(stmt_all.getAsObject());
        }
        stmt_all.free();
        console.log('该手机号最近的验证码记录:', allCodes);
        return { success: false, error: '验证码校验失败！' };
      }

      console.log('✅ 找到有效的验证码记录:', validCode);

      // 检查用户输入的验证码是否与有效验证码匹配
      if (validCode.code !== code) {
        console.log('❌ 验证码输入错误');
        return { success: false, error: '很抱歉，您输入的短信验证码有误。' };
      }

      // 再次检查是否过期（双重保险）
      const expiresAt = new Date(validCode.expires_at);
      console.log('当前时间:', now.toISOString());
      console.log('过期时间:', expiresAt.toISOString());
      
      if (now > expiresAt) {
        console.log('❌ 验证码已过期');
        return { success: false, error: '很抱歉，您输入的短信验证码有误。' };
      }

      // 标记为已使用
      console.log(`🔄 [verifySmsCode] 准备将 ID 为 ${validCode.id} 的验证码标记为已使用...`);
      this.db.run(
        'UPDATE verification_codes SET used = 1 WHERE id = ?',
        [validCode.id]
      );
      console.log(`✅ [verifySmsCode] 成功将 ID 为 ${validCode.id} 的验证码标记为已使用。`);

      console.log('✅ 验证码验证成功并已标记为使用');
      return { success: true };
    } catch (error) {
      console.error('Error verifying sms code:', error);
      throw error;
    }
  }
}

module.exports = new RegistrationDbService();
