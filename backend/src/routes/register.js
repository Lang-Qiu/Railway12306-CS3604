/**
 * Registration routes
 * Source file: backend/src/routes/register.js
 * Test file: backend/test/routes/register.test.js
 */

const express = require('express');
const router = express.Router();
const registerController = require('../controllers/registerController');

// POST /api/auth/validate-username - Validate username
router.post('/validate-username', (req, res) => {
  registerController.validateUsername(req, res);
});

// POST /api/auth/validate-password - Validate password
router.post('/validate-password', (req, res) => {
  registerController.validatePassword(req, res);
});

// POST /api/auth/validate-name - Validate name
router.post('/validate-name', (req, res) => {
  registerController.validateName(req, res);
});

// POST /api/auth/validate-idcard - Validate ID card
router.post('/validate-idcard', (req, res) => {
  registerController.validateIdCard(req, res);
});

// POST /api/auth/validate-email - Validate email
router.post('/validate-email', (req, res) => {
  registerController.validateEmail(req, res);
});

// POST /api/auth/validate-phone - Validate phone
router.post('/validate-phone', (req, res) => {
  registerController.validatePhone(req, res);
});

// POST /api/register - User register
router.post('/', (req, res) => {
  registerController.register(req, res);
});

// POST /api/register/send-verification-code - Send registration verification code
router.post('/send-verification-code', (req, res) => {
  registerController.sendRegistrationVerificationCode(req, res);
});

// POST /api/register/complete - Complete registration
router.post('/complete', (req, res) => {
  registerController.completeRegistration(req, res);
});

// GET /api/terms/service-terms - Get service terms
router.get('/service-terms', (req, res) => {
  registerController.getServiceTerms(req, res);
});

// GET /api/terms/privacy-policy - Get privacy policy
router.get('/privacy-policy', (req, res) => {
  registerController.getPrivacyPolicy(req, res);
});

module.exports = router;

