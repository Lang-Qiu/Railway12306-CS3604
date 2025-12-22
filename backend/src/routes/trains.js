const express = require('express');
const router = express.Router();
const trainService = require('../services/trainService');

// GET /api/v1/trains/:trainId
router.get('/:trainId', async (req, res) => {
  try {
    const trainInfo = await trainService.getTrainDetails(req.params.trainId);
    res.json(trainInfo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch train info' });
  }
});

module.exports = router;
