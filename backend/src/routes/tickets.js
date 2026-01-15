const express = require('express');
const router = express.Router();
const ticketService = require('../services/ticketService');
const trainService = require('../services/trainService');
const logger = require('../utils/logger');

/**
 * Reserve ticket
 * POST /api/tickets/reserve
 */
router.post('/reserve', async (req, res) => {
  try {
    const { 
      trainNo, 
      departureStation, 
      arrivalStation, 
      departureDate, 
      seatType, 
      passengerId,
      queryTimestamp 
    } = req.body;
    
    // Check required parameters
    if (!trainNo || !departureStation || !arrivalStation || !departureDate || !seatType || !passengerId) {
      throw new Error('Missing required parameters');
    }
    
    // Validate user login (get from Authorization header or session)
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Please login first!' });
    }
    
    // Simplified: extract userId from Authorization header
    // TODO: Should verify JWT token
    let userId = null;
    try {
      // Assume "Bearer token" format
      const token = authHeader.split(' ')[1];
      // TODO: Should parse JWT token to get userId
      userId = token; // Simplified
    } catch (error) {
      return res.status(401).json({ error: 'Please login first!' });
    }
    
    // Check if query expired (5 minutes)
    if (queryTimestamp && ticketService.checkQueryExpired(queryTimestamp)) {
      return res.status(400).json({ error: 'Page content expired, please query again!' });
    }
    
    // Get train details to check departure time
    const trainDetails = await trainService.getTrainDetails(trainNo);
    if (!trainDetails) {
      return res.status(400).json({ error: 'Train does not exist' });
    }
    
    // Check if less than 3 hours to departure
    const timeCheck = ticketService.checkDepartureTime(departureDate, trainDetails.route.departureTime);
    if (timeCheck.isNearDeparture) {
      return res.status(400).json({ error: timeCheck.message });
    }
    
    // Check ticket availability
    const availableSeats = await trainService.calculateAvailableSeats(
      trainNo, 
      departureStation, 
      arrivalStation
    );
    
    if (!availableSeats[seatType] || availableSeats[seatType] === 0) {
      return res.status(400).json({ error: 'Too slow! Tickets for this train are sold out!' });
    }
    
    // Reserve ticket
    const result = await ticketService.reserveTicket(
      trainNo, 
      departureStation, 
      arrivalStation, 
      departureDate, 
      seatType, 
      passengerId,
      userId
    );
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    
    // Reservation successful
    res.status(200).json({
      message: 'Reservation successful',
      orderId: result.orderId,
      seatNo: result.seatNo,
      redirectUrl: '/order-details'
    });
  } catch (error) {
    logger.error('Failed to reserve ticket', { error });
    res.status(500).json({ error: 'Network busy, please try again later' });
  }
});

module.exports = router;
