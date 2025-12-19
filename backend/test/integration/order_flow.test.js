const request = require('supertest');
const app = require('../../src/app');
const dbService = require('../../src/domain-providers/dbService');
const databaseManager = require('../../src/infra-config/database');

describe('Order Flow Integration', () => {
  beforeAll(async () => {
    await databaseManager.initDatabase();
  });

  describe('GET /api/trains/:trainId', () => {
    it('should return train details with seats', async () => {
      const res = await request(app).get('/api/trains/1');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('train_no', 'G27');
      expect(res.body).toHaveProperty('seats');
      expect(res.body.seats.length).toBeGreaterThan(0);
      const secondClass = res.body.seats.find(s => s.seat_type_name === '二等座');
      expect(secondClass).toBeDefined();
      expect(secondClass.price).toBe(553);
    });

    it('should return 404 for non-existent train', async () => {
      const res = await request(app).get('/api/trains/999');
      expect(res.statusCode).toBe(404);
    });
  });

  describe('GET /api/passengers', () => {
    it('should return seeded passengers for userId 1', async () => {
      const res = await request(app).get('/api/passengers?userId=1');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.passengers)).toBe(true);
      expect(res.body.passengers.length).toBeGreaterThanOrEqual(2);
      expect(res.body.passengers[0]).toHaveProperty('name');
    });
  });

  describe('POST /api/orders', () => {
    it('should create an order successfully', async () => {
      const payload = {
        trainId: 1,
        passengers: [
          { passengerId: 1, seatTypeId: 1 } // Second Class (553.0)
        ]
      };
      
      const res = await request(app)
        .post('/api/orders')
        .send(payload);
        
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('orderId');
      expect(res.body).toHaveProperty('totalPrice', 553.0);
      
      // Store orderId for next test
      const orderId = res.body.orderId;
      
      // Verify Order Detail
      const detailRes = await request(app).get(`/api/orders/${orderId}`);
      expect(detailRes.statusCode).toBe(200);
      expect(detailRes.body.success).toBe(true);
      expect(detailRes.body.order.status).toBe('PENDING');
      expect(detailRes.body.order.items.length).toBe(1);
      expect(detailRes.body.order.items[0].passenger_id).toBe(1);
    });

    it('should fail if train not found', async () => {
      const payload = {
        trainId: 999,
        passengers: [{ passengerId: 1, seatTypeId: 1 }]
      };
      const res = await request(app).post('/api/orders').send(payload);
      expect(res.statusCode).toBe(500); // Service throws Error, controller catches and returns 500
      expect(res.body.message).toContain('Train not found');
    });
    
    it('should fail if seat type not found', async () => {
        const payload = {
          trainId: 1,
          passengers: [{ passengerId: 1, seatTypeId: 999 }]
        };
        const res = await request(app).post('/api/orders').send(payload);
        expect(res.statusCode).toBe(500);
        expect(res.body.message).toContain('Seat type 999 not found');
    });
  });
});
