/**
 * Register Controller
 * File: backend/src/controllers/registerController.js
 * 
 * Handles all registration related business logic
 */

const registrationDbService = require('../services/registrationDbService');
const sessionService = require('../services/sessionService');
const passengerService = require('../services/passengerService');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class RegisterController {
  /**
   * Validate username
   */
  async validateUsername(req, res) {
    try {
      const { username } = req.body;

      // Validate username length
      if (!username || username.length < 6) {
        return res.status(400).json({
          valid: false,
          error: 'Username must be at least 6 characters long!'
        });
      }

      if (username.length > 30) {
        return res.status(400).json({
          valid: false,
          error: 'Username cannot exceed 30 characters!'
        });
      }

      // Validate username format: must start with a letter, can only contain letters, numbers and underscores
      const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_]*$/;
      if (!usernameRegex.test(username)) {
        return res.status(400).json({
          valid: false,
          error: 'Username can only contain letters, numbers and _, and must start with a letter!'
        });
      }

      // Check if username already exists
      const existingUser = await registrationDbService.findUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({
          valid: false,
          error: 'This username is already taken, please choose another one!'
        });
      }

      res.status(200).json({
        valid: true,
        message: 'Username is available'
      });
    } catch (error) {
      logger.error('Validate username error', { error });
      res.status(500).json({
        valid: false,
        error: 'Server Error'
      });
    }
  }

  /**
   * Validate password
   */
  async validatePassword(req, res) {
    try {
      const { password } = req.body;

      // Validate password length
      if (!password || password.length < 6) {
        return res.status(400).json({
          valid: false,
          error: 'Password must be at least 6 characters long!'
        });
      }

      // Validate password only contains letters, numbers and underscores
      const passwordRegex = /^[a-zA-Z0-9_]+$/;
      if (!passwordRegex.test(password)) {
        return res.status(400).json({
          valid: false,
          error: 'Format error, must contain at least two of the following: letters, numbers, underscores!'
        });
      }

      // Validate password must contain at least two character types
      const hasLetter = /[a-zA-Z]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      const hasUnderscore = /_/.test(password);
      const typeCount = (hasLetter ? 1 : 0) + (hasNumber ? 1 : 0) + (hasUnderscore ? 1 : 0);

      if (typeCount < 2) {
        return res.status(400).json({
          valid: false,
          error: 'Format error, must contain at least two of the following: letters, numbers, underscores!'
        });
      }

      res.status(200).json({
        valid: true,
        message: 'Password format is correct'
      });
    } catch (error) {
      logger.error('Validate password error', { error });
      res.status(500).json({
        valid: false,
        error: 'Server Error'
      });
    }
  }

  /**
   * Validate name
   */
  async validateName(req, res) {
    try {
      const { name } = req.body;

      if (!name) {
        return res.status(400).json({
          valid: false,
          error: 'Please enter your name!'
        });
      }

      // Calculate character length (1 Chinese character counts as 2 characters)
      const charLength = name.split('').reduce((len, char) => {
        return len + (/[\u4e00-\u9fa5]/.test(char) ? 2 : 1);
      }, 0);

      if (charLength < 3 || charLength > 30) {
        return res.status(400).json({
          valid: false,
          error: 'Allowed input string length is between 3-30 characters!'
        });
      }

      // Validate only contains Chinese/English characters, dots and single spaces
      const nameRegex = /^[\u4e00-\u9fa5a-zA-Z.\s]+$/;
      if (!nameRegex.test(name)) {
        return res.status(400).json({
          valid: false,
          error: 'Please enter your name!'
        });
      }

      res.status(200).json({
        valid: true,
        message: 'Name format is correct'
      });
    } catch (error) {
      logger.error('Validate name error', { error });
      res.status(500).json({
        valid: false,
        error: 'Server Error'
      });
    }
  }

  /**
   * Validate ID card
   */
  async validateIdCard(req, res) {
    try {
      const { idCardType, idCardNumber } = req.body;

      // Validate format first, then length
      if (idCardNumber) {
        // Validate only contains numbers and letters
        const idCardRegex = /^[a-zA-Z0-9]+$/;
        if (!idCardRegex.test(idCardNumber)) {
          return res.status(400).json({
            valid: false,
            error: 'ID number contains invalid characters!'
          });
        }
      }

      // Validate ID card number length
      if (!idCardNumber || idCardNumber.length !== 18) {
        return res.status(400).json({
          valid: false,
          error: 'Please enter a valid 18-digit ID number!'
        });
      }

      // Note: Check if ID number is already registered happens when clicking "Next", here only format validation
      res.status(200).json({
        valid: true,
        message: 'ID number format is correct'
      });
    } catch (error) {
      logger.error('Validate ID card error', { error });
      res.status(500).json({
        valid: false,
        error: 'Server Error'
      });
    }
  }

  /**
   * Validate email
   */
  async validateEmail(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(200).json({
          valid: true,
          message: 'Email format is correct'
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          valid: false,
          error: 'Please enter a valid email address!'
        });
      }

      res.status(200).json({
        valid: true,
        message: 'Email format is correct'
      });
    } catch (error) {
      logger.error('Validate email error', { error });
      res.status(500).json({
        valid: false,
        error: 'Server Error'
      });
    }
  }

  /**
   * Validate phone number
   */
  async validatePhone(req, res) {
    try {
      const { phone } = req.body;

      // Validate phone number length
      if (!phone || phone.length !== 11) {
        return res.status(400).json({
          valid: false,
          error: 'The mobile number you entered is not in a valid format!'
        });
      }

      // Validate only contains numbers
      const phoneRegex = /^[0-9]+$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({
          valid: false,
          error: 'The mobile number you entered is not in a valid format!'
        });
      }

      res.status(200).json({
        valid: true,
        message: 'Phone number format is correct'
      });
    } catch (error) {
      logger.error('Validate phone error', { error });
      res.status(500).json({
        valid: false,
        error: 'Server Error'
      });
    }
  }

  /**
   * User registration
   */
  async register(req, res) {
    try {
      const {
        username,
        password,
        confirmPassword,
        idCardType,
        name,
        idCardNumber,
        discountType,
        email,
        phone,
        agreedToTerms
      } = req.body;

      // Validate required fields
      if (!username || !password || !confirmPassword || !idCardType || 
          !name || !idCardNumber || !discountType || !phone) {
        return res.status(400).json({
          error: 'Please fill in all information!'
        });
      }

      // Validate password consistency
      if (password !== confirmPassword) {
        return res.status(400).json({
          error: 'Password confirmation does not match!'
        });
      }

      // Validate user agreement
      if (!agreedToTerms) {
        return res.status(400).json({
          error: 'Please confirm the terms of service!'
        });
      }

      // Check if username already exists
      const existingUser = await registrationDbService.findUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({
          error: 'This username is already taken, please choose another one!'
        });
      }

      // Check if ID number is already registered
      const existingIdCard = await registrationDbService.findUserByIdCardNumber(idCardType, idCardNumber);
      if (existingIdCard) {
        return res.status(409).json({
          error: 'This ID number has already been registered. Please confirm if you registered it yourself. If "Yes", please log in with your original account. If "No", please go to the nearest railway station with passenger service to handle the registration conflict, then you can continue to register, or call 12306 customer service for consultation.'
        });
      }

      // Check if phone number is already used by another user
      const existingPhone = await registrationDbService.findUserByPhone(phone);
      if (existingPhone) {
        return res.status(409).json({
          error: 'The mobile number you entered is already used by another registered user. Please confirm if it is your own registration. If this mobile number is registered by you, you can use this number to log in, or go back to the login page and click Forgot Password to reset your password. If the mobile number is not registered by you, you can change your mobile number or call 12306 customer service for assistance.'
        });
      }

      // Check if email is already used by another user (if provided)
      if (email) {
        const existingEmail = await registrationDbService.findUserByEmail(email);
        if (existingEmail) {
          return res.status(409).json({
            error: 'The email you entered is already used by another registered user. Please confirm if it is your own registration. If this email is registered by you, you can use this email to log in, or go back to the login page and click Forgot Password to reset your password. If the email is not registered by you, you can change your email or call 12306 customer service for assistance.'
          });
        }
      }

      // Create session, store user data
      const sessionId = await sessionService.createSession({
        username,
        password,
        idCardType,
        name,
        idCardNumber,
        discountType,
        email,
        phone
      });

      res.status(201).json({
        message: 'Registration information submitted, please proceed with verification',
        sessionId: sessionId
      });
    } catch (error) {
      logger.error('Register error', { error });
      res.status(500).json({
        error: 'Server Error'
      });
    }
  }

  /**
   * Send registration verification code
   */
  async sendRegistrationVerificationCode(req, res) {
    try {
      const { sessionId, phone: reqPhone, email: reqEmail } = req.body;

      // Validate session
      const session = await sessionService.getSession(sessionId);
      if (!session) {
        return res.status(400).json({
          error: 'Session invalid or expired'
        });
      }

      // Get phone and email from session or request
      const sessionData = session.user_data;
      const phone = reqPhone || sessionData.phone;
      const email = reqEmail || sessionData.email;

      // Check send frequency limit
      if (email) {
        const canSendEmail = await sessionService.checkEmailSendFrequency(email);
        if (!canSendEmail) {
          return res.status(429).json({
            error: 'Verification code request too frequent, please try again later!'
          });
        }
      }

      if (phone) {
        const canSendSms = await sessionService.checkSmsSendFrequency(phone, 'registration');
        if (!canSendSms) {
          return res.status(429).json({
            error: 'Verification code request too frequent, please try again later!'
          });
        }
      }

      // Send email verification code (if email provided)
      if (email) {
        await registrationDbService.createEmailVerificationCode(email);
      }

      // Send SMS verification code (if phone provided)
      let smsCode = null;
      if (phone) {
        smsCode = await registrationDbService.createSmsVerificationCode(phone, 'registration');
        logger.info('Registration verification code generated', { phone, smsCode, expiry: '5 minutes' });
      }

      res.status(200).json({
        message: 'Verification code sent successfully',
        // Return verification code in dev environment, should be removed in production
        verificationCode: smsCode
      });
    } catch (error) {
      logger.error('Send verification code error', { error });
      res.status(500).json({
        error: 'Server Error'
      });
    }
  }

  /**
   * Complete registration
   */
  async completeRegistration(req, res) {
    try {
      const { sessionId, smsCode, emailCode } = req.body;
      
      logger.info('Complete registration request', { sessionId, smsCode });

      // Validate session
      const session = await sessionService.getSession(sessionId);
      if (!session) {
        logger.warn('Session does not exist or expired');
        return res.status(400).json({
          error: 'Session invalid or expired'
        });
      }

      const userData = session.user_data;
      logger.info('Session valid, user data', { phone: userData.phone, username: userData.username });

      // Validate SMS verification code (if smsCode provided)
      if (smsCode) {
        logger.info(`Verifying SMS code ${smsCode} for phone ${userData.phone}`);
        const verifyResult = await registrationDbService.verifySmsCode(userData.phone, smsCode);
        logger.debug('Verification result', { verifyResult });
        if (!verifyResult.success) {
          logger.warn('Verification code error', { error: verifyResult.error });
          return res.status(400).json({
            error: verifyResult.error
          });
        }
        logger.info('Verification code validated');
      }

      // Validate email verification code (if emailCode provided)
      if (emailCode) {
        const isValidEmail = await registrationDbService.verifyEmailCode(userData.email, emailCode);
        if (!isValidEmail) {
          return res.status(400).json({
            error: 'Verification code incorrect or expired'
          });
        }
      }

      // Create user
      try {
        const userId = await registrationDbService.createUser(userData);
        
        // Automatically add registrant as passenger
        try {
          await passengerService.createPassenger(userId, {
            name: userData.name,
            idCardType: userData.idCardType || userData.id_card_type,
            idCardNumber: userData.idCardNumber || userData.id_card_number,
            discountType: userData.discountType || userData.discount_type,
            phone: userData.phone
          });
          logger.info('Automatically added registrant as passenger');
        } catch (passengerError) {
          // If creating passenger fails (e.g. ID already exists), log warning but don't fail registration
          logger.warn('Failed to automatically add registrant as passenger', { error: passengerError.message });
        }
        
        // Delete session
        await sessionService.deleteSession(sessionId);

        res.status(201).json({
          message: 'Congratulations! Registration successful. Please login on the login page!',
          userId: userId
        });
      } catch (error) {
        // If user already exists error, return specific info
        if (error.message && (
          error.message.includes('already registered') || 
          error.message === 'User already exists'
        )) {
          return res.status(409).json({
            error: error.message
          });
        }
        throw error;
      }
    } catch (error) {
      logger.error('Complete registration error', { error });
      res.status(500).json({
        error: 'Registration failed, please try again later'
      });
    }
  }

  /**
   * Get service terms
   */
  async getServiceTerms(req, res) {
    try {
      res.status(200).json({
        title: 'Terms of Service',
        content: 'China Railway Customer Service Center Website Terms of Service Content...'
      });
    } catch (error) {
      logger.error('Get service terms error', { error });
      res.status(500).json({
        error: 'Server Error'
      });
    }
  }

  /**
   * Get privacy policy
   */
  async getPrivacyPolicy(req, res) {
    try {
      res.status(200).json({
        title: 'Privacy Policy',
        englishTitle: 'NOTICE',
        content: 'Privacy Policy Content...'
      });
    } catch (error) {
      logger.error('Get privacy policy error', { error });
      res.status(500).json({
        error: 'Server Error'
      });
    }
  }
}

module.exports = new RegisterController();

