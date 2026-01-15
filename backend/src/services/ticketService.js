const { v4: uuidv4 } = require('uuid');
const dbService = require('./dbService');
const routeService = require('./routeService');
const logger = require('../utils/logger');

/**
 * Ticket Service
 */

/**
 * Reserve ticket
 * Supports cross-interval seat reservation, correctly handles date filtering
 */
async function reserveTicket(trainNo, departureStation, arrivalStation, departureDate, seatType, passengerId, userId) {
  try {
    // Step 1: Get all stations and intervals between departure and arrival stations
    const segments = await routeService.getStationIntervals(trainNo, departureStation, arrivalStation);
    
    // Step 2: Get all seats for this seat type (including date filtering)
    const allSeats = await dbService.all(
      `SELECT DISTINCT seat_no 
       FROM seat_status 
       WHERE train_no = ? 
       AND departure_date = ?
       AND seat_type = ?`,
      [trainNo, departureDate, seatType]
    );
    
    if (!allSeats || allSeats.length === 0) {
      return { success: false, error: 'Too slow! Tickets for this train are sold out!' };
    }
    
    // Step 3: Find the first seat that is available in all intervals
    let selectedSeatNo = null;
    
    const segmentConditions = segments.map(() => 
      '(from_station = ? AND to_station = ?)'
    ).join(' OR ');
    
    const segmentParams = segments.flatMap(s => [s.from, s.to]);
    
    for (const seat of allSeats) {
      // Check if this seat is available in all intervals
      const seatStatuses = await dbService.all(
        `SELECT status 
         FROM seat_status 
         WHERE train_no = ? 
         AND departure_date = ?
         AND seat_type = ? 
         AND seat_no = ? 
         AND (${segmentConditions})`,
        [trainNo, departureDate, seatType, seat.seat_no, ...segmentParams]
      );
      
      // Check if available in all intervals
      if (seatStatuses.length === segments.length) {
        const allAvailable = seatStatuses.every(s => s.status === 'available');
        if (allAvailable) {
          selectedSeatNo = seat.seat_no;
          break;
        }
      }
    }
    
    if (!selectedSeatNo) {
      return { success: false, error: 'Too slow! Tickets for this train are sold out!' };
    }
    
    // Step 4: Update seat status to booked for all intervals
    const orderId = uuidv4();
    
    // Use transaction to ensure atomicity
    await dbService.transaction(async (tx) => {
      for (const segment of segments) {
        await tx.run(
          `UPDATE seat_status 
           SET status = 'booked', booked_by = ?, booked_at = datetime('now')
           WHERE train_no = ? 
           AND departure_date = ?
           AND seat_type = ? 
           AND seat_no = ? 
           AND from_station = ? 
           AND to_station = ?`,
          [userId || passengerId, trainNo, departureDate, seatType, selectedSeatNo, segment.from, segment.to]
        );
      }
    });
    
    return { 
      success: true, 
      orderId: orderId,
      seatNo: selectedSeatNo
    };
    
  } catch (error) {
    logger.error('Failed to reserve ticket', { error });
    throw error;
  }
}

/**
 * Check departure time
 */
function checkDepartureTime(departureDate, departureTime) {
  try {
    const now = new Date();
    const [hours, minutes] = departureTime.split(':');
    const departureDateTime = new Date(departureDate);
    departureDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    const timeDiff = departureDateTime.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    if (hoursDiff < 3 && hoursDiff > 0) {
      return {
        isNearDeparture: true,
        message: 'The train you selected is about to depart. It takes about 20 minutes to enter the station. Please ensure you have enough time for security check, real-name verification, and ticket checking to avoid delaying your trip.'
      };
    }
    
    return { isNearDeparture: false, message: '' };
  } catch (error) {
    logger.error('Failed to check departure time', { error });
    return { isNearDeparture: false, message: '' };
  }
}

/**
 * Check if query expired
 */
function checkQueryExpired(queryTimestamp) {
  try {
    const now = Date.now();
    const queryTime = new Date(queryTimestamp).getTime();
    const diff = now - queryTime;
    
    // 5 minutes = 5 * 60 * 1000 ms
    return diff > 5 * 60 * 1000;
  } catch (error) {
    logger.error('Failed to check query expiration', { error });
    return false;
  }
}

module.exports = {
  reserveTicket,
  checkDepartureTime,
  checkQueryExpired
};
