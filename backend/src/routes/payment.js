const express = require('express');
const router = express.Router();
const orderService = require('../services/orderService');
const { authenticateUser } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * Get payment page data
 * GET /api/payment/:orderId
 */
router.get('/:orderId', authenticateUser, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    
    const paymentData = await orderService.getPaymentPageData(orderId, userId);
    
    // Calculate remaining time
    const timeRemaining = await orderService.getOrderTimeRemaining(orderId);
    
    res.status(200).json({
      ...paymentData,
      timeRemaining // remaining seconds
    });
  } catch (error) {
    logger.error('Failed to get payment page data', { error });
    const status = error.status || 500;
    const message = error.message || 'Failed to get payment page data';
    res.status(status).json({ error: message });
  }
});

/**
 * Confirm payment
 * POST /api/payment/:orderId/confirm
 */
router.post('/:orderId/confirm', authenticateUser, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    
    const result = await orderService.confirmPayment(orderId, userId);
    
    res.status(200).json(result);
  } catch (error) {
    logger.error('Failed to confirm payment', { error });
    const status = error.status || 500;
    const message = error.message || 'Payment failed';
    res.status(status).json({ error: message });
  }
});

/**
 * Cancel order
 * POST /api/payment/:orderId/cancel
 */
router.post('/:orderId/cancel', authenticateUser, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    
    const result = await orderService.cancelOrderWithTracking(orderId, userId);
    
    res.status(200).json(result);
  } catch (error) {
    logger.error('Failed to cancel order', { error });
    const status = error.status || 500;
    const message = error.message || 'Failed to cancel order';
    res.status(status).json({ error: message });
  }
});

/**
 * Check if user has unpaid orders
 * GET /api/payment/check-unpaid
 */
router.get('/check-unpaid', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const hasUnpaid = await orderService.hasUnpaidOrder(userId);
    
    res.status(200).json({ hasUnpaidOrder: hasUnpaid });
  } catch (error) {
    logger.error('Failed to check unpaid orders', { error });
    const status = error.status || 500;
    const message = error.message || 'Check failed';
    res.status(status).json({ error: message });
  }
});

/**
 * Get order remaining payment time
 * GET /api/payment/:orderId/time-remaining
 */
router.get('/:orderId/time-remaining', authenticateUser, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    
    // Verify order belongs to current user
    const paymentData = await orderService.getPaymentPageData(orderId, userId);
    
    const timeRemaining = await orderService.getOrderTimeRemaining(orderId);
    
    res.status(200).json({ timeRemaining });
  } catch (error) {
    logger.error('Failed to get remaining time', { error });
    const status = error.status || 500;
    const message = error.message || 'Failed to get';
    res.status(status).json({ error: message });
  }
});

module.exports = router;

