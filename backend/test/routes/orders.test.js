const request = require('supertest');
const app = require('../../src/app');
const databaseManager = require('../../src/config/database');
const dbService = require('../../src/services/dbService');

describe('Orders API', () => {
  let userId;
  let passengerId;
  let token;

  beforeAll(async () => {
    // Initialize DB
    await databaseManager.initDatabase(true); // use test db
    
    // 1. Create User
    await dbService.run(
        `INSERT INTO users (username, password, phone, email, name, id_card_number) 
         VALUES ('testuser', 'hash', '13800000001', 'test@example.com', 'Test User', '110101199001011234')`
    );
    const userRes = await dbService.all("SELECT id FROM users WHERE username = 'testuser'");
    userId = userRes[0].id;

    // 2. Generate Token
    token = Buffer.from(JSON.stringify({ 
        userId: userId, 
        username: 'testuser', 
        timestamp: Date.now() 
    })).toString('base64');

    // 3. Create Train
    await dbService.run(
        `INSERT INTO trains (train_no, departure_date, departure_station, arrival_station, 
         departure_time, arrival_time, second_class_seat_price, second_class_seat_count) 
         VALUES ('G1', '2023-10-01', 'StationA', 'StationB', '08:00', '12:00', 100.00, 100)`
    );

    // 4. Create Passenger
    const uuid = require('crypto').randomUUID();
    passengerId = uuid;
    await dbService.run(
        `INSERT INTO passengers (id, user_id, name, id_card_type, id_card_number, phone, points) 
         VALUES (?, ?, 'Passenger1', '居民身份证', '110101199001011234', '13800000002', 0)`,
        [passengerId, userId]
    );

    // 5. Create Train Stops
    await dbService.run(
        `INSERT INTO train_stops (train_no, station, seq, depart_time, arrive_time, distance) 
         VALUES ('G1', 'StationA', 1, '08:00', '08:00', 0)`
    );
    await dbService.run(
        `INSERT INTO train_stops (train_no, station, seq, depart_time, arrive_time, distance) 
         VALUES ('G1', 'StationB', 2, '12:00', '12:00', 500)`
    );

    // 6. Create Train Fares
    await dbService.run(
        `INSERT INTO train_fares (train_no, from_station, to_station, distance_km, second_class_price, first_class_price, business_price) 
         VALUES ('G1', 'StationA', 'StationB', 500, 100.00, 200.00, 300.00)`
    );

    // 7. Create Seat Status
    // We need at least one available seat
    await dbService.run(
        `INSERT INTO seat_status (train_no, departure_date, seat_type, seat_no, from_station, to_station, status) 
         VALUES ('G1', '2023-10-01', '二等座', '01A', 'StationA', 'StationB', 'available')`
    );
  });

  test('should create order', async () => {
    const payload = {
      trainNo: 'G1',
      departureStation: 'StationA',
      arrivalStation: 'StationB',
      departureDate: '2023-10-01',
      passengers: [
        { passengerId: passengerId, seatType: '二等座' }
      ]
    };

    const res = await request(app)
      .post('/api/orders/submit')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    if (res.status !== 200) {
        console.error('Create order failed:', res.body);
    }
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('orderId');
    expect(res.body.message).toBe('订单提交成功');
  });

  test('should get order details by ID', async () => {
    // 1. Create order
    const payload = {
      trainNo: 'G1',
      departureStation: 'StationA',
      arrivalStation: 'StationB',
      departureDate: '2023-10-01',
      passengers: [
        { passengerId: passengerId, seatType: '二等座' }
      ]
    };

    const createRes = await request(app)
        .post('/api/orders/submit')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);
    
    expect(createRes.status).toBe(200);
    const { orderId } = createRes.body;

    // 2. Get order details
    const res = await request(app)
        .get(`/api/orders/${orderId}/confirmation`)
        .set('Authorization', `Bearer ${token}`);
        
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('trainInfo');
    expect(res.body.trainInfo.trainNo).toBe('G1');
    expect(res.body.passengers).toHaveLength(1);
    expect(res.body.totalPrice).toBe(100);
  });
});
