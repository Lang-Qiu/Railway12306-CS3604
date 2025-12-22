const passengerService = require('../../src/services/passengerService');
const dbService = require('../../src/domain-providers/dbService');
const bcrypt = require('bcryptjs');

describe('PassengerService', () => {
    let userId;

    beforeAll(async () => {
        // Wait for DB init
        await new Promise(resolve => setTimeout(resolve, 100));

        // Create test user
        const hashedPassword = await bcrypt.hash('password123', 10);
        const result = await dbService.run(
            'INSERT INTO users (username, password_hash, email, phone, real_name, id_card) VALUES (?, ?, ?, ?, ?, ?)',
            ['test_passenger_user', hashedPassword, 'p_test@example.com', '15000150000', '测试君', '110101199001019999']
        );
        
        // Get the inserted user ID
        const user = await dbService.get('SELECT id FROM users WHERE username = ?', ['test_passenger_user']);
        userId = user.id;
    });

    afterAll(async () => {
        await dbService.run('DELETE FROM passengers WHERE user_id = ?', [userId]);
        await dbService.run('DELETE FROM users WHERE id = ?', [userId]);
    });

    describe('createPassenger', () => {
        it('should create a new passenger', async () => {
            const passengerData = {
                name: '新增乘客',
                idCardType: '二代居民身份证',
                idCardNumber: '110101199001018888',
                phone: '13800000000',
                discountType: '成人',
                verificationStatus: '已通过'
            };

            const result = await passengerService.createPassenger(userId, passengerData);
            expect(result).toHaveProperty('id');
            expect(result.id).toBeGreaterThan(0);

            // Verify in DB
            const saved = await dbService.get('SELECT * FROM passengers WHERE id = ?', [result.id]);
            expect(saved.name).toBe(passengerData.name);
            expect(saved.id_card_number).toBe(passengerData.idCardNumber);
            expect(saved.verification_status).toBe('已通过');
        });
    });

    describe('getPassengersByUserId', () => {
        it('should return passengers for the user', async () => {
            const passengers = await passengerService.getPassengersByUserId(userId);
            expect(Array.isArray(passengers)).toBe(true);
            expect(passengers.length).toBeGreaterThan(0);
            expect(passengers[0].userId).toBe(userId);
        });
    });

    describe('updatePassenger', () => {
        it('should update passenger details', async () => {
            // First get a passenger
            const passengers = await passengerService.getPassengersByUserId(userId);
            const passengerId = passengers[0].id;

            const updateData = {
                name: '修改后的乘客',
                phone: '13900000000'
            };

            const result = await passengerService.updatePassenger(userId, passengerId, updateData);
            expect(result.success).toBe(true);

            // Verify
            const updated = await dbService.get('SELECT * FROM passengers WHERE id = ?', [passengerId]);
            expect(updated.name).toBe(updateData.name);
            expect(updated.phone).toBe(updateData.phone);
        });
    });

    describe('searchPassengers', () => {
        it('should find passenger by name', async () => {
            const results = await passengerService.searchPassengers(userId, '修改后的');
            expect(results.length).toBeGreaterThan(0);
            expect(results[0].name).toContain('修改后的');
        });
    });

    describe('deletePassenger', () => {
        it('should delete a passenger', async () => {
            // Create a temporary passenger to delete
            const passengerData = {
                name: '待删除乘客',
                idCardType: '二代居民身份证',
                idCardNumber: '110101199001017777',
                phone: '13700000000',
                discountType: '成人'
            };
            const created = await passengerService.createPassenger(userId, passengerData);
            
            const result = await passengerService.deletePassenger(userId, created.id);
            expect(result.success).toBe(true);

            // Verify
            const deleted = await dbService.get('SELECT * FROM passengers WHERE id = ?', [created.id]);
            expect(deleted).toBeUndefined();
        });
    });
});
