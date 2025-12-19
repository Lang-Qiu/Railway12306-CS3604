const request = require('supertest')
const app = require('../../src/app')
const databaseManager = require('../../src/infra-config/database')

describe('Orders API', () => {
  beforeAll(async () => {
    await databaseManager.initDatabase()
  })

  test('should create order', async () => {
    const payload = {
      trainId: 1,
      passengers: [
        { passengerId: 1, seatTypeId: 1 },
        { passengerId: 2, seatTypeId: 1 }
      ]
    }
    const res = await request(app)
      .post('/api/orders')
      .send(payload)
    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body).toHaveProperty('orderId')
    expect(res.body.status).toBe('PENDING')
  })

  test('should get order details by ID', async () => {
    // 1. Create order
    const payload = {
      trainId: 1,
      passengers: [
        { passengerId: 1, seatTypeId: 1 }
      ]
    }
    const createRes = await request(app).post('/api/orders').send(payload)
    expect(createRes.status).toBe(201)
    const { orderId } = createRes.body

    // 2. Get order details
    const res = await request(app).get(`/api/orders/${orderId}`)
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toBeDefined()
    expect(res.body.data).toHaveProperty('id', orderId.toString())
    // Note: train info depends on DB seed data for trainId=1
    expect(res.body.data.train).toBeDefined() 
  })
})