const { validationResult } = require('express-validator');
const authService = require('../services/authService');
const logger = require('../utils/logger');

class AuthController {
  // User Login
  async login(req, res) {
    try {
      const { identifier, password } = req.body;
      
      // Validate required fields
      const errors = [];
      if (!identifier || identifier.trim() === '') {
        errors.push('Username/Email/Phone cannot be empty');
      }
      if (!password || password.trim() === '') {
        errors.push('Password cannot be empty');
      }

      if (errors.length > 0) {
        return res.status(400).json({ 
          success: false, 
          errors 
        });
      }

      // Validate password length
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'Password must be at least 6 characters long'
        });
      }

      // Validate user credentials
      const result = await authService.validateCredentials(identifier, password);
      
      if (!result.success) {
        return res.status(401).json({
          success: false,
          error: result.error
        });
      }

      // Create login session
      const sessionId = await authService.createLoginSession(result.user);
      
      // Generate temporary token (for session before SMS verification)
      const token = authService.generateToken({
        userId: result.user.id,
        username: result.user.username,
        step: 'pending_verification'
      });

      res.status(200).json({
        success: true,
        sessionId,
        token,
        message: 'Please proceed with SMS verification'
      });
    } catch (error) {
      logger.error('Login error', { error });
      res.status(500).json({ 
        success: false, 
        message: 'Internal Server Error' 
      });
    }
  }

  // Send SMS verification code (for login)
  async sendVerificationCode(req, res) {
    try {
      const { phoneNumber, sessionId, idCardLast4 } = req.body;

      logger.info('Send verification code request', { sessionId, idCardLast4, phoneNumber });

      // Validate required fields
      const errors = [];
      
      // If sessionId and idCardLast4 are provided (SMS verification popup scenario)
      if (sessionId && idCardLast4) {
        // Validate last 4 digits of ID card format
        if (!idCardLast4 || idCardLast4.length !== 4) {
          errors.push('Last 4 digits of ID card format is incorrect');
        }

        if (errors.length > 0) {
          logger.warn('Verification failed', { errors });
          return res.status(400).json({ 
            success: false, 
            error: errors.join(', ')
          });
        }

        // Generate and send verification code
        const result = await authService.generateAndSendSmsCode(sessionId, idCardLast4);
        
        // Check for rate limit error (429) first, must be before !result.success check
        if (result.code === 429) {
          logger.warn('Request too frequent', { error: result.error });
          return res.status(429).json({
            success: false,
            error: result.error
          });
        }
        
        // Check for other types of failures (400)
        if (!result.success) {
          logger.warn('Failed to generate verification code', { error: result.error });
          return res.status(400).json({
            success: false,
            error: result.error
          });
        }

        return res.status(200).json({
          success: true,
          message: result.message,
          // Return verification code and phone in dev environment, should be removed in production
          verificationCode: result.verificationCode,
          phone: result.phone
        });
      }
      
      // If only phoneNumber is provided (Direct SMS login scenario)
      if (phoneNumber) {
        // Validate phone number format
        if (!authService.validatePhone(phoneNumber)) {
          errors.push('Please enter a valid mobile number');
          return res.status(400).json({ 
            success: false, 
            errors 
          });
        }

        // Implement direct SMS login logic
        const registrationDbService = require('../services/registrationDbService');
        const sessionService = require('../services/sessionService');
        
        // Check send frequency
        const canSend = await sessionService.checkSmsSendFrequency(phoneNumber, 'login');
        if (!canSend) {
          return res.status(429).json({
            success: false,
            error: 'Verification code request too frequent, please try again later!'
          });
        }

        // Generate and save verification code
        const code = await registrationDbService.createSmsVerificationCode(phoneNumber, 'login');

        // TODO: Actual SMS sending
        logger.info(`[SMS] Sending verification code ${code} to ${phoneNumber}`);

        return res.status(200).json({
          success: true,
          message: 'Verification code sent'
        });
      }

      // Missing required parameters
      return res.status(400).json({
        success: false,
        message: 'Session ID cannot be empty'
      });
    } catch (error) {
      logger.error('Send verification code error', { error });
      res.status(500).json({ 
        success: false, 
        message: 'Internal Server Error' 
      });
    }
  }

  // Verify SMS Login
  async verifyLogin(req, res) {
    try {
      const { sessionId, verificationCode, phoneNumber, idCardLast4 } = req.body;

      // Validate required fields
      const errors = [];
      
      if (!verificationCode) {
        errors.push('Verification code cannot be empty');
      } else if (!/^\d{6}$/.test(verificationCode)) {
        errors.push('Verification code must be 6 digits');
      }

      if (errors.length > 0) {
        return res.status(400).json({ 
          success: false, 
          errors 
        });
      }

      // If sessionId exists, use account password + SMS verification flow
      if (sessionId) {
        const result = await authService.verifySmsCode(sessionId, verificationCode);
        
        if (!result.success) {
          // Distinguish between session error (400) and verification code error (401)
          // Note: Assuming error messages from service are English now, need to check logic
          // But 'Session' word check is safe if translated.
          // Original check was for '会话'. Translated error is 'Session invalid or expired'.
          const statusCode = result.error.includes('Session') ? 400 : 401;
          return res.status(statusCode).json({
            success: false,
            error: result.error
          });
        }

        return res.status(200).json({
          success: true,
          sessionId: result.sessionId,
          token: result.token,
          user: result.user,
          message: 'Login successful'
        });
      }

      // If only phoneNumber exists, use direct SMS login flow
      if (phoneNumber) {
        const registrationDbService = require('../services/registrationDbService');
        const dbService = require('../services/dbService');
        
        // Verify SMS code
        const verifyResult = await registrationDbService.verifySmsCode(phoneNumber, verificationCode);
        
        if (!verifyResult.success) {
          return res.status(401).json({
            success: false,
            error: verifyResult.error
          });
        }

        // Find user
        const query = 'SELECT * FROM users WHERE phone = ?';
        const user = await dbService.get(query, [phoneNumber]);

        if (!user) {
          return res.status(401).json({
            success: false,
            error: 'User not found'
          });
        }

        // Create session
        const newSessionId = authService.generateSessionId(user.id);
        const token = authService.generateToken({
          userId: user.id,
          username: user.username,
          step: 'verified'
        });

        // Update last login time
        await dbService.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

        return res.status(200).json({
          success: true,
          sessionId: newSessionId,
          token,
          user: {
            id: user.id,
            username: user.username,
            name: user.name,
            email: user.email,
            phone: user.phone
          },
          message: 'Login successful'
        });
      }

      // Missing required parameters
      return res.status(400).json({
        success: false,
        message: 'Session ID or phone number cannot be empty'
      });
    } catch (error) {
      logger.error('Verify login error', { error });
      res.status(500).json({ 
        success: false, 
        message: 'Internal Server Error' 
      });
    }
  }

  // Get Home Page Content
  async getHomePage(req, res) {
    try {
      res.status(200).json({
        success: true,
        content: {
          title: 'Welcome to China Railway 12306',
          features: [
            { id: 1, name: 'Ticket Booking', icon: 'train', description: 'Convenient ticket booking service' },
            { id: 2, name: 'Itinerary Management', icon: 'calendar', description: 'Personal itinerary reminder and management' },
            { id: 3, name: 'Points Redemption', icon: 'gift', description: 'Redeem tickets and gifts with points' },
            { id: 4, name: 'Catering & Specialties', icon: 'food', description: 'Train catering and specialty booking' }
          ],
          announcements: []
        }
      });
    } catch (error) {
      logger.error('Get homepage error', { error });
      res.status(500).json({ 
        success: false, 
        message: 'Internal Server Error' 
      });
    }
  }

  // Get Forgot Password Page Content
  async getForgotPassword(req, res) {
    try {
      res.status(200).json({
        success: true,
        content: {
          title: 'Forgot Password',
          instructions: [
            'Please enter the mobile number or email used during registration',
            'We will send a verification code to your mobile or email',
            'You can reset your password after successful verification'
          ],
          contactInfo: {
            phone: '12306',
            email: 'service@12306.cn'
          }
        }
      });
    } catch (error) {
      logger.error('Get forgot password error', { error });
      res.status(500).json({ 
        success: false, 
        message: 'Internal Server Error' 
      });
    }
  }
}

module.exports = new AuthController();
