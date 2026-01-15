const express = require('express');
const router = express.Router();
const orderService = require('../services/orderService');
const passengerService = require('../services/passengerService');
const { authenticateUser } = require('../middleware/auth');
const { checkUnpaidOrder } = require('../middleware/bookingRestriction');
const logger = require('../utils/logger');

/**
 * Get order filling page info
 * GET /api/orders/new
 */
router.get('/new', authenticateUser, checkUnpaidOrder, async (req, res) => {
  try {
    
    const { trainNo, departureStation, arrivalStation, departureDate } = req.query;
    
    // Validate required parameters
    if (!trainNo || !departureStation || !arrivalStation || !departureDate) {
      return res.status(400).json({ error: 'Invalid parameters' });
    }
    
    const userId = req.user.id;
    
    // Get train info, fares, available seats
    const availableSeatTypes = await orderService.getAvailableSeatTypes({
      trainNo,
      departureStation,
      arrivalStation,
      departureDate
    });
    
    // Get user passengers
    const passengers = await passengerService.getUserPassengers(userId);
    
    // Get default seat type
    const defaultSeat = await orderService.getDefaultSeatType(trainNo);
    
    // Get train time details (use trainService)
    const trainService = require('../services/trainService');
    const trainDetails = await trainService.getTrainTimeDetails(trainNo, departureStation, arrivalStation);
    
    // Build fare and available seats info
    const fareInfo = {};
    const availableSeats = {};
    availableSeatTypes.forEach(st => {
      fareInfo[st.seat_type] = {
        price: st.price,
        available: st.available
      };
      availableSeats[st.seat_type] = st.available;
    });
    
    res.status(200).json({
      trainInfo: {
        trainNo,
        departureStation,
        arrivalStation,
        departureDate,
        departureTime: trainDetails?.departureTime,
        arrivalTime: trainDetails?.arrivalTime
      },
      fareInfo,
      availableSeats,
      passengers,
      defaultSeatType: defaultSeat.seatType
    });
  } catch (error) {
    logger.error('Failed to get order page info', { error });
    const status = error.status || 500;
    const message = error.message || 'Failed to load order page';
    res.status(status).json({ error: message });
  }
});

/**
 * Get available seat types list (Public API, no login required)
 * GET /api/orders/available-seat-types
 */
router.get('/available-seat-types', async (req, res) => {
  try {
    const { trainNo, departureStation, arrivalStation, departureDate } = req.query;
    
    // Validate required parameters
    if (!trainNo || !departureStation || !arrivalStation || !departureDate) {
      return res.status(400).json({ error: 'Invalid parameters' });
    }
    
    const seatTypes = await orderService.getAvailableSeatTypes({
      trainNo,
      departureStation,
      arrivalStation,
      departureDate
    });
    
    // Format output
    const formattedSeatTypes = seatTypes.map(st => ({
      type: st.seat_type,
      price: st.price,
      available: st.available
    }));
    
    res.status(200).json({ seatTypes: formattedSeatTypes });
  } catch (error) {
    logger.error('Failed to get seat types info', { error });
    const status = error.status || 500;
    const message = error.message || 'Failed to get seat types info';
    res.status(status).json({ error: message });
  }
});

/**
 * Submit order
 * POST /api/orders/submit
 */
router.post('/submit', authenticateUser, async (req, res) => {
  try {
    
    const { trainNo, departureStation, arrivalStation, departureDate, passengers } = req.body;
    
    // Validate at least one passenger selected
    if (!passengers || passengers.length === 0) {
      return res.status(400).json({ error: 'Please select passengers!' });
    }
    
    const userId = req.user.id;
    
    // Create order
    const result = await orderService.createOrder({
      userId,
      trainNo,
      departureStation,
      arrivalStation,
      departureDate,
      passengers
    });
    
    res.status(200).json(result);
  } catch (error) {
    logger.error('Failed to submit order', { error });
    const status = error.status || 500;
    const message = error.message || 'Network busy, please try again later';
    res.status(status).json({ error: message });
  }
});

/**
 * Get order confirmation info
 * GET /api/orders/:orderId/confirmation
 */
router.get('/:orderId/confirmation', authenticateUser, async (req, res) => {
  try{
    
    const { orderId } = req.params;
    const userId = req.user.id;
    
    const orderDetails = await orderService.getOrderDetails(orderId, userId);
    
    res.status(200).json(orderDetails);
  } catch (error) {
    logger.error('Failed to get order info', { error });
    const status = error.status || 500;
    const message = error.message || 'Failed to get order info';
    res.status(status).json({ error: message });
  }
});

/**
 * Confirm order
 * POST /api/orders/:orderId/confirm
 */
router.post('/:orderId/confirm', authenticateUser, async (req, res) => {
  try {
    
    const { orderId } = req.params;
    const userId = req.user.id;
    
    const result = await orderService.confirmOrder(orderId, userId);
    
    res.status(200).json(result);
  } catch (error) {
    logger.error('Failed to confirm order', { error });
    const status = error.status || 500;
    const message = error.message || 'Failed to confirm order';
    res.status(status).json({ error: message });
  }
});

module.exports = router;
