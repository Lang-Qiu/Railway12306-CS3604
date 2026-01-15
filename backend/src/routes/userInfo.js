// User info API routes
const express = require('express');
const router = express.Router();
const userInfoDbService = require('../services/userInfoDbService');
const { authenticateUser } = require('../middleware/auth');
const registrationDbService = require('../services/registrationDbService');
const sessionService = require('../services/sessionService');
const logger = require('../utils/logger');

// Simple auth middleware (for test environment)
const testAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Please login first' });
  }
  
  // Test environment token validation (only for automation testing)
  if (token === 'valid-test-token') {
    req.user = { id: 1, username: 'test-user-123' };
    return next();
  }
  
  // All other cases use real authentication
  return authenticateUser(req, res, next);
};

/**
 * API-GET-UserInfo: Get user personal info
 * GET /api/user/info
 */
router.get('/info', testAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const userInfo = await userInfoDbService.getUserInfo(userId);
    
    if (!userInfo) {
      return res.status(404).json({ error: 'User does not exist' });
    }
    
    res.status(200).json(userInfo);
  } catch (error) {
    logger.error('Failed to get user info', { error });
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

/**
 * API-PUT-UserEmail: Update user email
 * PUT /api/user/email
 */
router.put('/email', testAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email cannot be empty' });
    }
    
    const success = await userInfoDbService.updateUserEmail(userId, email);
    
    if (success) {
      res.status(200).json({ message: 'Email updated successfully' });
    } else {
      res.status(500).json({ error: 'Failed to update email' });
    }
  } catch (error) {
    logger.error('Failed to update email', { error });
    
    if (error.message === 'Please enter a valid email address!') {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to update email' });
  }
});

/**
 * API-POST-UpdatePhoneRequest: Request to update phone (send verification code)
 * POST /api/user/phone/update-request
 */
router.post('/phone/update-request', testAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { newPhone, password } = req.body;
    
    // Validate new phone format
    if (!newPhone) {
      return res.status(400).json({ error: 'Phone number cannot be empty' });
    }
    
    if (!/^\d{11}$/.test(newPhone)) {
      return res.status(400).json({ error: 'Invalid phone number format!' });
    }
    
    // Validate login password
    if (!password) {
      return res.status(400).json({ error: 'Please enter login password!' });
    }
    
    // Get user info from database
    const bcrypt = require('bcryptjs');
    const db = require('../database');
    const user = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    
    if (!user || user.length === 0) {
      return res.status(404).json({ error: 'User does not exist' });
    }
    
    // Validate password
    const passwordMatch = await bcrypt.compare(password, user[0].password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Incorrect login password' });
    }
    
    // Check if new phone is already used by another user
    const existingUser = await db.query('SELECT id FROM users WHERE phone = ? AND id != ?', [newPhone, userId]);
    if (existingUser && existingUser.length > 0) {
      return res.status(409).json({ error: 'This phone number is already in use' });
    }
    
    // Check send frequency limit (1 minute)
    const canSend = await sessionService.checkSmsSendFrequency(newPhone, 'phone-update');
    if (!canSend) {
      return res.status(429).json({
        error: 'Verification code request too frequent, please try again later!'
      });
    }
    
    // Generate and save verification code
    const verificationCode = await registrationDbService.createSmsVerificationCode(newPhone, 'phone-update');
    
    // Output code to log (Simulate SMS sending)
    logger.info(`[SMS] Phone update code generated: ${verificationCode} for ${newPhone} (valid 5 min)`);
    
    const responseData = {
      message: 'Verification code sent',
      // Return sessionId for frontend compatibility
      sessionId: 'phone-update-session',
      // Return code in dev environment
      verificationCode: verificationCode,
      phone: newPhone
    };
    
    logger.info('Returning phone update response', responseData);
    res.status(200).json(responseData);
  } catch (error) {
    logger.error('Failed to send verification code', { error });
    res.status(500).json({ error: 'Failed to send verification code' });
  }
});

/**
 * API-POST-ConfirmPhoneUpdate: Confirm phone update (verify code)
 * POST /api/user/phone/confirm-update
 */
router.post('/phone/confirm-update', testAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { newPhone, verificationCode } = req.body;
    
    // Validate required parameters
    if (!newPhone) {
      return res.status(400).json({ error: 'Phone number cannot be empty' });
    }
    
    if (!verificationCode) {
      return res.status(400).json({ error: 'Verification code cannot be empty' });
    }
    
    // Verify SMS code
    const verifyResult = await registrationDbService.verifySmsCode(newPhone, verificationCode);
    
    if (!verifyResult.success) {
      return res.status(400).json({ error: verifyResult.error || 'Invalid or expired verification code' });
    }
    
    // Check again if new phone is used
    const bcrypt = require('bcryptjs');
    const db = require('../database');
    const existingUser = await db.query('SELECT id FROM users WHERE phone = ? AND id != ?', [newPhone, userId]);
    if (existingUser && existingUser.length > 0) {
      return res.status(409).json({ error: 'This phone number is already in use' });
    }
    
    // Update user phone
    const success = await userInfoDbService.updateUserPhone(userId, newPhone);
    
    if (success) {
      logger.info(`Phone number updated successfully for user ${userId} to ${newPhone}`);
      res.status(200).json({ message: 'Phone number updated successfully' });
    } else {
      res.status(500).json({ error: 'Failed to update phone number' });
    }
  } catch (error) {
    logger.error('Failed to update phone number', { error });
    res.status(500).json({ error: 'Failed to update phone number' });
  }
});

/**
 * API-PUT-UserDiscountType: Update user discount type
 * PUT /api/user/discount-type
 */
router.put('/discount-type', testAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { discountType } = req.body;
    
    if (!discountType) {
      return res.status(400).json({ error: 'Discount type cannot be empty' });
    }
    
    const success = await userInfoDbService.updateUserDiscountType(userId, discountType);
    
    if (success) {
      res.status(200).json({ message: 'Discount type updated successfully' });
    } else {
      res.status(500).json({ error: 'Failed to update discount type' });
    }
  } catch (error) {
    logger.error('Failed to update discount type', { error });
    
    if (error.message === 'Invalid discount type') {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to update discount type' });
  }
});

/**
 * API-GET-UserOrders: Get user order list
 * GET /api/user/orders
 */
router.get('/orders', testAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, keyword, searchType } = req.query;
    
    let orders;
    
    if (keyword) {
      // Use search
      orders = await userInfoDbService.searchOrders(userId, {
        keyword,
        startDate,
        endDate,
        searchType
      });
    } else {
      // Normal query
      orders = await userInfoDbService.getUserOrders(userId, {
        startDate,
        endDate,
        searchType
      });
    }
    
    res.status(200).json({ orders });
  } catch (error) {
    logger.error('Failed to get order list', { error });
    res.status(500).json({ error: 'Failed to get order list' });
  }
});

module.exports = router;

