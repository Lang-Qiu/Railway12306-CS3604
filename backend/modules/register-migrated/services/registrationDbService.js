const dbService = require('../../../src/domain-providers/dbService')
const bcrypt = require('bcryptjs')

class RegistrationDbService {
  constructor() {
    this.db = null
  }

  async init() {
    if (!this.db) {
      await dbService.init()
      this.db = dbService.getDb()
    }
  }

  async findUserByUsername(username) {
    await this.init()
    const stmt = this.db.prepare('SELECT * FROM users WHERE username = ?')
    stmt.bind([username])
    const user = stmt.step() ? stmt.getAsObject() : null
    stmt.free()
    return user || null
  }

  async findUserByIdCardNumber(idCardType, idCardNumber) {
    await this.init()
    const stmt = this.db.prepare('SELECT * FROM users WHERE id_card = ?')
    stmt.bind([idCardNumber])
    const user = stmt.step() ? stmt.getAsObject() : null
    stmt.free()
    return user || null
  }

  async findUserByPhone(phone) {
    await this.init()
    const stmt = this.db.prepare('SELECT * FROM users WHERE phone = ?')
    stmt.bind([phone])
    const user = stmt.step() ? stmt.getAsObject() : null
    stmt.free()
    return user || null
  }

  async findUserByEmail(email) {
    await this.init()
    if (!email) return null
    const stmt = this.db.prepare('SELECT * FROM users WHERE email = ?')
    stmt.bind([email])
    const user = stmt.step() ? stmt.getAsObject() : null
    stmt.free()
    return user || null
  }

  async createUser(userData) {
    await this.init()
    try {
      const hashedPassword = await bcrypt.hash(userData.password, 10)

      this.db.run(
        `INSERT INTO users (
          username, email, phone, password_hash, real_name, id_card
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          userData.username,
          userData.email || null,
          userData.phone,
          hashedPassword,
          userData.name,
          userData.idCardNumber || userData.id_card_number,
        ]
      )

      const stmt = this.db.prepare('SELECT last_insert_rowid() as lastID')
      stmt.step()
      const row = stmt.getAsObject()
      stmt.free()
      return row.lastID
    } catch (error) {
      if (error.message && error.message.includes('UNIQUE constraint failed')) {
        if (error.message.includes('users.username')) throw new Error('该用户名已被注册')
        if (error.message.includes('users.phone')) throw new Error('该手机号已被注册')
        if (error.message.includes('users.email')) throw new Error('该邮箱已被注册')
        if (error.message.includes('users.id_card')) throw new Error('该证件号已被注册')
        throw new Error('该账号信息已被注册')
      }
      throw error
    }
  }

  async createEmailVerificationCode(email) {
    await this.init()
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000)
    this.db.run(
      `INSERT INTO email_verification_codes (email, code, created_at, expires_at, sent_status, sent_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [email, code, now.toISOString(), expiresAt.toISOString(), 'sent', now.toISOString()]
    )
    return { email, code, created_at: now.toISOString(), expires_at: expiresAt.toISOString(), sent_status: 'sent', sent_at: now.toISOString() }
  }

  async verifyEmailCode(email, code) {
    await this.init()
    const stmt = this.db.prepare(
      `SELECT * FROM email_verification_codes WHERE email = ? AND code = ? AND used = 0 ORDER BY created_at DESC LIMIT 1`
    )
    stmt.bind([email, code])
    const record = stmt.step() ? stmt.getAsObject() : null
    stmt.free()
    if (!record) return false
    const now = new Date()
    const expiresAt = new Date(record.expires_at)
    if (now > expiresAt) return false
    this.db.run('UPDATE email_verification_codes SET used = 1 WHERE id = ?', [record.id])
    return true
  }

  async createSmsVerificationCode(phone) {
    await this.init()
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000)
    this.db.run(
      `INSERT INTO verification_codes (phone, code, created_at, expires_at, sent_status, sent_at) VALUES (?, ?, ?, ?, 'sent', ?)`,
      [phone, code, now.toISOString(), expiresAt.toISOString(), now.toISOString()]
    )
    return code
  }

  async verifySmsCode(phone, code) {
    await this.init()
    const stmt = this.db.prepare(
      `SELECT * FROM verification_codes WHERE phone = ? AND used = 0 ORDER BY created_at DESC LIMIT 1`
    )
    stmt.bind([phone])
    const validCode = stmt.step() ? stmt.getAsObject() : null
    stmt.free()
    if (!validCode) return { success: false, error: '验证码校验失败！' }
    if (validCode.code !== code) return { success: false, error: '很抱歉，您输入的短信验证码有误。' }
    const now = new Date()
    const expiresAt = new Date(validCode.expires_at)
    if (now > expiresAt) return { success: false, error: '很抱歉，您输入的短信验证码有误。' }
    this.db.run('UPDATE verification_codes SET used = 1 WHERE id = ?', [validCode.id])
    return { success: true }
  }
}

module.exports = new RegistrationDbService()