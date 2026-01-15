const express = require('express');
const router = express.Router();
const trainService = require('../services/trainService');
const stationService = require('../services/stationService');
const logger = require('../utils/logger');

/**
 * Get all supported cities list
 * GET /api/trains/cities
 */
router.get('/cities', async (req, res) => {
  try {
    const cities = await stationService.getAllCities();
    res.status(200).json({
      cities: cities
    });
  } catch (error) {
    logger.error('Failed to get city list', { error });
    res.status(500).json({ error: 'Failed to get city list' });
  }
});

/**
 * Get stations by city
 * GET /api/trains/cities/:cityName/stations
 */
router.get('/cities/:cityName/stations', async (req, res) => {
  try {
    const { cityName } = req.params;
    const stations = await stationService.getStationsByCity(cityName);
    
    if (stations.length === 0) {
      return res.status(404).json({ error: 'City not found or no stations configured' });
    }
    
    res.status(200).json({
      city: cityName,
      stations: stations
    });
  } catch (error) {
    logger.error('Failed to get stations by city', { error });
    res.status(500).json({ error: 'Failed to get stations by city' });
  }
});

/**
 * Get city by station name
 * GET /api/trains/stations/:stationName/city
 */
router.get('/stations/:stationName/city', async (req, res) => {
  try {
    const { stationName } = req.params;
    const city = await stationService.getCityByStation(stationName);
    
    if (!city) {
      return res.status(404).json({ error: 'City not found for this station' });
    }
    
    res.status(200).json({
      station: stationName,
      city: city
    });
  } catch (error) {
    logger.error('Failed to get city by station', { error });
    res.status(500).json({ error: 'Failed to get city by station' });
  }
});

/**
 * Calculate available seats for specific train and interval
 * POST /api/trains/available-seats
 */
router.post('/available-seats', async (req, res) => {
  try {
    const { trainNo, departureStation, arrivalStation, departureDate } = req.body;
    
    // Validate required parameters
    if (!trainNo || !departureStation || !arrivalStation) {
      return res.status(400).json({ error: 'Invalid parameters' });
    }
    
    // Calculate available seats
    const availableSeats = await trainService.calculateAvailableSeats(
      trainNo, 
      departureStation, 
      arrivalStation
    );
    
    res.status(200).json({
      trainNo: trainNo,
      availableSeats: availableSeats
    });
  } catch (error) {
    logger.error('Failed to calculate available seats', { error });
    res.status(500).json({ error: 'Failed to calculate available seats' });
  }
});

/**
 * Get filter options
 * GET /api/trains/filter-options
 */
router.get('/filter-options', async (req, res) => {
  try {
    const { departureStation, arrivalStation, departureDate } = req.query;
    
    // Validate required parameters
    if (!departureStation || !arrivalStation || !departureDate) {
      return res.status(400).json({ error: 'Invalid parameters' });
    }
    
    // Return unique departure/arrival stations and seat types from current search results
    const filterOptions = await trainService.getFilterOptions(
      departureStation, 
      arrivalStation, 
      departureDate
    );
    
    res.status(200).json(filterOptions);
  } catch (error) {
    logger.error('Failed to get filter options', { error });
    res.status(500).json({ error: 'Failed to get filter options' });
  }
});

/**
 * Get available departure dates
 * GET /api/trains/available-dates
 */
router.get('/available-dates', async (req, res) => {
  try {
    // Return list of dates with tickets available
    const availableDates = await trainService.getAvailableDates();
    
    res.status(200).json({
      availableDates: availableDates,
      currentDate: new Date().toISOString().split('T')[0]
    });
  } catch (error) {
    logger.error('Failed to get available dates', { error });
    res.status(500).json({ error: 'Failed to get available dates' });
  }
});

/**
 * Search trains matching conditions
 * Supports search by city or station
 * POST /api/trains/search
 */
router.post('/search', async (req, res) => {
  try {
    const { departureStation, arrivalStation, departureDate, trainTypes } = req.body;
    
    // Validate departure and arrival stations are not empty
    if (!departureStation) {
      return res.status(400).json({ error: 'Please select departure city' });
    }
    
    if (!arrivalStation) {
      return res.status(400).json({ error: 'Please select arrival city' });
    }
    
    // Validate departure date format (YYYY-MM-DD)
    if (departureDate) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(departureDate)) {
        logger.error('Invalid date format', { departureDate });
        return res.status(400).json({ error: 'Invalid date format, please use YYYY-MM-DD' });
      }
      // Validate if date is valid
      const date = new Date(departureDate);
      if (isNaN(date.getTime())) {
        logger.error('Invalid date', { departureDate });
        return res.status(400).json({ error: 'Invalid date' });
      }
    }
    
    // Validate departure city
    const depCityResult = await stationService.validateCity(departureStation);
    if (!depCityResult.valid) {
      return res.status(400).json({ 
        error: 'Cannot match departure city',
        suggestions: depCityResult.suggestions 
      });
    }
    
    // Validate arrival city
    const arrCityResult = await stationService.validateCity(arrivalStation);
    if (!arrCityResult.valid) {
      return res.status(400).json({ 
        error: 'Cannot match arrival city',
        suggestions: arrCityResult.suggestions 
      });
    }
    
    // Log search parameters
    logger.info('Train search request (City level)', { departureStation, arrivalStation, departureDate, trainTypes });
    
    // Query trains matching conditions
    const trains = await trainService.searchTrains(
      departureStation, 
      arrivalStation, 
      departureDate, 
      trainTypes
    );
    
    logger.info(`Search result: found ${trains.length} trains`);
    
    res.status(200).json({
      trains: trains,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to search trains', { error });
    logger.error('Error details', {
      message: error.message,
      stack: error.stack,
      params: req.body
    });
    res.status(500).json({ error: 'Search failed, please try again later' });
  }
});

/**
 * Get details of a specific train
 * GET /api/trains/:trainNo
 */
router.get('/:trainNo', async (req, res) => {
  try {
    const { trainNo } = req.params;
    
    // Query train details
    const trainDetails = await trainService.getTrainDetails(trainNo);
    
    if (!trainDetails) {
      return res.status(404).json({ error: 'Train does not exist' });
    }
    
    res.status(200).json(trainDetails);
  } catch (error) {
    logger.error('Failed to get train details', { error });
    res.status(500).json({ error: 'Failed to get train details' });
  }
});

module.exports = router;
