const express = require('express');
const router = express.Router();
const stationService = require('../services/stationService');
const logger = require('../utils/logger');

/**
 * Get all available stations
 * GET /api/stations
 * Supports keyword search (pinyin, full pinyin, Chinese characters)
 */
router.get('/', async (req, res) => {
  try {
    const { keyword } = req.query;
    
    let stations;
    if (keyword) {
      // If keyword provided, return fuzzy matched stations
      stations = await stationService.searchStations(keyword);
    } else {
      // If no keyword, return all stations
      stations = await stationService.getAllStations();
    }
    
    res.status(200).json({
      stations: stations
    });
  } catch (error) {
    logger.error('Failed to get station list', { error });
    res.status(500).json({ error: 'Failed to get station list' });
  }
});

/**
 * Validate station
 * POST /api/stations/validate
 * If station invalid, return similar stations as suggestions
 */
router.post('/validate', async (req, res) => {
  try {
    const { stationName } = req.body;
    
    // Validate if station name is in supported station list
    const result = await stationService.validateStation(stationName);
    
    if (result.valid) {
      res.status(200).json({
        valid: true,
        station: result.station
      });
    } else {
      res.status(400).json({
        valid: false,
        error: result.error || 'Cannot match the departure/arrival location',
        suggestions: result.suggestions || []
      });
    }
  } catch (error) {
    logger.error('Failed to validate station', { error });
    res.status(400).json({
      valid: false,
      error: 'Cannot match the departure/arrival location',
      suggestions: []
    });
  }
});

module.exports = router;

