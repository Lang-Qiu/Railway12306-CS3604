/**
 * Train Cleanup Service
 * 
 * Functionality:
 * 1. Clean up expired train records (departure_date < today)
 * 2. Clean up corresponding seat status records
 * 3. Automatically execute every day at midnight
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const logger = require('../utils/logger');

/**
 * Get database connection
 */
function getDatabase() {
  const dbPath = process.env.NODE_ENV === 'test' 
    ? process.env.TEST_DB_PATH || path.join(__dirname, '../../database/test.db')
    : process.env.DB_PATH || path.join(__dirname, '../../database/railway.db');
  
  return new sqlite3.Database(dbPath);
}

/**
 * Clean up expired train records
 * Delete records where departure_date < today
 */
async function cleanupExpiredTrains() {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    const today = new Date().toISOString().split('T')[0];
    
    logger.info(`Starting cleanup of expired train records (date < ${today})...`);
    
    db.serialize(() => {
      // 1. Get train info to be deleted (for logging)
      db.all(
        'SELECT train_no, departure_date FROM trains WHERE departure_date < ?',
        [today],
        (err, expiredTrains) => {
          if (err) {
            logger.error('Failed to query expired trains', { error: err });
            db.close();
            return reject(err);
          }
          
          if (!expiredTrains || expiredTrains.length === 0) {
            logger.info('No expired trains to cleanup');
            db.close();
            return resolve({ deletedTrains: 0, deletedSeats: 0 });
          }
          
          logger.info(`Found ${expiredTrains.length} expired train records`);
          
          // 2. Delete expired seat status records
          db.run(
            'DELETE FROM seat_status WHERE departure_date < ?',
            [today],
            function(err) {
              if (err) {
                logger.error('Failed to delete expired seat status', { error: err });
                db.close();
                return reject(err);
              }
              
              const deletedSeats = this.changes;
              logger.info(`Deleted ${deletedSeats} seat status records`);
              
              // 3. Delete expired train records
              db.run(
                'DELETE FROM trains WHERE departure_date < ?',
                [today],
                function(err) {
                  db.close();
                  
                  if (err) {
                    logger.error('Failed to delete expired trains', { error: err });
                    return reject(err);
                  }
                  
                  const deletedTrains = this.changes;
                  logger.info(`Deleted ${deletedTrains} train records`);
                  logger.info('Cleanup completed!');
                  
                  resolve({
                    deletedTrains: deletedTrains,
                    deletedSeats: deletedSeats,
                    expiredDates: expiredTrains.map(t => t.departure_date).filter((v, i, a) => a.indexOf(v) === i)
                  });
                }
              );
            }
          );
        }
      );
    });
  });
}

/**
 * Clean up train records before a specific date
 * @param {string} beforeDate - Date in YYYY-MM-DD format
 */
async function cleanupTrainsBefore(beforeDate) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    
    logger.info(`Starting cleanup of train records before ${beforeDate}...`);
    
    db.serialize(() => {
      // 1. Delete seat status records
      db.run(
        'DELETE FROM seat_status WHERE departure_date < ?',
        [beforeDate],
        function(err) {
          if (err) {
            logger.error('Failed to delete seat status', { error: err });
            db.close();
            return reject(err);
          }
          
          const deletedSeats = this.changes;
          
          // 2. Delete train records
          db.run(
            'DELETE FROM trains WHERE departure_date < ?',
            [beforeDate],
            function(err) {
              db.close();
              
              if (err) {
                logger.error('Failed to delete trains', { error: err });
                return reject(err);
              }
              
              const deletedTrains = this.changes;
              logger.info(`Cleanup completed: Deleted ${deletedTrains} trains, ${deletedSeats} seat status records`);
              
              resolve({
                deletedTrains: deletedTrains,
                deletedSeats: deletedSeats
              });
            }
          );
        }
      );
    });
  });
}

/**
 * Get statistics of expired trains
 */
async function getExpiredTrainsStats() {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    const today = new Date().toISOString().split('T')[0];
    
    db.all(
      `SELECT 
        COUNT(*) as total_trains,
        COUNT(DISTINCT departure_date) as unique_dates
       FROM trains 
       WHERE departure_date < ?`,
      [today],
      (err, rows) => {
        db.close();
        
        if (err) {
          logger.error('Failed to query expired trains statistics', { error: err });
          return reject(err);
        }
        
        const stats = rows[0] || { total_trains: 0, unique_dates: 0 };
        resolve(stats);
      }
    );
  });
}

module.exports = {
  cleanupExpiredTrains,
  cleanupTrainsBefore,
  getExpiredTrainsStats
};









