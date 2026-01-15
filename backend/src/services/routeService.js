const dbService = require('./dbService');
const logger = require('../utils/logger');

class RouteService {
  /**
   * Get all intervals between departure and arrival stations for a train
   * @param {string} trainNo Train number
   * @param {string} departureStation Departure station
   * @param {string} arrivalStation Arrival station
   * @returns {Promise<Array<{from: string, to: string}>>} List of intervals
   */
  async getStationIntervals(trainNo, departureStation, arrivalStation) {
    // 1. Query all stops for this train (ordered by sequence)
    const stops = await dbService.all(
      'SELECT station, seq FROM train_stops WHERE train_no = ? ORDER BY seq',
      [trainNo]
    );

    if (!stops || stops.length === 0) {
      throw { status: 404, message: 'Stop information not found for this train' };
    }

    // 2. Find indices of departure and arrival stations
    const depIndex = stops.findIndex(s => s.station === departureStation);
    const arrIndex = stops.findIndex(s => s.station === arrivalStation);

    if (depIndex === -1 || arrIndex === -1) {
      const errorMsg = depIndex === -1 ? `Departure station "${departureStation}" is not in the train's stops` : `Arrival station "${arrivalStation}" is not in the train's stops`;
      throw { status: 400, message: errorMsg };
    }

    if (depIndex >= arrIndex) {
      throw { status: 400, message: 'Departure station must be before arrival station' };
    }

    // 3. Extract all adjacent intervals
    const intervals = [];
    for (let i = depIndex; i < arrIndex; i++) {
      intervals.push({
        from: stops[i].station,
        to: stops[i + 1].station
      });
    }

    return intervals;
  }

  /**
   * Calculate cross-interval fare
   * @param {string} trainNo Train number
   * @param {Array} intervals List of intervals
   * @returns {Promise<Object>} Fare information
   */
  async calculateFare(trainNo, intervals) {
    let totalDistance = 0;
    const fareTypes = {
      second_class_price: 0,
      first_class_price: 0,
      business_price: 0,
      hard_sleeper_price: 0,
      soft_sleeper_price: 0
    };

    for (const interval of intervals) {
      const fareRow = await dbService.get(
        `SELECT distance_km, second_class_price, first_class_price, business_price,
                hard_sleeper_price, soft_sleeper_price
         FROM train_fares
         WHERE train_no = ? AND from_station = ? AND to_station = ?`,
        [trainNo, interval.from, interval.to]
      );

      if (!fareRow) {
        // If fare info is missing for a segment, it might mean data is missing or segment is not sellable
        // We choose to throw error here for robustness
        throw { 
          status: 404, 
          message: `Fare information not found for interval ${interval.from}->${interval.to}` 
        };
      }

      totalDistance += fareRow.distance_km || 0;
      Object.keys(fareTypes).forEach(key => {
        if (fareRow[key]) {
          fareTypes[key] += fareRow[key];
        }
      });
    }

    return {
      distance_km: totalDistance,
      ...fareTypes
    };
  }

  /**
   * Calculate available seats for each seat type
   * @param {string} trainNo Train number
   * @param {string} departureDate Departure date
   * @param {Array} intervals List of intervals
   * @returns {Promise<Object>} Available seats count per type { '二等座': 10, ... }
   */
  async calculateAvailableSeats(trainNo, departureDate, intervals) {
    const seatTypes = ['商务座', '一等座', '二等座', '硬卧', '软卧', '硬座', '无座'];
    const result = {};

    // Build query conditions: check all intervals
    const segmentConditions = intervals.map(() => 
      '(from_station = ? AND to_station = ?)'
    ).join(' OR ');
    
    const segmentParams = intervals.flatMap(s => [s.from, s.to]);
    const intervalCount = intervals.length;

    // Parallel query for all seat types
    await Promise.all(seatTypes.map(async (seatType) => {
      try {
        // Core logic: Find count of seats that are 'available' in all specified intervals
        // 1. Filter all seat records for specified train, date, and seat type
        // 2. Filter records belonging to target intervals
        // 3. Filter records with status 'available'
        // 4. Group by seat number
        // 5. Count available records per seat number; if equal to interval count, the seat is available for the full journey
        const row = await dbService.get(
          `SELECT COUNT(*) as count
           FROM (
             SELECT seat_no
             FROM seat_status
             WHERE train_no = ?
             AND departure_date = ?
             AND seat_type = ?
             AND (${segmentConditions})
             AND status = 'available'
             GROUP BY seat_no
             HAVING COUNT(*) = ?
           )`,
          [
            trainNo, departureDate, seatType, ...segmentParams,
            intervalCount
          ]
        );
        
        result[seatType] = row ? row.count : 0;
      } catch (err) {
        logger.error(`Query error for ${seatType}`, { error: err });
        result[seatType] = 0;
      }
    }));

    return result;
  }
}

module.exports = new RouteService();
