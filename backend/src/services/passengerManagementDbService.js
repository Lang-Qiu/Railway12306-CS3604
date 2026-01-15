// Passenger Management Database Service
// Used for passenger management page functionality

const db = require('../database');
const logger = require('../utils/logger');

/**
 * DB-CheckPassengerExists: Check if passenger information already exists
 * @param {string} userId - User ID
 * @param {string} name - Passenger name
 * @param {string} idCardNumber - ID card number
 * @returns {Promise<boolean>} Returns true if exists
 */
async function checkPassengerExists(userId, name, idCardNumber) {
  try {
    const sql = `
      SELECT id 
      FROM passengers 
      WHERE user_id = ? 
        AND name = ? 
        AND id_card_number = ?
    `;
    
    const passenger = await db.queryOne(sql, [userId, name, idCardNumber]);
    return passenger !== null && passenger !== undefined;
  } catch (error) {
    logger.error('Failed to check if passenger exists', { error });
    throw error;
  }
}

/**
 * DB-GetPassengerByIdCard: Get passenger information by ID card number
 * @param {string} userId - User ID
 * @param {string} idCardNumber - ID card number
 * @returns {Promise<Object|null>} Passenger info object or null
 */
async function getPassengerByIdCard(userId, idCardNumber) {
  try {
    const sql = `
      SELECT 
        id,
        name,
        id_card_type as idCardType,
        id_card_number as idCardNumber,
        phone,
        discount_type as discountType,
        created_at as addedDate
      FROM passengers
      WHERE user_id = ? 
        AND id_card_number = ?
    `;
    
    const passenger = await db.queryOne(sql, [userId, idCardNumber]);
    return passenger || null;
  } catch (error) {
    logger.error('Failed to get passenger by ID card number', { error });
    throw error;
  }
}

module.exports = {
  checkPassengerExists,
  getPassengerByIdCard
};

