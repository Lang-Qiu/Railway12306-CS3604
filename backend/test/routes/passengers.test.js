const request = require('supertest');
const app = require('../../src/app');
const dbService = require('../../src/services/dbService');
const bcrypt = require('bcryptjs');

describe('Passenger Routes', () => {
    let userId;

    beforeAll(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Setup test user (assuming API currently uses userId=1 hardcoded or we need to match it)
        // Since routes/passengers.js has `const userId = 1;` hardcoded for now, we should ensure user 1 exists or is what we expect.
        // But `database.js` inserts user 1 (testuser).
        // If we want to test properly, we should rely on the existing user 1.
        
        // Let's verify user 1 exists
        const user = await dbService.get('SELECT * FROM users WHERE id = 1');
        if (!user) {
             // If not exists (e.g. clean DB), create it
             const hashedPassword = await bcrypt.hash('password123', 10);
             await dbService.run(
                'INSERT INTO users (id, username, password_hash, email, phone, real_name) VALUES (1, ?, ?, ?, ?, ?)',
                ['testuser', hashedPassword, 'test@example.com', '13800138000', '张三']
            );
        }
        userId = 1;
    });

    describe('POST /api/passengers', () => {
        it('should create a new passenger', async () => {
            const newPassenger = {
                name: 'API测试乘客',
                idCardType: '二代居民身份证',
                idCardNumber: '510101199001011234',
                phone: '13600000000',
                discountType: '成人'
            };

            const response = await request(app)
                .post('/api/passengers')
                .send(newPassenger)
                .expect(201); // Expecting 201 Created

            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('name', newPassenger.name);
        });
    });

    describe('GET /api/passengers', () => {
        it('should return list of passengers', async () => {
            const response = await request(app)
                .get('/api/passengers')
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            // We expect at least the one we just created + seeds
            expect(response.body.length).toBeGreaterThan(0);
        });
    });

    describe('PUT /api/passengers/:id', () => {
        it('should update a passenger', async () => {
            // Create one first via API or DB
            const res = await request(app)
                .post('/api/passengers')
                .send({
                    name: '待修改',
                    idCardType: '二代居民身份证',
                    idCardNumber: '510101199001015678',
                    discountType: '成人'
                });
            const id = res.body.id;

            const updateData = {
                name: '已修改',
                phone: '13500000000'
            };

            const response = await request(app)
                .put(`/api/passengers/${id}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
        });
    });

    describe('DELETE /api/passengers/:id', () => {
        it('should delete a passenger', async () => {
            // Create one first
            const res = await request(app)
                .post('/api/passengers')
                .send({
                    name: '待删除',
                    idCardType: '二代居民身份证',
                    idCardNumber: '510101199001010000',
                    discountType: '成人'
                });
            const id = res.body.id;

            await request(app)
                .delete(`/api/passengers/${id}`)
                .expect(200);
            
            // Verify it's gone (optional, could check DB or GET)
        });
    });
});
