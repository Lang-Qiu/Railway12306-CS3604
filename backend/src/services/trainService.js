const dbService = require('./dbService');
const stationService = require('./stationService');
const routeService = require('./routeService');
const logger = require('../utils/logger');

/**
 * Train Service
 */

/**
 * Search for trains
 * Supports filtering by train type, returns only direct trains
 * Adds date filtering, returns only trains on specified date, filters expired trains
 * Supports city-level search: queries all stations in the city when a city name is provided
 */
async function searchTrains(departureCityOrStation, arrivalCityOrStation, departureDate, trainTypes = []) {
  try {
    // Ensure departureDate is a valid date
    if (!departureDate) {
      departureDate = new Date().toISOString().split('T')[0];
    }
    
    logger.info('trainService.searchTrains called', { 
      departureCityOrStation, 
      arrivalCityOrStation, 
      departureDate, 
      trainTypes 
    });
    
    // Get departure station list (prioritize city check)
    let departureStations = [];
    // Try to get station list by city name first
    departureStations = await stationService.getStationsByCity(departureCityOrStation);
    if (departureStations.length === 0) {
      // Not a city name, try as station name
      const depCity = await stationService.getCityByStation(departureCityOrStation);
      if (depCity) {
        // Is a station name, get all stations in that city
        departureStations = await stationService.getStationsByCity(depCity);
      } else {
        // Neither city nor station, return empty result
        logger.warn('Invalid departure location', { location: departureCityOrStation });
        return [];
      }
    }
    
    // Get arrival station list (prioritize city check)
    let arrivalStations = [];
    // Try to get station list by city name first
    arrivalStations = await stationService.getStationsByCity(arrivalCityOrStation);
    if (arrivalStations.length === 0) {
      // Not a city name, try as station name
      const arrCity = await stationService.getCityByStation(arrivalCityOrStation);
      if (arrCity) {
        // Is a station name, get all stations in that city
        arrivalStations = await stationService.getStationsByCity(arrCity);
      } else {
        // Neither city nor station, return empty result
        logger.warn('Invalid arrival location', { location: arrivalCityOrStation });
        return [];
      }
    }
    
    logger.debug('Departure stations list', { stations: departureStations });
    logger.debug('Arrival stations list', { stations: arrivalStations });
    
    // Build SQL query, use IN clause to match multiple stations
    const depPlaceholders = departureStations.map(() => '?').join(',');
    const arrPlaceholders = arrivalStations.map(() => '?').join(',');
    
    let sql = `
      SELECT DISTINCT t.* 
      FROM trains t
      WHERE EXISTS (
        SELECT 1 FROM train_stops WHERE train_no = t.train_no AND station IN (${depPlaceholders})
      )
      AND EXISTS (
        SELECT 1 FROM train_stops WHERE train_no = t.train_no AND station IN (${arrPlaceholders})
      )
      AND is_direct = 1
      AND t.departure_date = ?
      AND t.departure_date >= DATE('now', 'localtime')
    `;
    
    const params = [
      ...departureStations,
      ...arrivalStations,
      departureDate
    ];
    
    // If train type filter provided
    if (trainTypes && trainTypes.length > 0) {
      const typePlaceholders = trainTypes.map(() => '?').join(',');
      sql += ` AND SUBSTR(t.train_no, 1, 1) IN (${typePlaceholders})`;
      params.push(...trainTypes);
    }
    
    sql += ' ORDER BY t.departure_time';
    
    logger.debug('Executing SQL query', { sql: sql.substring(0, 200) + '...', params });
    
    const rows = await dbService.all(sql, params);
    
    logger.info(`SQL query returned ${rows.length} raw records`);
    
    if (rows.length === 0) {
      logger.info('No matching trains found');
      return [];
    }
    
    // Use Promise.all to process all trains in parallel
    const trainPromises = rows.map(async (train) => {
      try {
        // Get all stops for this train
        const stops = await dbService.all(
          'SELECT * FROM train_stops WHERE train_no = ? ORDER BY seq',
          [train.train_no]
        );

        if (!stops || stops.length < 2) {
          logger.warn(`Skipping train ${train.train_no}: Incomplete stop information`);
          return null;
        }
        
        // Find matching departure and arrival stops
        const depStop = stops.find(s => departureStations.includes(s.station));
        const arrStop = stops.find(s => arrivalStations.includes(s.station));
        
        if (!depStop || !arrStop || depStop.seq >= arrStop.seq) {
          logger.debug(`Skipping train ${train.train_no}: Station mismatch or invalid sequence`, {
            trainNo: train.train_no,
            depStop: depStop?.station,
            arrStop: arrStop?.station
          });
          return null;
        }
        
        // If it's today's train, check if departure time has passed
        const today = new Date().toISOString().split('T')[0];
        if (departureDate === today) {
          const now = new Date();
          const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
          
          if (depStop.depart_time < currentTime) {
            logger.debug(`Skipping train ${train.train_no}: Departure time ${depStop.depart_time} has passed (Current: ${currentTime})`);
            return null;
          }
        }
        
        // Build interval list for calculating available seats (Optimization: avoid re-querying DB)
        const relevantStops = stops.filter(s => s.seq >= depStop.seq && s.seq <= arrStop.seq);
        const intervals = [];
        for (let i = 0; i < relevantStops.length - 1; i++) {
          intervals.push({
            from: relevantStops[i].station,
            to: relevantStops[i + 1].station
          });
        }

        // Calculate available seats
        const availableSeats = await routeService.calculateAvailableSeats(
          train.train_no, 
          departureDate,
          intervals
        );
        
        return {
          trainNo: train.train_no,
          trainType: train.train_type,
          model: train.model,
          departureStation: depStop.station,  // Use actual station name
          arrivalStation: arrStop.station,    // Use actual station name
          departureTime: depStop.depart_time,
          arrivalTime: arrStop.arrive_time,
          duration: calculateDuration(depStop.depart_time, arrStop.arrive_time),
          departureDate: departureDate,
          availableSeats: availableSeats
        };
      } catch (error) {
        logger.error(`Error processing train ${train.train_no}`, { error });
        return null;
      }
    });
    
    const results = await Promise.all(trainPromises);
    // Filter out null values
    const trainsWithDetails = results.filter(train => train !== null);
    logger.info(`Returning ${trainsWithDetails.length} trains`);
    return trainsWithDetails;

  } catch (error) {
    logger.error('searchTrains error', { error });
    throw error;
  }
}

