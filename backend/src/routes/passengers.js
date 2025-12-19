const express = require('express');
const router = express.Router();
const passengerService = require('../services/passengerService');

// GET /api/v1/passengers
router.get('/', async (req, res) => {
  // TODO: Get userId from session/token
  const userId = 1; 
  try {
    const passengers = await passengerService.getPassengersByUserId(userId);
    res.json(passengers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch passengers' });
  }
});

// GET /api/v1/passengers/search?q=name
router.get('/search', async (req, res) => {
    const userId = 1;
    const query = req.query.q;
    try {
        const passengers = await passengerService.searchPassengers(userId, query);
        res.json(passengers);
    } catch (error) {
        res.status(500).json({ error: 'Failed to search passengers' });
    }
});

module.exports = router;
