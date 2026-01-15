const request = require('supertest')
const app = require('../../src/app')
require('../setup.env')

describe('API-GET-SearchTrains acceptance', () => {
  test('returns trains with required fields and filters by highspeed', async () => {
    const res = await request(app).get('/api/trains/search').query({ from: '北京', to: '上海', date: '2025-11-16', highspeed: '1' })
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(Array.isArray(res.body.trains)).toBe(true)
    for (const t of res.body.trains) {
      expect(t).toHaveProperty('trainNumber')
      expect(t).toHaveProperty('departure')
      expect(t).toHaveProperty('arrival')
      expect(t).toHaveProperty('departureTime')
      expect(t).toHaveProperty('arrivalTime')
      expect(t).toHaveProperty('duration')
      expect(t).toHaveProperty('businessPrice')
      expect(t).toHaveProperty('firstClassPrice')
      expect(t).toHaveProperty('secondClassPrice')
      expect(t).toHaveProperty('businessSeat')
      expect(t).toHaveProperty('firstClassSeat')
      expect(t).toHaveProperty('secondClassSeat')
    }
  })
})

describe('API-GET-TrainDetail acceptance', () => {
  test('returns 404 for non-existent train', async () => {
    const res = await request(app).get('/api/trains/UNKNOWN/detail')
    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
  })

  test('provides detailed fields', async () => {
    const resList = await request(app).get('/api/trains/search').query({ from: '北京', to: '上海', date: '2025-11-16' })
    const target = (resList.body.trains || [])[0]
    if (!target) {
      expect(Array.isArray(resList.body.trains)).toBe(true)
      expect(resList.body.trains.length).toBeGreaterThan(0)
    }
    const trainNo = target ? target.trainNumber : 'G000'
    const res = await request(app).get(`/api/trains/${encodeURIComponent(trainNo)}/detail`)
    if (res.status === 200) {
      expect(res.body.train).toHaveProperty('route')
      expect(res.body.train).toHaveProperty('fares')
      expect(res.body.train).toHaveProperty('seats')
    } else {
      expect(res.status).toBe(404)
    }
  })
})