const request = require('supertest')
const app = require('../../src/app')
require('../setup.env')

describe('API-GET-SearchTrains extra acceptance', () => {
  test('400 when missing params', async () => {
    const res = await request(app).get('/api/trains/search')
    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  test('highspeed=1 filters to G/D or 高速', async () => {
    const res = await request(app).get('/api/trains/search').query({ from: '北京', to: '上海', date: '2025-11-16', highspeed: '1' })
    expect(res.status).toBe(200)
    for (const t of res.body.trains) {
      const ok = t.trainNumber.startsWith('G') || t.trainNumber.startsWith('D')
      expect(ok).toBe(true)
    }
  })
})

describe('API-GET-TrainDetail extra acceptance', () => {
  test('200 for existing train with required fields', async () => {
    const res = await request(app).get('/api/trains/G101/detail')
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.train).toHaveProperty('route')
    expect(res.body.train).toHaveProperty('fares')
    expect(res.body.train).toHaveProperty('seats')
  })
})