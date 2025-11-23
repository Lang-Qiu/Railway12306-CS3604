const request = require('supertest')
const app = require('../src/app')

describe('Official 12306 API integration (mock)', () => {
  beforeAll(() => {
    process.env.USE_OFFICIAL_API = '1'
    process.env.OFFICIAL_USE_MOCK = '1'
  })
  test('search returns trains and caches result', async () => {
    const date = new Date().toISOString().split('T')[0]
    const res1 = await request(app).get('/api/trains/search').query({ from: '北京', to: '上海', date })
    expect(res1.status).toBe(200)
    expect(res1.body.success).toBe(true)
    expect(Array.isArray(res1.body.trains)).toBe(true)
    const res2 = await request(app).get('/api/trains/search').query({ from: '北京', to: '上海', date })
    expect(res2.status).toBe(200)
    expect(res2.body.success).toBe(true)
  })
  test('invalid params returns 400', async () => {
    const res = await request(app).get('/api/trains/search').query({ from: '北京', to: '上海' })
    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })
})