/**
 * Get train details
 * Adds date parameter
 */
async function getTrainDetails(trainNo, departureDate) {
  try {
    // Ensure departureDate is a valid date
    if (!departureDate) {
      departureDate = new Date().toISOString().split('T')[0];
    }
    
    const train = await dbService.get('SELECT * FROM trains WHERE train_no = ? AND departure_date = ?', [trainNo, departureDate]);
    
    if (!train) {
      return null;
    }
    
    // Get stop information
    const stops = await dbService.all(
      'SELECT * FROM train_stops WHERE train_no = ? ORDER BY seq',
      [trainNo]
    );
        
    // Get car configuration
    const cars = await dbService.all(
      'SELECT * FROM train_cars WHERE train_no = ? ORDER BY car_no',
      [trainNo]
    );
            
    // Get fare information
    const fares = await dbService.all(
      'SELECT * FROM train_fares WHERE train_no = ?',
      [trainNo]
    );
    
    // Calculate available seats (full route)
    let availableSeats = {};
    if (stops && stops.length >= 2) {
      const intervals = [];
      for (let i = 0; i < stops.length - 1; i++) {
        intervals.push({
          from: stops[i].station,
          to: stops[i + 1].station
        });
      }
      
      availableSeats = await routeService.calculateAvailableSeats(
        trainNo, 
        departureDate,
        intervals
      );
    }
    
    return {
      trainNo: train.train_no,
      trainType: train.train_type,
      model: train.model,
      departureDate: train.departure_date,
      route: {
        origin: train.origin_station,
        destination: train.destination_station,
        distanceKm: train.distance_km,
        plannedDurationMin: train.planned_duration_min,
        departureTime: train.departure_time,
        arrivalTime: train.arrival_time
      },
      stops: stops,
      cars: cars,
      fares: fares,
      availableSeats: availableSeats
    };
  } catch (error) {
    logger.error('Failed to get train details', { error });
    throw error;
  }
}

