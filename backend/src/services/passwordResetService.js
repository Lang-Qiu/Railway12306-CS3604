/**
 * Password Reset Service
 * Source file: backend/src/services/passwordResetService.js
 */

const dbService = require('./dbService');
const registrationDbService = require('./registrationDbService');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const logger = require('../utils/logger');

class PasswordResetService {
  constructor() {
    // Store password reset sessions
    this.resetSessions = new Map();
    // Store reset tokens
    this.resetTokens = new Map();
  }

  /**
   * Verify account info (phone + ID card type + ID card number)
   * @param {string} phone - Phone number
   * @param {string} idCardType - ID card type
   * @param {string} idCardNumber - ID card number
   * @returns {Object} { success: boolean, sessionId: string, error: string }
   */
  async verifyAccountInfo(phone, idCardType, idCardNumber) {
    try {
      logger.info('Verifying account info', { phone, idCardType, idCardNumber });

      // Find user
      const user = await dbService.get(
        'SELECT * FROM users WHERE phone = ? AND id_card_type = ? AND id_card_number = ?',
        [phone, idCardType, idCardNumber]
      );

      if (!user) {
        logger.warn('Account info mismatch');
        return {
          success: false,
          error: 'The phone number or ID number you entered is incorrect, please try again.'
        };
      }

      // Generate Session ID
      const sessionId = crypto.randomBytes(32).toString('hex');
      
      // Store session info
      this.resetSessions.set(sessionId, {
        userId: user.id,
        phone: user.phone,
        username: user.username,
        createdAt: Date.now(),
        verified: false
      });

      logger.info('Account verification successful, generated sessionId', { sessionId });

      return {
        success: true,
        sessionId,
        phone: user.phone
      };
    } catch (error) {
      logger.error('Failed to verify account info', { error });
      throw error;
    }
  }

  /**
   * Send password reset verification code
   * @param {string} sessionId - Session ID
   * @returns {Object} { success: boolean, verificationCode: string, phone: string, error: string }
   */
  async sendResetCode(sessionId) {
    try {
      logger.info('Sending password reset verification code', { sessionId });

      // Verify session
      const session = this.resetSessions.get(sessionId);
      if (!session) {
        logger.warn('Invalid session ID');
        return {
          success: false,
          error: 'Session expired, please start over'
        };
      }

      // Check if session expired (30 minutes)
      if (Date.now() - session.createdAt > 30 * 60 * 1000) {
        this.resetSessions.delete(sessionId);
        logger.warn('Session expired');
        return {
          success: false,
          error: 'Session expired, please start over'
        };
      }

      // Generate verification code (valid for 120 seconds)
      const code = await registrationDbService.createSmsVerificationCode(
        session.phone,
        'password-reset'
      );

      logger.info('Verification code generated successfully', { code });

      return {
        success: true,
        verificationCode: code,
        phone: session.phone
      };
    } catch (error) {
      logger.error('Failed to send verification code', { error });
      throw error;
    }
  }

  /**
   * Verify reset code
   * @param {string} sessionId - Session ID
   * @param {string} code - Verification code
   * @returns {Object} { success: boolean, resetToken: string, error: string }
   */
  async verifyResetCode(sessionId, code) {
    try {
      logger.info('Verifying reset code', { sessionId });

      // Verify session
      const session = this.resetSessions.get(sessionId);
      if (!session) {
        logger.warn('Invalid session ID');
        return {
          success: false,
          error: 'Session expired, please start over'
        };
      }

      // Verify code
      const verifyResult = await registrationDbService.verifySmsCode(session.phone, code);
      
      if (!verifyResult.success) {
        logger.warn('Verification code validation failed');
        return {
          success: false,
          error: verifyResult.error
        };
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      
      // Store reset token (valid for 10 minutes)
      this.resetTokens.set(resetToken, {
        userId: session.userId,
        createdAt: Date.now()
      });

      // Mark session as verified
      session.verified = true;

      logger.info('Verification code validation successful, generated resetToken');

      return {
        success: true,
        resetToken
      };
    } catch (error) {
      logger.error('Failed to verify code', { error });
      throw error;
    }
  }

  /**
   * Reset password
   * @param {string} resetToken - Reset token
   * @param {string} newPassword - New password
   * @param {string} confirmPassword - Confirm password
   * @returns {Object} { success: boolean, error: string }
   */
  async resetPassword(resetToken, newPassword, confirmPassword) {
    try {
      logger.info('Resetting password');

      // Verify token
      const tokenData = this.resetTokens.get(resetToken);
      if (!tokenData) {
        logger.warn('Invalid reset token');
        return {
          success: false,
          error: 'Reset link expired, please start over'
        };
      }

      // Check if token expired (10 minutes)
      if (Date.now() - tokenData.createdAt > 10 * 60 * 1000) {
        this.resetTokens.delete(resetToken);
        logger.warn('Reset token expired');
        return {
          success: false,
          error: 'Reset link expired, please start over'
        };
      }

      // Verify password consistency
      if (newPassword !== confirmPassword) {
        logger.warn('Passwords do not match');
        return {
          success: false,
          error: 'Passwords do not match'
        };
      }

      // Verify password format
      if (newPassword.length < 6) {
        return {
          success: false,
          error: 'Password must be at least 6 characters long'
        };
      }

      // Verify password complexity (at least two types from letters, numbers, underscores)
      const hasLetter = /[a-zA-Z]/.test(newPassword);
      const hasNumber = /[0-9]/.test(newPassword);
      const hasUnderscore = /_/.test(newPassword);
      const typesCount = [hasLetter, hasNumber, hasUnderscore].filter(Boolean).length;

      if (typesCount < 2) {
        return {
          success: false,
          error: 'Password must contain at least two of the following: letters, numbers, underscores'
        };
      }

      // Encrypt new password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password in database
      await dbService.run(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, tokenData.userId]
      );

      // Clean up token and related sessions
      this.resetTokens.delete(resetToken);
      // Clean up all sessions for this user
      for (const [sessId, sess] of this.resetSessions.entries()) {
        if (sess.userId === tokenData.userId) {
          this.resetSessions.delete(sessId);
        }
      }

      logger.info('Password reset successful');

      return {
        success: true
      };
    } catch (error) {
      logger.error('Failed to reset password', { error });
      throw error;
    }
  }

  /**
   * Cleanup expired sessions and tokens
   */
  cleanupExpiredData() {
    const now = Date.now();
    
    // Cleanup expired sessions (30 minutes)
    for (const [sessionId, session] of this.resetSessions.entries()) {
      if (now - session.createdAt > 30 * 60 * 1000) {
        this.resetSessions.delete(sessionId);
      }
    }

    // Cleanup expired tokens (10 minutes)
    for (const [token, tokenData] of this.resetTokens.entries()) {
      if (now - tokenData.createdAt > 10 * 60 * 1000) {
        this.resetTokens.delete(token);
      }
    }
  }
}

// Create singleton
const passwordResetService = new PasswordResetService();

// Periodically cleanup expired data (every 5 minutes)
setInterval(() => {
  passwordResetService.cleanupExpiredData();
}, 5 * 60 * 1000);

module.exports = passwordResetService;

