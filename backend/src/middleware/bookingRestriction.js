const orderService = require('../services/orderService');
const logger = require('../utils/logger');

/**
 * Check if the user has any unpaid orders
 * If yes, prevent further ticket booking
 */
async function checkUnpaidOrder(req, res, next) {
  try {
    const userId = req.user.id;
    
    const hasUnpaid = await orderService.hasUnpaidOrder(userId);
    
    if (hasUnpaid) {
      return res.status(403).json({
        error: 'You have pending orders, please go to [Unfinished Orders] to process them!',
        hasUnpaidOrder: true
      });
    }
    
    next();
  } catch (error) {
    logger.error('Failed to check unpaid orders', { error });
    // If check fails, allow to proceed (avoid blocking normal flow)
    next();
  }
}

module.exports = {
  checkUnpaidOrder
};

