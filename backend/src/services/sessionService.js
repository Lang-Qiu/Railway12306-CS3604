/**
 * Session Service
 * Manages user registration sessions
 */

const dbService = require('./dbService');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class SessionService {
  /**
   * Create session
   * Supports two calling methods:
   * 1. createSession(userData) - Auto-generate sessionId and expiration (for registration)
   * 2. createSession(sessionId, userData, expiresAt) - Use specified sessionId and expiration (for login)
   */
  async createSession(sessionIdOrUserData, userData, expiresAt) {
    try {
      let sessionId, sessionData, expireTime;
      
      // Determine calling method
      if (typeof sessionIdOrUserData === 'string') {
        // Method 2: createSession(sessionId, userData, expiresAt)
        sessionId = sessionIdOrUserData;
        sessionData = userData;
        expireTime = expiresAt || new Date(Date.now() + 30 * 60 * 1000);
      } else {
        // Method 1: createSession(userData)
        sessionId = uuidv4();
        sessionData = sessionIdOrUserData;
        expireTime = new Date(Date.now() + 30 * 60 * 1000); // Expires in 30 minutes
      }
      
      await dbService.run(
        `INSERT OR REPLACE INTO sessions (session_id, user_data, expires_at) VALUES (?, ?, ?)`,
        [sessionId, JSON.stringify(sessionData), expireTime.toISOString()]
      );
      
      return sessionId;
    } catch (error) {
      logger.error('Error creating session', { error });
      throw error;
    }
  }

  /**
   * Get session data
   */
  async getSession(sessionId) {
    try {
      if (!sessionId) {
        return null;
      }

      const session = await dbService.get(
        `SELECT * FROM sessions WHERE session_id = ? AND expires_at > datetime('now')`,
        [sessionId]
      );

      if (!session) {
        return null;
      }

      return {
        ...session,
        user_data: JSON.parse(session.user_data)
      };
    } catch (error) {
      logger.error('Error getting session', { error });
      return null;
    }
  }

  /**
   * Delete session
   */
  async deleteSession(sessionId) {
    try {
      await dbService.run(
        `DELETE FROM sessions WHERE session_id = ?`,
        [sessionId]
      );
    } catch (error) {
      logger.error('Error deleting session', { error });
      throw error;
    }
  }

  /**
   * Check email verification code send frequency
   */
  async checkEmailSendFrequency(email) {
    try {
      // Check if sent within the last 1 minute
      const recentCode = await dbService.get(
        `SELECT * FROM email_verification_codes 
         WHERE email = ? 
         AND datetime(sent_at) > datetime('now', '-1 minute')
         ORDER BY sent_at DESC LIMIT 1`,
        [email]
      );

      return !recentCode; // Return true if no recent record (can send)
    } catch (error) {
      logger.error('Error checking email send frequency', { error });
      return false;
    }
  }

  /**
   * Check SMS verification code send frequency
   * @param {string} phone - Phone number
   * @param {string} purpose - Verification code purpose ('login' or 'registration'), default 'login'
   */
  async checkSmsSendFrequency(phone, purpose = 'login') {
    try {
      // Check if sent within the last 1 minute (same purpose)
      const recentCode = await dbService.get(
        `SELECT * FROM verification_codes 
         WHERE phone = ? 
         AND purpose = ?
         AND datetime(sent_at) > datetime('now', '-1 minute')
         ORDER BY sent_at DESC LIMIT 1`,
        [phone, purpose]
      );

      return !recentCode; // Return true if no recent record (can send)
    } catch (error) {
      logger.error('Error checking sms send frequency', { error });
      return false;
    }
  }
}

module.exports = new SessionService();

