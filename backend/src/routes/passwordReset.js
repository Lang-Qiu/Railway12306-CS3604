/**
 * Password Reset API Routes
 * Source file: backend/src/routes/passwordReset.js
 */

const express = require('express');
const router = express.Router();
const passwordResetService = require('../services/passwordResetService');
const logger = require('../utils/logger');

/**
 * API-POST-VerifyAccount: Verify account info
 * POST /api/password-reset/verify-account
 * Request body: { phone, idCardType, idCardNumber }
 * Returns: { success, sessionId, phone, error }
 */
router.post('/verify-account', async (req, res) => {
  try {
    const { phone, idCardType, idCardNumber } = req.body;

    // Validate required fields
    if (!phone || !idCardType || !idCardNumber) {
      return res.status(400).json({
        success: false,
        error: 'Please fill in complete account information'
      });
    }

    // Validate phone format
    if (!/^\d{11}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid phone number'
      });
    }

    // Call service to verify account
    const result = await passwordResetService.verifyAccountInfo(phone, idCardType, idCardNumber);

    if (result.success) {
      return res.status(200).json({
        success: true,
        sessionId: result.sessionId,
        phone: result.phone
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Verify account info error', { error });
    return res.status(500).json({
      success: false,
      error: 'Server error, please try again later'
    });
  }
});

/**
 * API-POST-SendResetCode: Send password reset verification code
 * POST /api/password-reset/send-code
 * Request body: { sessionId }
 * Returns: { success, verificationCode, phone, error }
 */
router.post('/send-code', async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Missing Session ID'
      });
    }

    // Send verification code
    const result = await passwordResetService.sendResetCode(sessionId);

    if (result.success) {
      return res.status(200).json({
        success: true,
        verificationCode: result.verificationCode, // Return code in dev environment
        phone: result.phone
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Send verification code error', { error });
    return res.status(500).json({
      success: false,
      error: 'Server error, please try again later'
    });
  }
});

/**
 * API-POST-VerifyCode: Verify reset code
 * POST /api/password-reset/verify-code
 * Request body: { sessionId, code }
 * Returns: { success, resetToken, error }
 */
router.post('/verify-code', async (req, res) => {
  try {
    const { sessionId, code } = req.body;

    if (!sessionId || !code) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters'
      });
    }

    // Verify code
    const result = await passwordResetService.verifyResetCode(sessionId, code);

    if (result.success) {
      return res.status(200).json({
        success: true,
        resetToken: result.resetToken
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Verify code error', { error });
    return res.status(500).json({
      success: false,
      error: 'Server error, please try again later'
    });
  }
});

/**
 * API-POST-ResetPassword: Reset password
 * POST /api/password-reset/reset-password
 * Request body: { resetToken, newPassword, confirmPassword }
 * Returns: { success, error }
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword, confirmPassword } = req.body;

    if (!resetToken || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Please fill in complete information'
      });
    }

    // Reset password
    const result = await passwordResetService.resetPassword(resetToken, newPassword, confirmPassword);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Password reset successful'
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Reset password error', { error });
    return res.status(500).json({
      success: false,
      error: 'Server error, please try again later'
    });
  }
});

module.exports = router;

