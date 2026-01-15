const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const logger = require('../utils/logger');

/**
 * Pending Order Cleanup Service
 * Periodically checks and deletes pending orders older than 10 minutes
 */

// Create database connection
function getDatabase() {
  const dbPath = process.env.NODE_ENV === 'test' 
    ? process.env.TEST_DB_PATH || path.join(__dirname, '../../database/test.db')
    : process.env.DB_PATH || path.join(__dirname, '../../database/railway.db');
  
  return new sqlite3.Database(dbPath);
}

/**
 * Cleanup pending orders older than 10 minutes
 * Releases seats first, then deletes orders
 * @returns {Promise<{ordersDeleted: number, detailsDeleted: number}>}
 */
async function cleanupExpiredPendingOrders() {
  return new Promise(async (resolve, reject) => {
    const db = getDatabase();
    const orderService = require('./orderService');
    
    try {
      // Query expired pending orders
      const expiredOrders = await new Promise((resolve, reject) => {
        db.all(
          `SELECT id FROM orders 
         WHERE status = 'pending' 
         AND created_at < datetime('now', '-10 minutes')`,
          (err, orders) => {
            if (err) return reject(err);
            resolve(orders || []);
          }
        );
      });
      
      db.close();
      
      if (expiredOrders.length === 0) {
        return resolve({ ordersDeleted: 0, detailsDeleted: 0 });
      }
      
      logger.info(`Found ${expiredOrders.length} expired pending orders, cleaning up...`);
      
      let detailsDeleted = 0;
      let ordersDeleted = 0;
      
      // Process expired orders one by one (no transaction to avoid database lock conflicts)
      for (const order of expiredOrders) {
        try {
          // Attempt to release seat locks (releaseSeatLocks opens its own database connection)
          // For pending orders, if seat info exists (though normally shouldn't), it will be released
          await orderService.releaseSeatLocks(order.id);
          
          // Create new database connection for each delete operation
          const deleteDb = getDatabase();
          
          // Delete order details
          const detailsResult = await new Promise((resolve, reject) => {
            deleteDb.run(
              'DELETE FROM order_details WHERE order_id = ?',
              [order.id],
              function(err) {
                if (err) return reject(err);
                resolve(this.changes);
              }
            );
          });
          detailsDeleted += detailsResult;
          
          // Delete order
          const ordersResult = await new Promise((resolve, reject) => {
            deleteDb.run(
              'DELETE FROM orders WHERE id = ?',
              [order.id],
            function(err) {
                if (err) return reject(err);
                resolve(this.changes);
              }
            );
          });
          ordersDeleted += ordersResult;
          
          deleteDb.close();
        } catch (error) {
          logger.error(`Failed to cleanup order ${order.id}:`, error.message);
          // Continue processing other orders
        }
      }
      
      if (ordersDeleted > 0) {
        logger.info(`Cleanup completed. Deleted ${ordersDeleted} orders, ${detailsDeleted} details`);
      }
      
      resolve({ ordersDeleted, detailsDeleted });
    } catch (error) {
      logger.error('Error during order cleanup:', error);
      reject(error);
    }
  });
}

/**
 * Cleanup expired confirmed unpaid orders
 * Releases seats and deletes orders
 * @returns {Promise<{ordersDeleted: number, detailsDeleted: number}>}
 */
async function cleanupExpiredUnpaidOrders() {
  return new Promise(async (resolve, reject) => {
    const db = getDatabase();
    const orderService = require('./orderService');
    
    try {
      // Query expired confirmed unpaid orders
      const expiredOrders = await new Promise((resolve, reject) => {
        db.all(
          `SELECT id FROM orders 
           WHERE status = 'confirmed_unpaid' 
           AND payment_expires_at IS NOT NULL
           AND payment_expires_at < datetime('now')`,
          (err, orders) => {
            if (err) return reject(err);
            resolve(orders || []);
          }
        );
      });
      
      db.close();
      
      if (expiredOrders.length === 0) {
        return resolve({ ordersDeleted: 0, detailsDeleted: 0 });
      }
      
      logger.info(`Found ${expiredOrders.length} expired pending orders, cleaning up...`);
      
      let detailsDeleted = 0;
      let ordersDeleted = 0;
      
      // Process expired orders one by one (no transaction to avoid database lock conflicts)
      for (const order of expiredOrders) {
        try {
          // Release seat locks (releaseSeatLocks opens its own database connection)
          await orderService.releaseSeatLocks(order.id);
          
          // Create new database connection for each delete operation
          const deleteDb = getDatabase();
          
          // Delete order details
          const detailsResult = await new Promise((resolve, reject) => {
            deleteDb.run(
              'DELETE FROM order_details WHERE order_id = ?',
              [order.id],
              function(err) {
                if (err) return reject(err);
                resolve(this.changes);
              }
            );
          });
          detailsDeleted += detailsResult;
          
          // Delete order
          const ordersResult = await new Promise((resolve, reject) => {
            deleteDb.run(
              'DELETE FROM orders WHERE id = ?',
              [order.id],
              function(err) {
                if (err) return reject(err);
                resolve(this.changes);
              }
            );
          });
          ordersDeleted += ordersResult;
          
          deleteDb.close();
        } catch (error) {
          logger.error(`Failed to cleanup unpaid order ${order.id}:`, error.message);
        }
      }
      
      if (ordersDeleted > 0) {
        logger.info(`Unpaid orders cleanup completed. Deleted ${ordersDeleted} orders, ${detailsDeleted} details`);
      }
      
      resolve({ ordersDeleted, detailsDeleted });
    } catch (error) {
      db.close();
      logger.error('Error during unpaid order cleanup:', error.message);
      reject(error);
    }
  });
}

/**
 * Start order cleanup scheduler
 * Runs cleanup every 60 seconds
 * @returns {Function} Function to stop cleanup service
 */
function startCleanupScheduler() {
  logger.info('Cleanup service initializing...');
  
  // Run cleanup immediately once
  Promise.all([
    cleanupExpiredPendingOrders(),
    cleanupExpiredUnpaidOrders()
  ])
    .then(([pendingResult, unpaidResult]) => {
      const totalDeleted = pendingResult.ordersDeleted + unpaidResult.ordersDeleted;
      if (totalDeleted > 0) {
        logger.info(`Initial cleanup: Deleted ${totalDeleted} expired orders`);
      } else {
        logger.debug('Initial cleanup: No expired orders');
      }
    })
    .catch(err => {
      logger.error('Initial cleanup failed', err.message);
    });
  
  // Set interval task, run every minute
  const intervalId = setInterval(() => {
    Promise.all([
      cleanupExpiredPendingOrders(),
      cleanupExpiredUnpaidOrders()
    ])
      .then(([pendingResult, unpaidResult]) => {
        const totalDeleted = pendingResult.ordersDeleted + unpaidResult.ordersDeleted;
        if (totalDeleted > 0) {
          logger.info(`Scheduled cleanup: Deleted ${totalDeleted} expired orders`);
        }
      })
      .catch(err => {
        logger.error('Scheduled cleanup failed', err.message);
      });
  }, 60000); // Run every 60 seconds
  
  logger.info('Cleanup service started');
  
  // Return cleanup function for graceful shutdown
  return () => {
    clearInterval(intervalId);
    logger.info('Cleanup service stopped');
  };
}

module.exports = {
  cleanupExpiredPendingOrders,
  cleanupExpiredUnpaidOrders,
  startCleanupScheduler
};
