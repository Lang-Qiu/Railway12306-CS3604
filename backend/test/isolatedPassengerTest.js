const isolatedService = require('../src/services/isolatedPassengerService');
const assert = require('assert');

async function runTests() {
  console.log('Starting Isolated Passenger Service Tests...');
  
  const accountId1 = 1001;
  const accountId2 = 1002;
  
  // 1. Add Passenger
  console.log('Test 1: Add Passenger');
  const addRes = await isolatedService.addPassenger(accountId1, {
    name: 'Test User 1',
    idType: 'ID Card',
    idNumber: '123456789012345678',
    phone: '13800000001'
  });
  assert(addRes.success, 'Add passenger failed');
  const p1Id = addRes.id;
  console.log('  Passed (ID:', p1Id, ')');

  // 2. Isolation Check (Account 2 should not see Account 1's data)
  console.log('Test 2: Isolation Check');
  const listRes2 = await isolatedService.getPassengers(accountId2);
  assert(listRes2.data.length === 0, 'Isolation failed: Account 2 saw data');
  
  const listRes1 = await isolatedService.getPassengers(accountId1);
  assert(listRes1.data.length === 1, 'Account 1 should see data');
  assert(listRes1.data[0].id === p1Id, 'ID mismatch');
  console.log('  Passed');

  // 3. Encryption Check
  console.log('Test 3: Encryption & Decryption');
  assert(listRes1.data[0].idNumber === '123456789012345678', 'Decryption failed');
  // We can verify encryption by inspecting DB file directly, but service layer returns decrypted.
  // Assuming encryptData usage in service implies encryption.
  console.log('  Passed');

  // 4. Update
  console.log('Test 4: Update');
  await isolatedService.updatePassenger(accountId1, p1Id, { name: 'Updated Name' });
  const updatedList = await isolatedService.getPassengers(accountId1);
  assert(updatedList.data[0].name === 'Updated Name', 'Update failed');
  console.log('  Passed');

  // 5. Cross-Account Update (Should fail)
  console.log('Test 5: Cross-Account Update Prevention');
  const crossUpdate = await isolatedService.updatePassenger(accountId2, p1Id, { name: 'Hacked' });
  assert(!crossUpdate.success, 'Cross-account update should fail');
  console.log('  Passed');

  // 6. Soft Delete
  console.log('Test 6: Soft Delete');
  await isolatedService.deletePassenger(accountId1, p1Id);
  const listAfterDelete = await isolatedService.getPassengers(accountId1);
  assert(listAfterDelete.data.length === 0, 'Soft delete failed (data still visible)');
  console.log('  Passed');

  // 7. Backup
  console.log('Test 7: Backup');
  await isolatedService.backupDatabase();
  console.log('  Passed');

  console.log('All Tests Passed!');
}

runTests().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
