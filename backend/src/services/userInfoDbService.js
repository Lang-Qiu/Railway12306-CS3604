// User Info Database Service
// For personal information page features

const db = require('../database');
const logger = require('../utils/logger');

/**
 * Mask phone number
 * @param {string} phone - Original phone number
 * @returns {string} Masked phone number
 */
function maskPhone(phone) {
  if (!phone) return '';
  // Format: (+86)158****9968
  const phoneStr = phone.replace(/\D/g, ''); // Remove non-digit characters
  if (phoneStr.length === 11) {
    return `(+86)${phoneStr.substring(0, 3)}****${phoneStr.substring(7)}`;
  }
  return phone;
}

/**
 * Validate email format
 * @param {string} email - Email address
 * @returns {boolean} Is valid
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * DB-GetUserInfo: Get user's complete personal information
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User info object
 */
async function getUserInfo(userId) {
  try {
    const sql = `
      SELECT 
        id,
        username,
        name,
        '中国China' as country,
        COALESCE(id_card_type, '居民身份证') as idCardType,
        id_card_number as idCardNumber,
        '已通过' as verificationStatus,
        phone,
        email,
        COALESCE(discount_type, '成人') as discountType
      FROM users
      WHERE id = ?
    `;
    
    const user = await db.queryOne(sql, [userId]);
    
    if (!user) {
      return null;
    }
    
    // Mask phone number
    user.phone = maskPhone(user.phone);
    
    return {
      username: user.username,
      name: user.name,
      country: user.country,
      idCardType: user.idCardType,
      idCardNumber: user.idCardNumber,
      verificationStatus: user.verificationStatus,
      phone: user.phone,
      email: user.email || '',
      discountType: user.discountType
    };
  } catch (error) {
    logger.error('Failed to get user info', { error });
    throw error;
  }
}

/**
 * DB-UpdateUserEmail: Update user's email address
 * @param {string} userId - User ID
 * @param {string} email - New email address
 * @returns {Promise<boolean>} Returns true if successful
 */
async function updateUserEmail(userId, email) {
  try {
    // Validate email format
    if (!isValidEmail(email)) {
      throw new Error('Please enter a valid email address!');
    }
    
    const sql = `
      UPDATE users 
      SET email = ?, 
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    const result = await db.run(sql, [email, userId]);
    return result.changes > 0;
  } catch (error) {
    logger.error('Failed to update user email', { error });
    throw error;
  }
}

/**
 * DB-UpdateUserPhone: Update user's phone number
 * @param {string} userId - User ID
 * @param {string} phone - New phone number
 * @returns {Promise<boolean>} Returns true if successful
 */
async function updateUserPhone(userId, phone) {
  try {
    // Check if new phone number is already used by another user
    const checkSql = 'SELECT id FROM users WHERE phone = ? AND id != ?';
    const existingUser = await db.queryOne(checkSql, [phone, userId]);
    
    if (existingUser) {
      throw new Error('This phone number is already in use');
    }
    
    const sql = `
      UPDATE users 
      SET phone = ?, 
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    const result = await db.run(sql, [phone, userId]);
    return result.changes > 0;
  } catch (error) {
    logger.error('Failed to update user phone', { error });
    throw error;
  }
}

/**
 * DB-UpdateUserDiscountType: Update user's discount type
 * @param {string} userId - User ID
 * @param {string} discountType - New discount type
 * @returns {Promise<boolean>} Returns true if successful
 */
