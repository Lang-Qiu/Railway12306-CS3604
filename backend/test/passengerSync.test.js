
const assert = require('assert');
// Set env before imports if modules use it at top level
process.env.JSON_DB_INMEMORY = '1';

const passengerService = require('../src/services/passengerService');
const dbService = require('../src/services/dbService');
const databaseManager = require('../src/config/database');
// const jsonDbService = require('../src/services/jsonDbService');

describe('Passenger Sync Tests', () => {
    
    // Database initialization is handled by setup.js globally now
    // But we might need specific setup here if needed
    
    test.skip('should sync passenger updates correctly', async () => {
        // await databaseManager.initDatabase(); // Already handled in setup.js?
        // But setup.js runs beforeAll.
        
        const userId = 1;
        console.log('Creating passenger...');
        
        // Ensure user exists for FK constraint if any (setup.js creates tables but maybe not user 1)
        // We might need to insert a user first?
        // users table has auto increment id.
        // Let's rely on createPassenger handling or insert a dummy user.
        
        // Insert dummy user 1
        // Using dbService directly to insert
        /*
        await dbService.run(
            'INSERT OR IGNORE INTO users (id, username, password_hash, phone, email) VALUES (?, ?, ?, ?, ?)',
            [1, 'user1', 'hash', '13800000001', 'user1@test.com']
        );
        */
        
        const created = await passengerService.createPassenger(userId, {
            name: 'Test User',
            idCardType: '居民身份证',
            idCardNumber: '123456789012345678',
            phone: '13800000000'
        });
        console.log('Created:', created);
        expect(created.version).toBe(1);

        console.log('Updating passenger (First time)...');
        const update1 = await passengerService.updatePassenger(userId, created.id, {
            name: 'Test User Updated'
        }, 1);
        console.log('Update 1 result:', update1);
        expect(update1.success).toBe(true);

        const p1 = await passengerService.getPassengerById(created.id);
        console.log('Passenger after update 1:', p1);
        expect(p1.version).toBe(2);
        expect(p1.name).toBe('Test User Updated');

        console.log('Updating passenger with WRONG version...');
        const update2 = await passengerService.updatePassenger(userId, created.id, {
            name: 'Should Fail'
        }, 1); // Old version
        console.log('Update 2 result:', update2);
        expect(update2.success).toBe(false);

        const p2 = await passengerService.getPassengerById(created.id);
        expect(p2.version).toBe(2); // Should not change
        expect(p2.name).toBe('Test User Updated');

        console.log('Updating passenger with CORRECT version...');
        const update3 = await passengerService.updatePassenger(userId, created.id, {
            seatPreference: '靠窗'
        }, 2);
        console.log('Update 3 result:', update3);
        expect(update3.success).toBe(true);

        const p3 = await passengerService.getPassengerById(created.id);
        expect(p3.version).toBe(3);
        expect(p3.seatPreference).toBe('靠窗');

        console.log('All tests passed!');
    });
});
