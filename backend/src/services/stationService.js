const dbService = require('./dbService');
const path = require('path');
const cityStationMapping = require('../config/cityStationMapping');
const logger = require('../utils/logger');

/**
 * Station Service
 */

/**
 * Get all stations
 */
async function getAllStations() {
  try {
    const rows = await dbService.all('SELECT * FROM stations ORDER BY name');
    return rows || [];
  } catch (err) {
    logger.error('Failed to get station list', { error: err });
    throw err;
  }
}

/**
 * Search stations by keyword
 * Supports pinyin, short pinyin, and Chinese characters
 */
async function searchStations(keyword) {
  if (!keyword) {
    return await getAllStations();
  }
  
  try {
    const searchPattern = `%${keyword}%`;
    
    // Search by station name, pinyin, or short pinyin
    const rows = await dbService.all(
      `SELECT * FROM stations 
       WHERE name LIKE ? OR pinyin LIKE ? OR short_pinyin LIKE ? 
       ORDER BY name`,
      [searchPattern, searchPattern, searchPattern]
    );
    return rows || [];
  } catch (err) {
    logger.error('Failed to search stations', { error: err });
    throw err;
  }
}

/**
 * Validate if a station is valid
 * If invalid, returns recommended stations based on similarity
 */
async function validateStation(stationName) {
  if (!stationName) {
    return { valid: false, error: 'Station name cannot be empty', suggestions: [] };
  }
  
  try {
    // Exact match first
    const row = await dbService.get('SELECT * FROM stations WHERE name = ?', [stationName]);
    
    if (row) {
      // Station is valid
      return { valid: true, station: row };
    }
    
    // Station invalid, find similar stations
    const searchPattern = `%${stationName}%`;
    const rows = await dbService.all(
      `SELECT * FROM stations 
       WHERE name LIKE ? OR pinyin LIKE ? OR short_pinyin LIKE ? 
       ORDER BY name LIMIT 10`,
      [searchPattern, searchPattern, searchPattern]
    );
    
    return {
      valid: false,
      error: 'Cannot match the departure/arrival location',
      suggestions: rows || []
    };
  } catch (err) {
    logger.error('Failed to validate station', { error: err });
    throw err;
  }
}

/**
 * Get all supported cities list
 */
async function getAllCities() {
  return cityStationMapping.getAllCities();
}

/**
 * Get all stations for a city
 * @param {string} cityName - City name
 * @returns {string[]} List of stations
 */
async function getStationsByCity(cityName) {
  return cityStationMapping.getStationsByCity(cityName);
}

/**
 * Validate city name
 * @param {string} cityName - City name
 * @returns {Object} Validation result
 */
async function validateCity(cityName) {
  if (!cityName) {
    return { valid: false, error: 'City name cannot be empty', suggestions: [] };
  }
  
  const isValid = cityStationMapping.isCityValid(cityName);
  
  if (isValid) {
    const stations = cityStationMapping.getStationsByCity(cityName);
    return { valid: true, city: cityName, stations };
  }
  
  // City invalid, provide all cities as suggestions
  const allCities = cityStationMapping.getAllCities();
  return {
    valid: false,
    error: 'Cannot match the city',
    suggestions: allCities
  };
}

/**
 * Reverse lookup city by station name
 * @param {string} stationName - Station name
 * @returns {string|null} City name
 */
async function getCityByStation(stationName) {
  return cityStationMapping.getCityByStation(stationName);
}

module.exports = {
  getAllStations,
  searchStations,
  validateStation,
  getAllCities,
  getStationsByCity,
  validateCity,
  getCityByStation
};