async function updateUserDiscountType(userId, discountType) {
  try {
    // Validate if discount type is within allowed range
    const validTypes = ['成人', '儿童', '学生', '残疾军人'];
    if (!validTypes.includes(discountType)) {
      throw new Error('Invalid discount type');
    }
    
    const sql = `
      UPDATE users 
      SET discount_type = ?, 
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    const result = await db.run(sql, [discountType, userId]);
    return result.changes > 0;
  } catch (error) {
    logger.error('Failed to update user discount type', { error });
    throw error;
  }
}

/**
 * DB-GetUserOrders: Get user's order list
 * @param {string} userId - User ID
 * @param {Object} options - Query options { startDate, endDate, searchType }
 * @returns {Promise<Array>} Order list
 */
async function getUserOrders(userId, options = {}) {
  try {
    const { startDate, endDate, searchType } = options;
    
    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
    
    let sql = `
      SELECT 
        id,
        train_number,
        departure_station,
        arrival_station,
        departure_date,
        departure_time,
        arrival_time,
        status,
        total_price,
        created_at
      FROM orders
      WHERE user_id = ?
        AND created_at >= ?
        AND status != 'pending'
        AND (
          status != 'confirmed_unpaid' 
          OR payment_expires_at IS NULL 
          OR datetime('now') <= payment_expires_at
        )
    `;
    
    const params = [String(userId), thirtyDaysAgoStr];
    
    // Add date range filter (select field based on search type)
    const dateField = searchType === 'travel-date' ? 'departure_date' : 'DATE(created_at)';
    
    if (startDate) {
      sql += ` AND ${dateField} >= ?`;
      params.push(startDate);
    }
    
    if (endDate) {
      sql += ` AND ${dateField} <= ?`;
      params.push(endDate);
    }
    
    // Sort by creation time descending
    sql += ' ORDER BY created_at DESC';
    
    const orders = await db.query(sql, params);
    
    // Query passenger info and seat info for each order
    const ordersWithPassengers = await Promise.all(orders.map(async (order) => {
      // Query passenger info and seat info for this order
      const passengersSql = `
        SELECT passenger_name, seat_type, seat_number, car_number, ticket_type
        FROM order_details
        WHERE order_id = ?
      `;
      const passengerDetails = await db.query(passengersSql, [order.id]);
      
      // Extract passenger name list and seat info
      const passengerNames = passengerDetails.map(p => p.passenger_name).join(', ');
      
      // Build seat info based on order status
      let seatInfo = '';
      let seatType = '';
      
      if (order.status === 'completed' || order.status === 'paid' || order.status === 'confirmed_unpaid') {
        // Completed, paid, or confirmed unpaid orders: return complete seat info (including seat number)
        seatInfo = passengerDetails.map(p => {
          if (p.seat_number) {
            return `${p.seat_type} ${p.seat_number}`;
          }
          return p.seat_type;
        }).join(', ');
      } else if (order.status === 'pending') {
        // Pending confirmation orders: only return seat type, excluding seat number
        seatType = passengerDetails.map(p => p.seat_type).join(', ');
      }
      
      // Return fields with underscore naming (matching frontend expectation)
      return {
        id: order.id,
        order_id: order.id,
        train_no: order.train_number,
        departure_station: order.departure_station,
        arrival_station: order.arrival_station,
        departure_date: order.departure_date,
        departure_time: order.departure_time || '',
        arrival_time: order.arrival_time || '',
        status: order.status,
        total_price: order.total_price,
        created_at: order.created_at,
        passenger_name: passengerNames || '',
        seat_info: seatInfo || '',
        seat_type: seatType || '',
        passengers: passengerDetails
      };
    }));
    
    return ordersWithPassengers;
  } catch (error) {
    logger.error('Failed to get user order list', { error });
    throw error;
  }
}

/**
 * DB-SearchOrders: Search user's orders
 * @param {string} userId - User ID
 * @param {Object} searchCriteria - Search criteria { keyword, startDate, endDate, searchType }
 * @returns {Promise<Array>} Matched order list
 */
async function searchOrders(userId, searchCriteria) {
  try {
    const { keyword, startDate, endDate, searchType } = searchCriteria;
    
    let sql = `
      SELECT 
        id,
        train_number,
        departure_station,
        arrival_station,
        departure_date,
        departure_time,
        arrival_time,
        status,
        total_price,
        created_at
      FROM orders
      WHERE user_id = ?
        AND status != 'pending'
        AND (
          status != 'confirmed_unpaid' 
          OR payment_expires_at IS NULL 
          OR datetime('now') <= payment_expires_at
        )
    `;
    
    const params = [String(userId)];
    
    // Keyword search (order ID, train number, passenger name)
    if (keyword) {
      sql += ` AND (
        id LIKE ? 
        OR train_number LIKE ?
        OR EXISTS (
          SELECT 1 FROM order_details 
          WHERE order_details.order_id = orders.id 
          AND order_details.passenger_name LIKE ?
        )
      )`;
      const keywordParam = `%${keyword}%`;
      params.push(keywordParam, keywordParam, keywordParam);
    }
    
    // Date range filter (select field based on search type)
    const dateField = searchType === 'travel-date' ? 'departure_date' : 'DATE(created_at)';
    
    if (startDate) {
      sql += ` AND ${dateField} >= ?`;
      params.push(startDate);
    }
    
    if (endDate) {
      sql += ` AND ${dateField} <= ?`;
      params.push(endDate);
    }
    
    // Sort by creation time descending
    sql += ' ORDER BY created_at DESC';
    
    const orders = await db.query(sql, params);
    
    // Query passenger info and seat info for each order
    const ordersWithPassengers = await Promise.all(orders.map(async (order) => {
      // Query passenger info and seat info for this order
      const passengersSql = `
        SELECT passenger_name, seat_type, seat_number, car_number, ticket_type
        FROM order_details
        WHERE order_id = ?
      `;
      const passengerDetails = await db.query(passengersSql, [order.id]);
      
      // Extract passenger name list and seat info
      const passengerNames = passengerDetails.map(p => p.passenger_name).join(', ');
      
      // Build seat info based on order status
      let seatInfo = '';
      let seatType = '';
      
      if (order.status === 'completed' || order.status === 'paid' || order.status === 'confirmed_unpaid') {
        // Completed, paid, or confirmed unpaid orders: return complete seat info (including seat number)
        seatInfo = passengerDetails.map(p => {
          if (p.seat_number) {
            return `${p.seat_type} ${p.seat_number}`;
          }
          return p.seat_type;
        }).join(', ');
      } else if (order.status === 'pending') {
        // Pending confirmation orders: only return seat type, excluding seat number
        seatType = passengerDetails.map(p => p.seat_type).join(', ');
      }
      
      // Return fields with underscore naming (matching frontend expectation)
      return {
        id: order.id,
        order_id: order.id,
        train_no: order.train_number,
        departure_station: order.departure_station,
        arrival_station: order.arrival_station,
        departure_date: order.departure_date,
        departure_time: order.departure_time || '',
        arrival_time: order.arrival_time || '',
        status: order.status,
        total_price: order.total_price,
        created_at: order.created_at,
        passenger_name: passengerNames || '',
        seat_info: seatInfo || '',
        seat_type: seatType || '',
        passengers: passengerDetails
      };
    }));
    
    return ordersWithPassengers;
  } catch (error) {
    logger.error('Failed to search orders', { error });
    throw error;
  }
}

module.exports = {
  getUserInfo,
  updateUserEmail,
  updateUserPhone,
  updateUserDiscountType,
  getUserOrders,
  searchOrders
};