/**
 * Calculate available seats
 * Compatible with old interface, calls routeService internally
 */
async function calculateAvailableSeats(trainNo, departureStation, arrivalStation, departureDate) {
  try {
    const intervals = await routeService.getStationIntervals(trainNo, departureStation, arrivalStation);
    return await routeService.calculateAvailableSeats(trainNo, departureDate, intervals);
  } catch (error) {
    logger.error('calculateAvailableSeats error', { error });
    return {};
  }
}

/**
 * Get filter options
 * Returns all stations for departure and arrival cities (not just those with trains)
 */
async function getFilterOptions(departureCityOrStation, arrivalCityOrStation, departureDate) {
  return new Promise(async (resolve, reject) => {
    try {
      // Get departure station list
      let departureStations = [];
      const depCity = await stationService.getCityByStation(departureCityOrStation);
      if (depCity) {
        // Input is station name, get all stations in that city
        departureStations = await stationService.getStationsByCity(depCity);
      } else {
        // Input is city name, get all stations in that city
        departureStations = await stationService.getStationsByCity(departureCityOrStation);
      }
      
      // Get arrival station list
      let arrivalStations = [];
      const arrCity = await stationService.getCityByStation(arrivalCityOrStation);
      if (arrCity) {
        // Input is station name, get all stations in that city
        arrivalStations = await stationService.getStationsByCity(arrCity);
      } else {
        // Input is city name, get all stations in that city
        arrivalStations = await stationService.getStationsByCity(arrivalCityOrStation);
      }
      
      // Search for matching trains first, to get seat types
      const trains = await searchTrains(departureCityOrStation, arrivalCityOrStation, departureDate);
      
      // Extract seat types from train list
      const seatTypesSet = new Set();
      trains.forEach(train => {
        if (train.availableSeats) {
          Object.keys(train.availableSeats).forEach(seatType => {
            seatTypesSet.add(seatType);
          });
        }
      });
      
      resolve({
        departureStations: departureStations,
        arrivalStations: arrivalStations,
        seatTypes: Array.from(seatTypesSet)
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Get available dates
 * Returns 14 dates starting from today (including today)
 */
async function getAvailableDates() {
  const dates = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  return dates;
}

/**
 * Calculate duration (minutes)
 */
function calculateDuration(departureTime, arrivalTime) {
  const [depHour, depMin] = departureTime.split(':').map(Number);
  const [arrHour, arrMin] = arrivalTime.split(':').map(Number);
  
  let duration = (arrHour * 60 + arrMin) - (depHour * 60 + depMin);
  
  // Handle cross-day cases
  if (duration < 0) {
    duration += 24 * 60;
  }
  
  return duration;
}

/**
 * Get train time details at specific stations
 */
async function getTrainTimeDetails(trainNo, departureStation, arrivalStation) {
  try {
    logger.info(`getTrainTimeDetails called for ${trainNo}: ${departureStation} -> ${arrivalStation}`);
    
    // Query train stop information
    const stops = await dbService.all(
      'SELECT * FROM train_stops WHERE train_no = ? ORDER BY seq',
      [trainNo]
    );
    
    if (!stops || stops.length === 0) {
      logger.warn(`getTrainTimeDetails: No stops found for ${trainNo}`);
      return null;
    }
    
    // Find departure and arrival stops
    const depStop = stops.find(s => s.station === departureStation);
    const arrStop = stops.find(s => s.station === arrivalStation);
    
    if (!depStop || !arrStop) {
      logger.warn(`getTrainTimeDetails: Station mismatch for ${trainNo}. Expected ${departureStation}->${arrivalStation}.`, {
        stops: stops.map(s => s.station)
      });
      return null;
    }
    
    return {
      departureTime: depStop.depart_time,
      arrivalTime: arrStop.arrive_time
    };
  } catch (err) {
    logger.error('Failed to query train stop details', { error: err });
    throw err;
  }
}

module.exports = {
  searchTrains,
  getTrainDetails,
  calculateAvailableSeats,
  getFilterOptions,
  getAvailableDates,
  getTrainTimeDetails
};
