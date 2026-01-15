const crypto = require('crypto');
const db = require('../database');
const logger = require('../utils/logger');

// Generate UUID v4
function uuidv4() {
  return crypto.randomUUID();
}

/**
 * Passenger Service
 */

/**
 * Mask ID card number
 * Keep first 4 and last 3 digits, replace middle with asterisks
 */
function maskIdNumber(idNumber) {
  if (!idNumber || idNumber.length < 8) return idNumber;
  const length = idNumber.length;
  if (length === 18) {
    // 18-digit ID: keep first 4 and last 3
    return idNumber.substring(0, 4) + '***********' + idNumber.substring(length - 3);
  }
  // Other IDs: keep first 4 and last 3
  return idNumber.substring(0, 4) + '*'.repeat(length - 7) + idNumber.substring(length - 3);
}

/**
 * Get all passengers for a user
 */
async function getUserPassengers(userId) {
  try {
    // First get current user's ID card number
    const userRows = await db.query(
      'SELECT id_card_number FROM users WHERE id = ?',
      [userId]
    );
    const userIdCardNumber = userRows[0]?.id_card_number || '';
    
    const rows = await db.query(
      'SELECT * FROM passengers WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    
    // Mask ID number and mark if it is self
    const passengers = rows.map(p => ({
      id: p.id,
      name: p.name,
      idCardType: p.id_card_type,
      idCardNumber: maskIdNumber(p.id_card_number),
      discountType: p.discount_type,
      phone: p.phone || '',
      points: p.points || 0,
      isSelf: p.id_card_number === userIdCardNumber  // Mark if it is the user themselves
    }));
    
    return passengers;
  } catch (err) {
    logger.error('Failed to get passenger list', { error: err });
    const error = new Error('Failed to get passenger list');
    error.status = 500;
    throw error;
  }
}

/**
 * Search passengers
 */
async function searchPassengers(userId, keyword) {
  // If keyword is empty, return all passengers
  if (!keyword || keyword.trim() === '') {
    return getUserPassengers(userId);
  }
  
  try {
    // First get current user's ID card number
    const userRows = await db.query(
      'SELECT id_card_number FROM users WHERE id = ?',
      [userId]
    );
    const userIdCardNumber = userRows[0]?.id_card_number || '';
    
    const searchPattern = `%${keyword}%`;
    
    const rows = await db.query(
      'SELECT * FROM passengers WHERE user_id = ? AND name LIKE ? ORDER BY name',
      [userId, searchPattern]
    );
    
    // Mask ID number and mark if it is self
    const passengers = rows.map(p => ({
      id: p.id,
      name: p.name,
      idCardType: p.id_card_type,
      idCardNumber: maskIdNumber(p.id_card_number),
      discountType: p.discount_type,
      phone: p.phone || '',
      points: p.points || 0,
      isSelf: p.id_card_number === userIdCardNumber  // Mark if it is the user themselves
    }));
    
    return passengers;
  } catch (err) {
    logger.error('Failed to search passengers', { error: err });
    const error = new Error('Search failed');
    error.status = 500;
    throw error;
  }
}

/**
 * Get passenger details
 */
async function getPassengerDetails(userId, passengerId) {
  try {
    const rows = await db.query(
      'SELECT * FROM passengers WHERE id = ? AND user_id = ?',
      [passengerId, userId]
    );
    
    const row = rows[0];
    
    if (!row) {
      const error = new Error('Passenger not found');
      error.status = 404;
      throw error;
    }
    
    // Type conversion: ensure both are strings for comparison
    if (String(row.user_id) !== String(userId)) {
      const error = new Error('Unauthorized access to passenger information');
      error.status = 403;
      throw error;
    }
    
    return {
      id: row.id,
      name: row.name,
      idCardType: row.id_card_type,
      idCardNumber: maskIdNumber(row.id_card_number),
      discountType: row.discount_type,
      phone: row.phone || '',
      points: row.points || 0
    };
  } catch (err) {
    if (err.status) throw err;
    logger.error('Failed to get passenger details', { error: err });
    const error = new Error('Failed to get passenger details');
    error.status = 500;
    throw error;
  }
}

/**
 * Get passenger points
 */
async function getPassengerPoints(passengerId) {
  try {
    const rows = await db.query(
      'SELECT points FROM passengers WHERE id = ?',
      [passengerId]
    );
    
    const row = rows[0];
    return row ? (row.points || 0) : 0;
  } catch (err) {
    logger.error('Failed to get passenger points', { error: err });
    const error = new Error('Failed to get passenger points');
    error.status = 500;
    throw error;
  }
}

/**
 * Validate name length
 * 1 Chinese character counts as 2 characters
 */
function validateNameLength(name) {
  if (!name || name.trim() === '') {
    return false;
  }
  // Calculate character length (Chinese character counts as 2)
  let length = 0;
  for (let i = 0; i < name.length; i++) {
    const char = name.charAt(i);
    // Check if it is a Chinese character
    if (char.match(/[\u4e00-\u9fa5]/)) {
      length += 2;
    } else {
      length += 1;
    }
  }
  return length >= 3 && length <= 30;
}

/**
 * Validate ID card number format
 */
function validateIdCardNumber(idCardNumber, idCardType) {
  if (!idCardNumber) return false;
  
  if (idCardType === '居民身份证') {
    // 18-digit ID card verification
    if (idCardNumber.length !== 18) {
      return false;
    }
    // Only numbers and letters allowed
    if (!/^[0-9X]+$/i.test(idCardNumber)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Create passenger
 */
async function createPassenger(userId, passengerData) {
  const { name, idCardType, idCardNumber, discountType, phone } = passengerData;
  
  // Validate name length
  if (!validateNameLength(name)) {
    const error = new Error('Name length requirements not met');
    error.status = 400;
    throw error;
  }
  
  // Validate ID card number format
  if (!validateIdCardNumber(idCardNumber, idCardType)) {
    const error = new Error('Invalid ID card number format');
    error.status = 400;
    throw error;
  }
  
  try {
    // Validate ID card uniqueness (cannot duplicate within same user)
    const existingRows = await db.query(
      'SELECT id FROM passengers WHERE user_id = ? AND id_card_number = ?',
      [userId, idCardNumber]
    );
    
    if (existingRows.length > 0) {
      const error = new Error('Passenger already exists');
      error.status = 409;
      throw error;
    }
    
    const passengerId = uuidv4();
    
    // Create passenger record
    await db.run(
      `INSERT INTO passengers (id, user_id, name, id_card_type, id_card_number, discount_type, phone, points, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, datetime('now'))`,
      [passengerId, userId, name, idCardType, idCardNumber, discountType || '成人票', phone || '']
    );
    
    return { 
      message: 'Passenger added successfully', 
      passengerId,
      points: 0
    };
  } catch (err) {
    if (err.status) throw err;
    logger.error('Failed to create passenger', { error: err });
    if (err.code === 'SQLITE_CONSTRAINT' || err.code === 'ER_DUP_ENTRY') {
      const error = new Error('Passenger already exists');
      error.status = 409;
      throw error;
    }
    const error = new Error('Failed to add passenger');
    error.status = 500;
    throw error;
  }
}

/**
 * Update passenger information
 * Note: Only phone and discountType fields are allowed to be updated
 * Basic info like name, ID type, ID number are not allowed to be modified
 */
async function updatePassenger(userId, passengerId, updateData) {
  logger.info('Received update passenger request', { userId, passengerId, updateData });
  
  const { discountType, phone } = updateData;
  
  // Validate discount type
  const validDiscountTypes = ['成人', '儿童', '学生', '残疾军人'];
  if (discountType && !validDiscountTypes.includes(discountType)) {
    const error = new Error(`Invalid discount type, must be one of: ${validDiscountTypes.join(', ')}`);
    error.status = 400;
    throw error;
  }
  
  // Validate phone number format (optional)
  if (phone && phone.trim() !== '') {
    if (!/^\d{11}$/.test(phone)) {
      const error = new Error('Invalid phone number format, must be 11 digits');
      error.status = 400;
      throw error;
    }
  }
  
  try {
    // First check if passenger exists and belongs to current user
    const rows = await db.query(
      'SELECT * FROM passengers WHERE id = ?',
      [passengerId]
    );
    
    const passenger = rows[0];
    
    if (!passenger) {
      const error = new Error('Passenger not found');
      error.status = 404;
      throw error;
    }
    
    // Type conversion: ensure both are strings or numbers for comparison
    const passengerUserId = String(passenger.user_id);
    const requestUserId = String(userId);
    
    logger.debug('Permission check', { 
      passengerUserId, 
      requestUserId, 
      match: passengerUserId === requestUserId 
    });
    
    if (passengerUserId !== requestUserId) {
      const error = new Error('Unauthorized to modify this passenger information');
      error.status = 403;
      throw error;
    }
    
    logger.debug('Data before update', { 
      oldPhone: passenger.phone, 
      oldDiscountType: passenger.discount_type,
      newPhone: phone,
      newDiscountType: discountType
    });
    
    // Only update allowed fields: phone and discountType
    const result = await db.run(
      `UPDATE passengers 
       SET discount_type = ?, phone = ?, updated_at = datetime('now')
       WHERE id = ? AND user_id = ?`,
      [discountType, phone || '', passengerId, userId]
    );
    
    logger.info('Passenger info updated successfully', { 
      passengerId, 
      userId, 
      discountType, 
      phone: phone ? '***' + phone.slice(-4) : '',
      changes: result.changes 
    });
    
    return { 
      message: 'Passenger info updated successfully',
      passengerId
    };
  } catch (err) {
    if (err.status) throw err;
    logger.error('Failed to update passenger', { error: err });
    const error = new Error('Failed to update passenger: ' + err.message);
    error.status = 500;
    throw error;
  }
}

/**
 * Delete passenger
 */
async function deletePassenger(userId, passengerId) {
  try {
    // First check if passenger exists and belongs to current user
    const passengerRows = await db.query(
      'SELECT * FROM passengers WHERE id = ?',
      [passengerId]
    );
    
    const passenger = passengerRows[0];
    
    logger.debug('Delete passenger - checking permission', {
      passengerId,
      requestUserId: userId,
      requestUserIdType: typeof userId,
      passengerUserId: passenger?.user_id,
      passengerUserIdType: typeof passenger?.user_id,
      exists: !!passenger
    });
    
    if (!passenger) {
      const error = new Error('Passenger not found');
      error.status = 404;
      throw error;
    }
    
    // Convert both to strings for comparison to avoid type mismatch
    const passengerUserIdStr = String(passenger.user_id);
    const userIdStr = String(userId);
    
    logger.debug('Delete passenger - string comparison', {
      passengerUserIdStr,
      userIdStr,
      match: passengerUserIdStr === userIdStr
    });
    
    if (passengerUserIdStr !== userIdStr) {
      const error = new Error('Unauthorized to delete this passenger');
      error.status = 403;
      throw error;
    }
    
    // Check if the passenger has unfinished orders
    const orderRows = await db.query(
      `SELECT od.* FROM order_details od
       JOIN orders o ON od.order_id = o.id
       WHERE od.passenger_id = ? AND o.status IN ('pending', 'processing', 'confirmed')
       LIMIT 1`,
      [passengerId]
    );
    
    const order = orderRows[0];
    
    if (order) {
      const error = new Error('Cannot delete passenger with unfinished orders');
      error.status = 400;
      throw error;
    }
    
    // Delete passenger
    await db.run(
      'DELETE FROM passengers WHERE id = ?',
      [passengerId]
    );
    
    logger.info('Passenger deleted successfully', { passengerId, userId });
    
    return { message: 'Passenger deleted successfully' };
  } catch (err) {
    if (err.status) throw err;
    logger.error('Failed to delete passenger', { error: err });
    const error = new Error('Failed to delete passenger');
    error.status = 500;
    throw error;
  }
}

module.exports = {
  getUserPassengers,
  searchPassengers,
  getPassengerDetails,
  getPassengerPoints,
  createPassenger,
  updatePassenger,
  deletePassenger,
  maskIdNumber
};
