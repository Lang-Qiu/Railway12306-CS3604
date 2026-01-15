const path = require('path');
const crypto = require('crypto');
const dbService = require('./dbService');
const routeService = require('./routeService');
const trainService = require('./trainService');
const logger = require('../utils/logger');

// Generate UUID v4
function uuidv4() {
  return crypto.randomUUID();
}

/**
 * Order Service
 */

/**
 * Get order filling page data
 */
async function getOrderPageData(params) {
  const { trainNo, departureStation, arrivalStation, departureDate, userId } = params;
  
  // Validate parameters
  if (!trainNo || !departureStation || !arrivalStation || !departureDate) {
    throw { status: 400, message: 'Invalid parameters' };
  }
  
  // TODO: Get train info, fares, available seats, passenger list, default seat type
  return {
    trainInfo: {},
    fareInfo: {},
    availableSeats: {},
    passengers: [],
    defaultSeatType: '二等座'
  };
}

/**
 * Get default seat type
 * G/C/D trains default to Second Class (二等座)
 */
async function getDefaultSeatType(trainNo) {
  const firstChar = trainNo.charAt(0);
  
  try {
    const train = await dbService.get(
      'SELECT * FROM trains WHERE train_no = ?',
      [trainNo]
    );
    
    if (!train) {
      throw { status: 404, message: 'Train does not exist' };
    }
    
    // Determine default seat type based on train type
    let defaultSeatType = '硬座';
    if (firstChar === 'G' || firstChar === 'C' || firstChar === 'D') {
      defaultSeatType = '二等座';
    }
    
    return {
      seatType: defaultSeatType,
      price: 0  // Price needs to be queried based on specific interval
    };
  } catch (error) {
    if (error.status) throw error;
    throw { status: 500, message: 'Database query failed' };
  }
}

/**
 * Get available seat types list
 * Supports cross-interval fare calculation
 */
async function getAvailableSeatTypes(params) {
  const { trainNo, departureStation, arrivalStation, departureDate } = params;
  
  try {
    // Step 1: Calculate cross-interval fare (automatically accumulate intermediate intervals)
    const intervals = await routeService.getStationIntervals(trainNo, departureStation, arrivalStation);
    const fareData = await routeService.calculateFare(trainNo, intervals);
    
    // Step 2: Use trainService.calculateAvailableSeats to get correct seat availability
    const availableSeats = await trainService.calculateAvailableSeats(
      trainNo,
      departureStation,
      arrivalStation,
      departureDate
    );
    
    // Step 3: Build seat type list (only return seat types with tickets)
    const seatTypeMap = {
      '二等座': fareData.second_class_price,
      '一等座': fareData.first_class_price,
      '商务座': fareData.business_price,
      '硬卧': fareData.hard_sleeper_price,
      '软卧': fareData.soft_sleeper_price
    };
    
    const availableSeatTypes = [];
    
    // Iterate through all seat types
    for (const [seatType, price] of Object.entries(seatTypeMap)) {
      // Only add seat types with price and availability
      if (price !== null && price !== undefined && price > 0) {
        const available = availableSeats[seatType] || 0;
        if (available > 0) {
          availableSeatTypes.push({
            seat_type: seatType,
            available: available,
            price: price
          });
        }
      }
    }
    
    return availableSeatTypes;
  } catch (error) {
    throw error;
  }
}

/**
 * Create order
 */
