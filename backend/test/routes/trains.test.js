const request = require('supertest')
const app = require('../../src/app')
const databaseManager = require('../../src/config/database')
const dbService = require('../../src/services/dbService')

describe('Trains API', () => {
  let dateStr;

  beforeAll(async () => {
    await databaseManager.initDatabase(true)
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    dateStr = tomorrow.toISOString().split('T')[0];

    // Seed Train G1 (Tomorrow)
    await dbService.run(
        `INSERT INTO trains (train_no, departure_date, departure_station, arrival_station, 
         departure_time, arrival_time, second_class_seat_price, second_class_seat_count, is_direct) 
         VALUES ('G1', ?, '北京南', '上海虹桥', '08:00', '12:00', 500.00, 100, 1)`,
        [dateStr]
    );

    // Seed Train G2 (Today)
    const todayStr = today.toISOString().split('T')[0];
    await dbService.run(
        `INSERT INTO trains (train_no, departure_date, departure_station, arrival_station, 
         departure_time, arrival_time, second_class_seat_price, second_class_seat_count, is_direct) 
         VALUES ('G2', ?, '北京南', '上海虹桥', '09:00', '13:00', 500.00, 100, 1)`,
        [todayStr]
    );

    // Verify insert
    const t = await dbService.all('SELECT * FROM trains');
    console.log('Trains in DB:', t);

    // Seed Train Stops for G1
    await dbService.run(
        `INSERT INTO train_stops (train_no, station, seq, depart_time, arrive_time, distance) 
         VALUES ('G1', '北京南', 1, '08:00', '08:00', 0)`
    );
    await dbService.run(
        `INSERT INTO train_stops (train_no, station, seq, depart_time, arrive_time, distance) 
         VALUES ('G1', '上海虹桥', 2, '12:00', '12:00', 1318)`
    );

    // Seed Train Stops for G2
    await dbService.run(
        `INSERT INTO train_stops (train_no, station, seq, depart_time, arrive_time, distance) 
         VALUES ('G2', '北京南', 1, '09:00', '09:00', 0)`
    );
    await dbService.run(
        `INSERT INTO train_stops (train_no, station, seq, depart_time, arrive_time, distance) 
         VALUES ('G2', '上海虹桥', 2, '13:00', '13:00', 1318)`
    );
  })

  test('POST /search returns trains', async () => {
    const res = await request(app)
      .post('/api/trains/search')
      .send({ 
        departureStation: '北京', 
        arrivalStation: '上海', 
        departureDate: dateStr 
      })
    
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('trains')
    expect(Array.isArray(res.body.trains)).toBe(true)
    console.log('Search result:', res.body.trains[0]);
    // Note: searchTrains does city mapping (北京 -> 北京南, 上海 -> 上海虹桥)
    expect(res.body.trains.length).toBeGreaterThan(0)
    expect(res.body.trains[0].trainNo).toBe('G1')
  })

  test('GET /:trainNo returns train details', async () => {
    const res = await request(app).get('/api/trains/G2')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('trainNo', 'G2')
  })

  test('GET /:trainNo returns 404 for unknown train', async () => {
    const res = await request(app).get('/api/trains/UNKNOWN')
    expect(res.status).toBe(404)
  })
})
