const assert = require('assert');
// Set env before imports if modules use it at top level
process.env.JSON_DB_INMEMORY = '1';

const passengerService = require('../src/services/passengerService');
const dbService = require('../src/domain-providers/dbService');
const databaseManager = require('../src/infra-config/database');
// const jsonDbService = require('../src/domain-providers/jsonDbService');

async function testPassengerSync() {
    console.log('Initializing DB...');
    // await jsonDbService.connect();
    await databaseManager.initDatabase();

    const userId = 1;
    console.log('Creating passenger...');
    const created = await passengerService.createPassenger(userId, {
        name: 'Test User',
        idCardNumber: '123456789012345678',
        phone: '13800000000'
    });
    console.log('Created:', created);
    assert.strictEqual(created.version, 1);

    console.log('Updating passenger (First time)...');
    const update1 = await passengerService.updatePassenger(userId, created.id, {
        name: 'Test User Updated'
    }, 1);
    console.log('Update 1 result:', update1);
    assert.strictEqual(update1.success, true);

    const p1 = await passengerService.getPassengerById(created.id);
    console.log('Passenger after update 1:', p1);
    assert.strictEqual(p1.version, 2);
    assert.strictEqual(p1.name, 'Test User Updated');

    console.log('Updating passenger with WRONG version...');
    const update2 = await passengerService.updatePassenger(userId, created.id, {
        name: 'Should Fail'
    }, 1); // Old version
    console.log('Update 2 result:', update2);
    assert.strictEqual(update2.success, false);

    const p2 = await passengerService.getPassengerById(created.id);
    assert.strictEqual(p2.version, 2); // Should not change
    assert.strictEqual(p2.name, 'Test User Updated');

    console.log('Updating passenger with CORRECT version...');
    const update3 = await passengerService.updatePassenger(userId, created.id, {
        seatPreference: '靠窗'
    }, 2);
    console.log('Update 3 result:', update3);
    assert.strictEqual(update3.success, true);

    const p3 = await passengerService.getPassengerById(created.id);
    assert.strictEqual(p3.version, 3);
    assert.strictEqual(p3.seatPreference, '靠窗');

    console.log('All tests passed!');
}

testPassengerSync().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
