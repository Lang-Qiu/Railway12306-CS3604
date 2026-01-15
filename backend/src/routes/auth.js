const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');

const router = express.Router();

// API-POST-Login: User login interface
router.post('/login', [
  body('identifier').notEmpty().withMessage('Username/Email/Phone cannot be empty'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
], authController.login);

// API-POST-SendVerificationCode: Send SMS verification code interface
router.post('/send-verification-code', [
  body('sessionId').notEmpty().withMessage('Session ID cannot be empty'),
  body('idCardLast4').isLength({ min: 4, max: 4 }).withMessage('Please enter the last 4 digits of ID card')
], authController.sendVerificationCode);

// API-POST-VerifyLogin: SMS verification login interface
router.post('/verify-login', [
  body('sessionId').notEmpty().withMessage('Session ID cannot be empty'),
  body('verificationCode').isLength({ min: 6, max: 6 }).withMessage('Please enter 6-digit verification code')
], authController.verifyLogin);

// API-GET-HomePage: Get homepage content interface
router.get('/homepage', authController.getHomePage);

// API-GET-ForgotPassword: Forgot password page interface
router.get('/forgot-password', authController.getForgotPassword);

module.exports = router;