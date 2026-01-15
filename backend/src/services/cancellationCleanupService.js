const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const logger = require('../utils/logger');

const dbPath = path.resolve(__dirname, '../../database/railway.db');

function cleanupOldCancellations() {
  const db = new sqlite3.Database(dbPath);
  const today = new Date().toISOString().split('T')[0];
  
  db.run(
    'DELETE FROM order_cancellations WHERE cancellation_date < ?',
    [today],
    function(err) {
      if (err) {
        logger.error('Failed to cleanup old cancellations', err);
      } else {
        if (this.changes > 0) {
          logger.info(`Cleaned up ${this.changes} old cancellation records`);
        }
      }
      db.close();
    }
  );
}

// Run cleanup once when service starts
cleanupOldCancellations();

// Run cleanup daily at 1 AM
const now = new Date();
const tomorrow1AM = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 1, 0, 0);
const msUntilTomorrow1AM = tomorrow1AM - now;

setTimeout(() => {
  cleanupOldCancellations();
  // Then run every 24 hours
  setInterval(cleanupOldCancellations, 24 * 60 * 60 * 1000);
}, msUntilTomorrow1AM);

logger.info('Cancellation cleanup service started');

module.exports = { cleanupOldCancellations };