async function createOrder(orderData) {
  const { userId, trainNo, departureStation, arrivalStation, departureDate, passengers } = orderData;
  
  // Validate at least one passenger selected
  if (!passengers || passengers.length === 0) {
    throw { status: 400, message: 'Please select passengers!' };
  }
  
  const orderId = uuidv4();
  
  return dbService.transaction(async (tx) => {
    try {
      // Query train info
      const train = await tx.get(
        'SELECT * FROM trains WHERE train_no = ? AND departure_date = ?',
        [trainNo, departureDate]
      );
      
      if (!train) {
        throw { status: 404, message: 'Train does not exist' };
      }
      
      // Get fare info (use cross-interval fare calculation)
      const intervals = await routeService.getStationIntervals(trainNo, departureStation, arrivalStation);
      const fareData = await routeService.calculateFare(trainNo, intervals);
      
      const fareRow = {
        second_class_price: fareData.second_class_price,
        first_class_price: fareData.first_class_price,
        business_price: fareData.business_price,
        hard_sleeper_price: fareData.hard_sleeper_price,
        soft_sleeper_price: fareData.soft_sleeper_price
      };
      
      // Calculate price for each passenger's seat type
      const getPriceForSeatType = (seatType) => {
        if (seatType === '二等座') {
          return fareRow.second_class_price;
        } else if (seatType === '一等座') {
          return fareRow.first_class_price;
        } else if (seatType === '商务座') {
          return fareRow.business_price;
        } else if (seatType === '硬卧') {
          return fareRow.hard_sleeper_price;
        } else if (seatType === '软卧') {
          return fareRow.soft_sleeper_price;
        } else {
          return fareRow.second_class_price; // Default to second class price
        }
      };
      
      // Calculate total price: sum of each passenger's fare
      let totalPrice = 0;
      for (const p of passengers) {
        const price = getPriceForSeatType(p.seatType);
        if (!price) {
          throw { status: 400, message: `Seat type "${p.seatType}" not supported` };
        }
        totalPrice += price;
      }
      
      // Get passenger info
      const passengerIds = passengers.map(p => p.passengerId).join("','");
      const passengerRecords = await tx.all(
        `SELECT * FROM passengers WHERE id IN ('${passengerIds}')`
      );
      
      // Validate all passengers exist
      if (!passengerRecords || passengerRecords.length !== passengers.length) {
        throw { status: 400, message: 'Some passenger information not found, please reselect passengers' };
      }
      
      // Validate each passenger ID can be found
      for (const p of passengers) {
        const passenger = passengerRecords.find(pr => pr.id === p.passengerId);
        if (!passenger) {
          throw { status: 400, message: `Passenger ${p.passengerId} does not exist` };
        }
      }
      
      // Create order
      await tx.run(
        `INSERT INTO orders (id, user_id, train_number, departure_station, arrival_station, 
         departure_date, departure_time, arrival_time, total_price, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'))`,
        [orderId, String(userId), trainNo, departureStation, arrivalStation, departureDate,
         train.departure_time, train.arrival_time, totalPrice]
      );
      
      // Create order details
      for (const [index, p] of passengers.entries()) {
        const passenger = passengerRecords.find(pr => pr.id === p.passengerId);
        // Calculate price for each passenger's seat type
        const passengerPrice = getPriceForSeatType(p.seatType);
        
        await tx.run(
          `INSERT INTO order_details (order_id, passenger_id, passenger_name, 
           id_card_type, id_card_number, seat_type, ticket_type, price, sequence_number)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [orderId, p.passengerId, passenger.name, passenger.id_card_type, 
           passenger.id_card_number, p.seatType, p.ticketType || '成人票', 
           passengerPrice, index + 1]
        );
      }
      
      return {
        message: 'Order submitted successfully',
        orderId,
        orderDetails: {
          trainInfo: {
            trainNo,
            departureStation,
            arrivalStation,
            departureDate
          },
          passengers,
          totalPrice
        }
      };
    } catch (error) {
      if (error.status) throw error;
      throw { status: 500, message: error.message || 'Failed to create order' };
    }
  });
}

/**
 * Get order details
 */
async function getOrderDetails(orderId, userId) {
  try {
    // Query basic order info
    const order = await dbService.get(
      'SELECT * FROM orders WHERE id = ?',
      [orderId]
    );
    
    if (!order) {
      throw { status: 404, message: 'Order does not exist' };
    }
    
    // Debug log: Check userId match
    logger.debug('Order permission check', {
      orderId,
      order_user_id: order.user_id,
      order_user_id_type: typeof order.user_id,
      requested_userId: userId,
      requested_userId_type: typeof userId,
      match: order.user_id === userId,
      string_match: String(order.user_id) === String(userId)
    });
    
    // Compatible with userId type difference (string vs number)
    if (String(order.user_id) !== String(userId)) {
      throw { status: 403, message: 'Unauthorized to access this order' };
    }
    
    // Query order details
    const details = await dbService.all(
      'SELECT * FROM order_details WHERE order_id = ?',
      [orderId]
    );
    
    // Get passenger points
    const passengerIds = details.map(d => d.passenger_id);
    let passengerPoints = [];
    if (passengerIds.length > 0) {
      passengerPoints = await dbService.all(
        `SELECT id, points FROM passengers WHERE id IN ('${passengerIds.join("','")}')`
      );
    }
    
    const passengers = details.map(d => {
      const points = passengerPoints.find(p => p.id === d.passenger_id);
      return {
        sequence: d.sequence_number,
        seatType: d.seat_type,
        ticketType: d.ticket_type,
        name: d.passenger_name,
        idCardType: d.id_card_type,
        idCardNumber: d.id_card_number,
        carNumber: d.car_number,
        seatNumber: d.seat_number,
        price: d.price,
        points: points ? points.points : 0
      };
    });
    
    // Get real-time available seats info
    const trainService = require('./trainService');
    let availableSeats = {};
    try {
      availableSeats = await trainService.calculateAvailableSeats(
        order.train_number,
        order.departure_station,
        order.arrival_station,
        order.departure_date
      );
    } catch (err) {
      logger.error('Failed to get available seats info', { error: err });
    }
    
    return {
      trainInfo: {
        trainNo: order.train_number,
        departureStation: order.departure_station,
        arrivalStation: order.arrival_station,
        departureDate: order.departure_date,
        departureTime: order.departure_time,
        arrivalTime: order.arrival_time
      },
      passengers,
      availableSeats,
      totalPrice: order.total_price
    };
  } catch (error) {
    if (error.status) throw error;
    throw { status: 500, message: 'Failed to query order details' };
  }
}

/**
 * Confirm order
 * Allocate seats and update seat status to booked
 */
async function confirmOrder(orderId, userId) {
  return dbService.transaction(async (tx) => {
    // 1. Get Order
    const order = await tx.get(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [orderId, String(userId)]
    );
    
    if (!order) throw { status: 404, message: 'Order does not exist' };
    if (order.status !== 'pending') throw { status: 400, message: 'Invalid order status' };
    
    // 2. Check Cancellation Limit
    const today = new Date().toISOString().split('T')[0];
    const cancelResult = await tx.get(
      `SELECT COUNT(*) as count FROM order_cancellations 
       WHERE user_id = ? AND cancellation_date = ?`,
      [String(userId), today]
    );
    
    if (cancelResult && cancelResult.count >= 3) {
      throw { status: 403, message: 'Daily cancellation limit exceeded', code: 'CANCELLATION_LIMIT_EXCEEDED' };
    }
    
    // 3. Get Details
    const details = await tx.all('SELECT * FROM order_details WHERE order_id = ?', [orderId]);
    if (!details || details.length === 0) throw { status: 400, message: 'Order details are empty' };
    
    // 4. Pre-check Seats
    // Get segments
    const segments = await routeService.getStationIntervals(order.train_number, order.departure_station, order.arrival_station);
    
    const seatTypeRequirements = {};
    for (const detail of details) {
      seatTypeRequirements[detail.seat_type] = (seatTypeRequirements[detail.seat_type] || 0) + 1;
    }
    
    const segmentConditions = segments.map(() => '(from_station = ? AND to_station = ?)').join(' OR ');
    const segmentParams = segments.flatMap(s => [s.from, s.to]);
    
    for (const [seatType, requiredCount] of Object.entries(seatTypeRequirements)) {
      const allSeats = await tx.all(
        `SELECT DISTINCT car_no, seat_no 
         FROM seat_status 
         WHERE train_no = ? AND departure_date = ? AND seat_type = ?`,
        [order.train_number, order.departure_date, seatType]
      );
      
      if (!allSeats || allSeats.length === 0) throw { status: 400, message: `Seat type ${seatType} does not exist` };
      
      let availableCount = 0;
      for (const seat of allSeats) {
        const seatStatuses = await tx.all(
          `SELECT status FROM seat_status 
           WHERE train_no = ? AND departure_date = ? AND seat_type = ? AND seat_no = ? 
           AND (${segmentConditions})`,
          [order.train_number, order.departure_date, seatType, seat.seat_no, ...segmentParams]
        );
        
        if (seatStatuses.length === segments.length && seatStatuses.every(s => s.status === 'available')) {
          availableCount++;
        }
      }
      
      if (availableCount < requiredCount) {
        throw { status: 400, message: `Insufficient tickets for ${seatType}, needed ${requiredCount}, remaining ${availableCount}` };
      }
    }
    
    // 5. Allocate Seats
    const ticketInfo = [];
    
    for (const detail of details) {
      const allSeats = await tx.all(
        `SELECT DISTINCT car_no, seat_no FROM seat_status 
         WHERE train_no = ? AND departure_date = ? AND seat_type = ?`,
        [order.train_number, order.departure_date, detail.seat_type]
      );
      
      let selectedSeatNo = null;
      let selectedCarNo = null;
      
      for (const seat of allSeats) {
        // Check if this seat is already taken by previous iteration in this transaction?
        // Wait, seat_status is not updated yet. 
        // We need to keep track of allocated seats in this transaction scope if we don't update DB immediately.
        // But here we update DB immediately inside the loop.
        // SQLite: "Reads and writes within the same transaction see the effects of prior writes in that same transaction." -> So it works.
        
        const seatStatuses = await tx.all(
          `SELECT status FROM seat_status 
           WHERE train_no = ? AND departure_date = ? AND seat_type = ? AND seat_no = ? 
           AND (${segmentConditions})`,
          [order.train_number, order.departure_date, detail.seat_type, seat.seat_no, ...segmentParams]
        );
        
        if (seatStatuses.length === segments.length && seatStatuses.every(s => s.status === 'available')) {
          selectedSeatNo = seat.seat_no;
          selectedCarNo = seat.car_no;
          break;
        }
      }
      
      if (!selectedSeatNo) throw { status: 400, message: `${detail.seat_type} sold out` };
      
      // Update seat status
      for (const segment of segments) {
        await tx.run(
          `UPDATE seat_status 
           SET status = 'booked', booked_by = ?, booked_at = datetime('now')
           WHERE train_no = ? AND departure_date = ? AND seat_type = ? AND seat_no = ? 
           AND from_station = ? AND to_station = ?`,
          [String(userId), order.train_number, order.departure_date, detail.seat_type, selectedSeatNo, segment.from, segment.to]
        );
      }
      
      // Update details
      await tx.run(
        'UPDATE order_details SET car_number = ?, seat_number = ? WHERE id = ?',
        [selectedCarNo, selectedSeatNo, detail.id]
      );
      
      ticketInfo.push({
        passengerName: detail.passenger_name,
        seatType: detail.seat_type,
        carNo: selectedCarNo,
        seatNo: selectedSeatNo,
        ticketType: detail.ticket_type
      });
    }
    
    // 6. Update Order
    await tx.run(
      "UPDATE orders SET status = 'confirmed_unpaid', payment_expires_at = datetime('now', '+20 minutes'), updated_at = datetime('now') WHERE id = ?",
      [orderId]
    );
    
    const orderInfo = await tx.get('SELECT payment_expires_at FROM orders WHERE id = ?', [orderId]);
    
    return {
      message: 'Order confirmed, please complete payment',
      orderId,
      status: 'confirmed_unpaid',
      paymentExpiresAt: orderInfo?.payment_expires_at,
      trainInfo: {
        trainNo: order.train_number,
        departureStation: order.departure_station,
        arrivalStation: order.arrival_station,
        departureDate: order.departure_date,
        departureTime: order.departure_time,
        arrivalTime: order.arrival_time
      },
      tickets: ticketInfo
    };
  });
}

/**
 * Update order status
 */
async function updateOrderStatus(orderId, status) {
  try {
    const result = await dbService.run(
      "UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?",
      [status, orderId]
    );
    
    if (result.changes === 0) {
      throw { status: 404, message: 'Order does not exist' };
    }
    
    return { success: true };
  } catch (error) {
    if (error.status) throw error;
    throw { status: 500, message: 'Failed to update order status' };
  }
}

/**
 * Lock seats
 */
async function lockSeats(orderId, passengers, trainNo, departureDate) {
  // TODO: Implement seat locking logic
  return Promise.resolve([]);
}


/**
 * Confirm seat allocation
 */
async function confirmSeatAllocation(orderId) {
  // TODO: Implement seat allocation confirmation logic
  return Promise.resolve({ success: true });
}

/**
 * Calculate order total price
 * Supports cross-interval fare calculation
 */
async function calculateOrderTotalPrice(passengers, trainNo, departureStation, arrivalStation) {
  try {
    // Use cross-interval fare calculation
    const intervals = await routeService.getStationIntervals(trainNo, departureStation, arrivalStation);
    const fareData = await routeService.calculateFare(trainNo, intervals);
    
    let totalPrice = 0;
    
    passengers.forEach(p => {
      let price = 0;
      if (p.seatType === '二等座') {
        price = fareData.second_class_price;
      } else if (p.seatType === '一等座') {
        price = fareData.first_class_price;
      } else if (p.seatType === '商务座') {
        price = fareData.business_price;
      } else if (p.seatType === '硬卧') {
        price = fareData.hard_sleeper_price;
      } else if (p.seatType === '软卧') {
        price = fareData.soft_sleeper_price;
      } else {
        price = fareData.second_class_price; // Default to second class price
      }
      
      totalPrice += price;
    });
    
    return totalPrice;
  } catch (error) {
    throw error;
  }
}

/**
 * Get payment page data
 */
async function getPaymentPageData(orderId, userId) {
  try {
    const order = await dbService.get(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [orderId, String(userId)]
    );
    
    if (!order) {
      throw { status: 404, message: 'Order does not exist' };
    }
    
    if (order.status !== 'confirmed_unpaid') {
      throw { status: 400, message: 'Invalid order status, cannot pay' };
    }
    
    // Check if order has expired
    if (order.payment_expires_at) {
      const result = await dbService.get(
        "SELECT datetime('now') > ? as is_expired",
        [order.payment_expires_at]
      );
      
      if (result && result.is_expired === 1) {
        throw { status: 400, message: 'Order expired' };
      }
    }
    
    // Query order details
    const details = await dbService.all(
      'SELECT * FROM order_details WHERE order_id = ? ORDER BY sequence_number',
      [orderId]
    );
    
    // Format order details
    const passengers = details.map(d => ({
      sequence: d.sequence_number,
      name: d.passenger_name,
      idCardType: d.id_card_type,
      idCardNumber: d.id_card_number,
      ticketType: d.ticket_type,
      seatType: d.seat_type,
      carNumber: d.car_number,
      seatNumber: d.seat_number,
      price: d.price
    }));
    
    return {
      orderId: order.id,
      trainInfo: {
        trainNo: order.train_number,
        departureStation: order.departure_station,
        arrivalStation: order.arrival_station,
        departureDate: order.departure_date,
        departureTime: order.departure_time,
        arrivalTime: order.arrival_time
      },
      passengers,
      totalPrice: order.total_price,
      paymentExpiresAt: order.payment_expires_at,
      createdAt: order.created_at
    };
  } catch (error) {
    if (error.status) throw error;
    throw { status: 500, message: 'Database query failed' };
  }
}

/**
 * Confirm payment
 */
async function confirmPayment(orderId, userId) {
  try {
    const order = await dbService.get(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [orderId, String(userId)]
    );
    
    if (!order) {
      throw { status: 404, message: 'Order does not exist' };
    }
    
    if (order.status !== 'confirmed_unpaid') {
      throw { status: 400, message: 'Invalid order status, cannot pay' };
    }
    
    // Check if order has expired
    if (order.payment_expires_at) {
      const result = await dbService.get(
        "SELECT datetime('now') > ? as is_expired",
        [order.payment_expires_at]
      );
      
      if (result && result.is_expired === 1) {
        throw { status: 400, message: 'Order expired, please book again' };
      }
    }
    
    // Update order status to paid
    await dbService.run(
      "UPDATE orders SET status = 'paid', updated_at = datetime('now') WHERE id = ?",
      [orderId]
    );
    
    // Query order details to get seat info
    const details = await dbService.all(
      'SELECT * FROM order_details WHERE order_id = ? ORDER BY sequence_number',
      [orderId]
    );
    
    // Generate order number (EA + 8 digits)
    const orderNumber = 'EA' + orderId.substring(0, 8).toUpperCase().replace(/-/g, '');
    
    return {
      message: 'Payment successful',
      orderId: order.id,
      orderNumber,
      status: 'paid',
      trainInfo: {
        trainNo: order.train_number,
        departureStation: order.departure_station,
        arrivalStation: order.arrival_station,
        departureDate: order.departure_date,
        departureTime: order.departure_time,
        arrivalTime: order.arrival_time
      },
      passengers: details.map(d => ({
        name: d.passenger_name,
        seatType: d.seat_type,
        carNumber: d.car_number,
        seatNumber: d.seat_number,
        ticketType: d.ticket_type,
        price: d.price
      })),
      totalPrice: order.total_price
    };
  } catch (error) {
    if (error.status) throw error;
    throw { status: 500, message: 'Payment failed' };
  }
}

/**
 * Cancel order and track cancellation count
 */
async function cancelOrderWithTracking(orderId, userId) {
  // Step 1: Validate order
  const order = await dbService.get(
    'SELECT * FROM orders WHERE id = ? AND user_id = ?',
    [orderId, String(userId)]
  );
  
  if (!order) {
    throw { status: 404, message: 'Order does not exist' };
  }
  
  if (order.status !== 'confirmed_unpaid') {
    throw { status: 400, message: 'Can only cancel unpaid orders' };
  }
  
  // Step 2: Release seat locks
  try {
    await releaseSeatLocks(orderId);
  } catch (error) {
    logger.error('Failed to release seat locks', { error });
    throw { status: 500, message: error.message || 'Failed to release seats' };
  }
  
  // Step 3 & 4: Record cancellation and Delete order (Atomic Transaction)
  try {
    await dbService.transaction(async (tx) => {
      const today = new Date().toISOString().split('T')[0];
      
      // Record cancellation
      await tx.run(
        `INSERT INTO order_cancellations (user_id, order_id, cancellation_date, cancelled_at)
         VALUES (?, ?, ?, datetime('now'))`,
        [String(userId), orderId, today]
      );
      
      // Delete order details
      await tx.run('DELETE FROM order_details WHERE order_id = ?', [orderId]);
      
      // Delete order
      await tx.run('DELETE FROM orders WHERE id = ?', [orderId]);
    });
    
    return { success: true, message: 'Order cancelled' };
  } catch (error) {
    logger.error('Order cancellation transaction failed', { error });
    // Even if recording/deleting fails, we might have already released seats. 
    // Ideally releaseSeatLocks should be in the same transaction if possible, 
    // but here we keep it separate as per original logic flow (sort of).
    // But original logic had them separate.
    throw { status: 500, message: 'Failed to cancel order' };
  }
}

/**
 * Check if user has unpaid orders
 */
async function hasUnpaidOrder(userId) {
  try {
    const order = await dbService.get(
      `SELECT id FROM orders 
       WHERE user_id = ? 
       AND status = 'confirmed_unpaid' 
       AND (payment_expires_at IS NULL OR datetime('now') <= payment_expires_at)`,
      [String(userId)]
    );
    
    return !!order;
  } catch (error) {
    throw { status: 500, message: 'Query failed' };
  }
}

/**
 * Get remaining payment time for order (seconds)
 */
async function getOrderTimeRemaining(orderId) {
  try {
    const result = await dbService.get(
      `SELECT 
        payment_expires_at,
        CASE 
          WHEN payment_expires_at IS NULL THEN 0
          WHEN datetime('now') > payment_expires_at THEN 0
          ELSE CAST((julianday(payment_expires_at) - julianday('now')) * 86400 AS INTEGER)
        END as remaining_seconds
       FROM orders WHERE id = ?`,
      [orderId]
    );
    
    if (!result || !result.payment_expires_at) {
      return 0;
    }
    
    return Math.max(0, result.remaining_seconds || 0);
  } catch (error) {
    throw { status: 500, message: 'Query failed' };
  }
}

/**
 * Release seat locks
 */
async function releaseSeatLocks(orderId) {
  try {
    const order = await dbService.get('SELECT * FROM orders WHERE id = ?', [orderId]);
    
    if (!order) {
      return { success: true };
    }
    
    const details = await dbService.all('SELECT * FROM order_details WHERE order_id = ?', [orderId]);
    
    // Get all intervals between departure and arrival stations
    const segments = await routeService.getStationIntervals(
      order.train_number, 
      order.departure_station, 
      order.arrival_station
    );
    
    // Release seat for each passenger
    // Loop updates can be done in Promise.all or transaction
    // Recommended sequential or transaction for safety
    for (const detail of details) {
      if (!detail.seat_number) continue;
      
      for (const segment of segments) {
        await dbService.run(
          `UPDATE seat_status 
           SET status = 'available', booked_by = NULL, booked_at = NULL
           WHERE train_no = ? 
           AND departure_date = ?
           AND seat_type = ? 
           AND seat_no = ? 
           AND from_station = ? 
           AND to_station = ?`,
          [order.train_number, order.departure_date, detail.seat_type, 
           detail.seat_number, segment.from, segment.to]
        );
      }
    }
    
    return { success: true };
  } catch (error) {
    throw { status: 500, message: error.message || 'Failed to release seats' };
  }
}

module.exports = {
  getOrderPageData,
  getDefaultSeatType,
  getAvailableSeatTypes,
  createOrder,
  getOrderDetails,
  confirmOrder,
  updateOrderStatus,
  lockSeats,
  releaseSeatLocks,
  confirmSeatAllocation,
  calculateOrderTotalPrice,
  getPaymentPageData,
  confirmPayment,
  cancelOrderWithTracking,
  hasUnpaidOrder,
  getOrderTimeRemaining
};