/**
 * Registration Database Service
 * Source file: backend/src/services/registrationDbService.js
 * Test file: backend/test/services/registrationDbService.test.js
 */

const dbService = require('./dbService');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

class RegistrationDbService {
  /**
   * DB-FindUserByUsername - Find user info by username
   */
  async findUserByUsername(username) {
    try {
      const user = await dbService.get(
        'SELECT * FROM users WHERE username = ?',
        [username]
      );
      return user || null;
    } catch (error) {
      logger.error('Error finding user by username', { error });
      throw error;
    }
  }

  /**
   * DB-FindUserByIdCardNumber - Find user info by ID card type and number
   */
  async findUserByIdCardNumber(idCardType, idCardNumber) {
    try {
      const user = await dbService.get(
        'SELECT * FROM users WHERE id_card_type = ? AND id_card_number = ?',
        [idCardType, idCardNumber]
      );
      return user || null;
    } catch (error) {
      logger.error('Error finding user by ID card', { error });
      throw error;
    }
  }

  /**
   * DB-FindUserByPhone - Find user by phone number
   */
  async findUserByPhone(phone) {
    try {
      const user = await dbService.get(
        'SELECT * FROM users WHERE phone = ?',
        [phone]
      );
      return user || null;
    } catch (error) {
      logger.error('Error finding user by phone', { error });
      throw error;
    }
  }

  /**
   * DB-FindUserByEmail - Find user by email
   */
  async findUserByEmail(email) {
    try {
      if (!email) {
        return null;
      }
      const user = await dbService.get(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );
      return user || null;
    } catch (error) {
      logger.error('Error finding user by email', { error });
      throw error;
    }
  }

  /**
   * DB-CreateUser - Create new user record in database
   */
  async createUser(userData) {
    try {
      // 1. Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

      // 2. Insert user record
      const result = await dbService.run(
        `INSERT INTO users (
          username, password, name, email, phone, 
          id_card_type, id_card_number, discount_type, 
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [
          userData.username,
          hashedPassword,
          userData.name,
          userData.email || null,
          userData.phone,
          userData.idCardType || userData.id_card_type,
          userData.idCardNumber || userData.id_card_number,
          userData.discountType || userData.discount_type
        ]
      );

      // 3. Return user ID
      return result.lastID;
    } catch (error) {
      logger.error('Error creating user', { error });
      // Check for uniqueness constraint error
      if (error.message && error.message.includes('UNIQUE constraint failed')) {
        // Check which field conflicted
        if (error.message.includes('users.username')) {
          throw new Error('Username already registered');
        } else if (error.message.includes('users.phone')) {
          throw new Error('Phone number already registered');
        } else if (error.message.includes('users.email')) {
          throw new Error('Email already registered');
        } else if (error.message.includes('users.id_card_number')) {
          throw new Error('ID card number already registered');
        } else {
          throw new Error('Account information already registered');
        }
      }
      throw error;
    }
  }

  /**
   * DB-CreateEmailVerificationCode - Create and store email verification code record
   */
  async createEmailVerificationCode(email) {
    try {
      // 1. Generate 6-digit verification code
      const code = Math.floor(100000 + Math.random() * 900000).toString();

      // 2. Calculate expiration time (10 minutes)
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);

      // 3. Store in database
      await dbService.run(
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
      logger.error('Error creating email verification code', { error });
      throw error;
    }
  }

  /**
   * DB-VerifyEmailCode - Verify if email verification code is correct and not expired
   */
  async verifyEmailCode(email, code) {
    try {
      // 1. Find verification code record (unused latest record)
      const record = await dbService.get(
        `SELECT * FROM email_verification_codes 
         WHERE email = ? AND code = ? AND used = 0
         ORDER BY created_at DESC LIMIT 1`,
        [email, code]
      );

      if (!record) {
        return false;
      }

      // 2. Check if expired
      const now = new Date();
      const expiresAt = new Date(record.expires_at);
      if (now > expiresAt) {
        return false;
      }

      // 3. Mark as used
      await dbService.run(
        'UPDATE email_verification_codes SET used = 1 WHERE id = ?',
        [record.id]
      );

      return true;
    } catch (error) {
      logger.error('Error verifying email code', { error });
      throw error;
    }
  }

  /**
   * Create SMS verification code
   * @param {string} phone - Phone number
   * @param {string} purpose - Purpose ('login', 'registration' or 'password-reset'), default 'login'
   * @param {number} expirationMinutes - Expiration time (minutes), if not provided determined by purpose
   */
  async createSmsVerificationCode(phone, purpose = 'login', expirationMinutes = null) {
    try {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const now = new Date();
      
      // Set default expiration time based on purpose
      let expirationTime;
      if (expirationMinutes !== null) {
        expirationTime = expirationMinutes * 60 * 1000;
      } else if (purpose === 'password-reset') {
        expirationTime = 2 * 60 * 1000; // Password reset: 2 minutes (120 seconds)
      } else {
        expirationTime = 5 * 60 * 1000; // Others: 5 minutes
      }
      
      const expiresAt = new Date(now.getTime() + expirationTime);

      await dbService.run(
        `INSERT INTO verification_codes (phone, code, created_at, expires_at, sent_status, sent_at, purpose) 
         VALUES (?, ?, ?, ?, 'sent', ?, ?)`,
        [phone, code, now.toISOString(), expiresAt.toISOString(), now.toISOString(), purpose]
      );

      return code;
    } catch (error) {
      logger.error('Error creating sms verification code', { error });
      throw error;
    }
  }

  /**
   * Verify SMS verification code
   * @returns {Object} { success: boolean, error: string }
   */
  async verifySmsCode(phone, code) {
    try {
      logger.info('Verifying SMS verification code', { phone, code });
      
      // First check if there is an unused and unexpired verification code for this phone number
      const now = new Date();
      const validCode = await dbService.get(
        `SELECT * FROM verification_codes 
         WHERE phone = ? AND used = 0 AND datetime(expires_at) > datetime('now')
         ORDER BY created_at DESC LIMIT 1`,
        [phone]
      );

      if (!validCode) {
        logger.warn('No valid verification code for this phone number (never requested or all expired)');
        // View all codes for this phone number
        const allCodes = await dbService.all(
          'SELECT code, created_at, expires_at, used FROM verification_codes WHERE phone = ? ORDER BY created_at DESC LIMIT 5',
          [phone]
        );
        logger.debug('Recent verification codes for this phone', { allCodes });
        return { success: false, error: 'Verification code validation failed!' };
      }

      logger.debug('Found valid verification code record', { code: validCode.code, created_at: validCode.created_at, expires_at: validCode.expires_at });

      // Check if user input matches valid code
      if (validCode.code !== code) {
        logger.warn('Verification code mismatch');
        return { success: false, error: 'Sorry, the SMS verification code you entered is incorrect.' };
      }

      // Check expiration again (double insurance)
      const expiresAt = new Date(validCode.expires_at);
      
      if (now > expiresAt) {
        logger.warn('Verification code expired');
        return { success: false, error: 'Sorry, the SMS verification code you entered is incorrect.' };
      }

      // Mark as used
      await dbService.run(
        'UPDATE verification_codes SET used = 1 WHERE id = ?',
        [validCode.id]
      );

      logger.info('Verification code validated successfully and marked as used');
      return { success: true };
    } catch (error) {
      logger.error('Error verifying sms code', { error });
      throw error;
    }
  }
}

module.exports = new RegistrationDbService();

