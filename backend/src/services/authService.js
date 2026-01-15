const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const dbService = require('./dbService');
const sessionService = require('./sessionService');
const registrationDbService = require('./registrationDbService');
const validators = require('../utils/validators');
const logger = require('../utils/logger');

class AuthService {
  // Validate user credentials
  async validateCredentials(identifier, password) {
    try {
      // Identify identifier type
      const type = validators.identifyIdentifierType(identifier);
      
      if (type === 'invalid') {
        return { success: false, error: 'Invalid username or password' };
      }

      // Find user by type
      let user = null;
      if (type === 'username') {
        user = await registrationDbService.findUserByUsername(identifier);
      } else if (type === 'email') {
        const query = 'SELECT * FROM users WHERE email = ?';
        user = await dbService.get(query, [identifier]);
      } else if (type === 'phone') {
        const query = 'SELECT * FROM users WHERE phone = ?';
        user = await dbService.get(query, [identifier]);
      }

      if (!user) {
        return { success: false, error: 'Invalid username or password' };
      }

      // Validate password
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return { success: false, error: 'Invalid username or password' };
      }

      return { success: true, user };
    } catch (error) {
      logger.error('Validate credentials error', { error });
      throw error;
    }
  }

  // Generate Session ID
  generateSessionId(userId) {
    try {
      return uuidv4();
    } catch (error) {
      logger.error('Generate session ID error', { error });
      throw error;
    }
  }

  // Create login session
  async createLoginSession(user) {
    try {
      const sessionId = this.generateSessionId(user.id);
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      
      const sessionData = {
        userId: user.id,
        username: user.username,
        phone: user.phone,
        id_card_type: user.id_card_type,
        id_card_number: user.id_card_number,
        step: 'pending_verification' // Waiting for SMS verification
      };

      await sessionService.createSession(sessionId, sessionData, expiresAt);
      
      return sessionId;
    } catch (error) {
      logger.error('Create login session error', { error });
      throw error;
    }
  }

  // Validate last 4 digits of ID card
  async validateIdCardLast4(sessionId, idCardLast4) {
    try {
      // Get session data
      const session = await sessionService.getSession(sessionId);
      
      if (!session) {
        logger.warn('Session invalid or expired', { sessionId });
        return { success: false, error: 'Session invalid or expired' };
      }

      // session.user_data is already parsed in sessionService.getSession
      const sessionData = session.user_data;
      
      logger.debug('Session data', { 
        userId: sessionData.userId, 
        username: sessionData.username,
        phone: sessionData.phone,
        id_card_number: sessionData.id_card_number ? '***' + sessionData.id_card_number.slice(-4) : 'undefined'
      });
      
      // Validate ID card last 4 digits
      if (!sessionData.id_card_number) {
        logger.warn('No ID card information in session');
        return { success: false, error: 'Please enter valid user information!' };
      }

      const last4 = sessionData.id_card_number.slice(-4);
      logger.debug('Validating ID card last 4 digits', { 
        expected: last4, 
        provided: idCardLast4, 
        match: last4 === idCardLast4 
      });
      
      if (last4 !== idCardLast4) {
        logger.warn('ID card last 4 digits mismatch');
        return { success: false, error: 'Please enter valid user information!' };
      }

      logger.info('ID card validation passed');
      return { success: true, sessionData };
    } catch (error) {
      logger.error('Validate ID card last 4 error', { error });
      throw error;
    }
  }

  // Generate and send SMS verification code
  async generateAndSendSmsCode(sessionId, idCardLast4) {
    try {
      // Validate ID card
      const validation = await this.validateIdCardLast4(sessionId, idCardLast4);
      if (!validation.success) {
        return validation;
      }

      const { sessionData } = validation;

      // Check send frequency
      const canSend = await sessionService.checkSmsSendFrequency(sessionData.phone, 'login');
      if (!canSend) {
        return { success: false, error: 'Verification code request too frequent, please try again later!', code: 429 };
      }

      // Generate and save verification code
      const code = await registrationDbService.createSmsVerificationCode(sessionData.phone, 'login');

      // TODO: Actual SMS sending (simulated here)
      logger.info(`[SMS] Sending verification code ${code} to ${sessionData.phone}`);

      return { 
        success: true, 
        message: 'Verification code sent', 
        verificationCode: code,
        phone: sessionData.phone  // Return phone for frontend display
      };
    } catch (error) {
      logger.error('Generate and send SMS code error', { error });
      throw error;
    }
  }

  // Verify SMS code
  async verifySmsCode(sessionId, verificationCode) {
    try {
      // Get session data
      const session = await sessionService.getSession(sessionId);
      
      if (!session) {
        return { success: false, error: 'Session invalid or expired' };
      }

      // session.user_data is already parsed in sessionService.getSession
      const sessionData = session.user_data;

      // Verify SMS code
      const verifyResult = await registrationDbService.verifySmsCode(sessionData.phone, verificationCode);
      
      if (!verifyResult.success) {
        return { success: false, error: verifyResult.error };
      }

      // Update session status to verified
      sessionData.step = 'verified';
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      await sessionService.createSession(sessionId, sessionData, expiresAt);

      // Update user last login time
      const updateQuery = 'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?';
      await dbService.run(updateQuery, [sessionData.userId]);

      // Query full user info
      const user = await dbService.get('SELECT * FROM users WHERE id = ?', [sessionData.userId]);

      // Generate token
      const token = this.generateToken(sessionData);

      return { 
        success: true, 
        sessionId, 
        token,
        user: {
          id: sessionData.userId,
          username: sessionData.username,
          name: user?.name,
          email: user?.email,
          phone: user?.phone
        }
      };
    } catch (error) {
      logger.error('Verify SMS code error', { error });
      throw error;
    }
  }

  // Validate phone number
  validatePhone(phone) {
    return validators.validatePhone(phone);
  }

  // Generate JWT token (Simplified, uses sessionId)
  generateToken(user) {
    try {
      // Simplified implementation: base64 encoded user info
      const tokenData = {
        userId: user.userId,
        username: user.username,
        timestamp: Date.now()
      };
      return Buffer.from(JSON.stringify(tokenData)).toString('base64');
    } catch (error) {
      logger.error('Generate token error', { error });
      throw error;
    }
  }
}

module.exports = new AuthService();
