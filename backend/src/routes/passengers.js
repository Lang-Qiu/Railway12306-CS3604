const express = require('express');
const router = express.Router();
const passengerService = require('../services/passengerService');
const { authenticateUser } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * Get user passengers list
 * GET /api/passengers
 */
router.get('/', authenticateUser, async (req, res) => {
  try {
    
    const userId = req.user.id;
    const passengers = await passengerService.getUserPassengers(userId);
    
    res.status(200).json({ passengers });
  } catch (error) {
    logger.error('Failed to get passenger list', { error });
    const status = error.status || 500;
    const message = error.message || 'Failed to get passenger list';
    res.status(status).json({ error: message });
  }
});

/**
 * Search passengers
 * POST /api/passengers/search
 */
router.post('/search', authenticateUser, async (req, res) => {
  try {
    
    const { keyword } = req.body;
    
    // Validate keyword
    if (keyword === undefined || keyword === null) {
      return res.status(400).json({ error: 'Please provide search keyword' });
    }
    
    const userId = req.user.id;
    const passengers = await passengerService.searchPassengers(userId, keyword);
    
    res.status(200).json({ passengers });
  } catch (error) {
    logger.error('Failed to search passengers', { error });
    const status = error.status || 500;
    const message = error.message || 'Search failed';
    res.status(status).json({ error: message });
  }
});

/**
 * Add passenger
 * POST /api/passengers
 */
router.post('/', authenticateUser, async (req, res) => {
  try {
    
    const { name, idCardType, idCardNumber, discountType, phone } = req.body;
    
    // Validate required fields
    if (!name || !idCardType || !idCardNumber || !discountType) {
      return res.status(400).json({ error: 'Invalid parameters' });
    }
    
    const userId = req.user.id;
    const result = await passengerService.createPassenger(userId, {
      name,
      idCardType,
      idCardNumber,
      discountType,
      phone
    });
    
    res.status(201).json(result);
  } catch (error) {
    logger.error('Failed to add passenger', { error });
    const status = error.status || 500;
    const message = error.message || 'Failed to add passenger';
    res.status(status).json({ error: message });
  }
});

/**
 * Update passenger info
 * PUT /api/passengers/:passengerId
 */
router.put('/:passengerId', authenticateUser, async (req, res) => {
  try {
    
    const { passengerId } = req.params;
    const { name, idCardType, idCardNumber, discountType, phone } = req.body;
    
    const userId = req.user.id;
    const result = await passengerService.updatePassenger(userId, passengerId, {
      name,
      idCardType,
      idCardNumber,
      discountType,
      phone
    });
    
    res.status(200).json(result);
  } catch (error) {
    logger.error('Failed to update passenger', { error });
    const status = error.status || 500;
    const message = error.message || 'Failed to update passenger';
    res.status(status).json({ error: message });
  }
});

/**
 * Delete passenger
 * DELETE /api/passengers/:passengerId
 */
router.delete('/:passengerId', authenticateUser, async (req, res) => {
  try {
    
    const { passengerId } = req.params;
    const userId = req.user.id;
    
    logger.debug('Deleting passenger route called', {
      user: req.user,
      passengerId,
      userId
    });
    
    const result = await passengerService.deletePassenger(userId, passengerId);
    
    res.status(200).json(result);
  } catch (error) {
    logger.error('Failed to delete passenger', { error, stack: error.stack });
    const status = error.status || 500;
    const message = error.message || 'Failed to delete passenger';
    res.status(status).json({ error: message });
  }
});

/**
 * Get passenger details
 * GET /api/passengers/:passengerId
 */
router.get('/:passengerId', authenticateUser, async (req, res) => {
  try {
    
    const { passengerId } = req.params;
    const userId = req.user.id;
    
    const passenger = await passengerService.getPassengerDetails(userId, passengerId);
    
    res.status(200).json(passenger);
  } catch (error) {
    logger.error('Failed to get passenger details', { error });
    const status = error.status || 500;
    const message = error.message || 'Failed to get passenger details';
    res.status(status).json({ error: message });
  }
});

module.exports = router;


