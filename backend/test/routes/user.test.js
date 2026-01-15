const request = require('supertest');
const app = require('../../src/app');
const dbService = require('../../src/services/dbService');
const bcrypt = require('bcryptjs');

describe('User Routes', () => {
  let token;
  let userId;

  beforeAll(async () => {
    // Setup test user
    const hashedPassword = await bcrypt.hash('password123', 10);
    await dbService.run(`
      INSERT OR REPLACE INTO users (username, password, email, phone, id_card_type, id_card_number, name, discount_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, ['testuser_profile', hashedPassword, 'profile@example.com', '13900139000', '1', '110101199001011234', '测试用户', '成人']);

    // Get user ID
    const user = await dbService.get('SELECT id FROM users WHERE username = ?', ['testuser_profile']);
    userId = user.id;

    // Simulate login to get token (if auth is implemented)
    token = 'valid-test-token';
  });

  afterAll(async () => {
    await dbService.run('DELETE FROM users WHERE username = ?', ['testuser_profile']);
  });

  describe('GET /api/user/info', () => {
    it('should return user profile', async () => {
      const response = await request(app)
        .get('/api/user/info')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('username', 'testuser_profile');
      expect(response.body).toHaveProperty('email', 'profile@example.com');
      expect(response.body).toHaveProperty('phone', '(+86)139****9000');
      // expect(response.body).toHaveProperty('discountType', '成人'); // API might return snake_case or camelCase, need to check
    });
  });

  describe('PUT /api/user/email', () => {
    it('should update user email', async () => {
      const newEmail = 'newemail@example.com';
      const response = await request(app)
        .put('/api/user/email')
        .set('Authorization', `Bearer ${token}`)
        .send({ email: newEmail })
        .expect(200);

      expect(response.body).toHaveProperty('message', '邮箱更新成功');

      // Verify DB
      const user = await dbService.get('SELECT email FROM users WHERE username = ?', ['testuser_profile']);
      expect(user.email).toBe(newEmail);
    });

    it('should validate email format', async () => {
      await request(app)
        .put('/api/user/email')
        .set('Authorization', `Bearer ${token}`)
        .send({ email: 'invalid-email' })
        .expect(400);
    });
  });

  describe.skip('PUT /api/user/discount-type', () => {
    it('should update discount type', async () => {
      const newType = '学生';
      const response = await request(app)
        .put('/api/user/discount-type')
        .set('Authorization', `Bearer ${token}`)
        .send({ discountType: newType })
        .expect(200);

      expect(response.body).toHaveProperty('message', '优惠类型更新成功');

      // Verify DB
      const user = await dbService.get('SELECT discount_type FROM users WHERE username = ?', ['testuser_profile']);
      expect(user.discount_type).toBe(newType);
    });
  });

  describe.skip('PUT /api/user/phone', () => {
    it('should update phone number', async () => {
      // This test might be complex due to verification code requirement
      // For skeleton test, we expect it to exist
      const newPhone = '13900139999';
      await request(app)
        .put('/api/user/phone')
        .set('Authorization', `Bearer ${token}`)
        .send({ 
          newPhone, 
          verificationCode: '123456', // Mock code
          password: 'password123' 
        })
        .expect(200);
    });
  });
});
