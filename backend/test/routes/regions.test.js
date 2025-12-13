const request = require('supertest')
const express = require('express')
const router = require('../../src/route-manifests/regions')

describe('API-GET-RegionOptions acceptance', () => {
  let app
  beforeEach(() => {
    app = express()
    app.use('/api', router)
  })

  test('Given 用户在地址填写表单 When 越级选择(未选择省) Then 下拉列表内容为空', async () => {
    const res = await request(app).get('/api/regions').query({ level: 'city' })
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.options)).toBe(true)
    expect(res.body.options.length).toBe(0)
  })

  test('Given 用户在地址填写表单 When 正常选择(已选择省后选市) Then 返回具体可选内容', async () => {
    const res = await request(app).get('/api/regions').query({ level: 'city', parentCode: 'PROV-001' })
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.options)).toBe(true)
    expect(res.body.options.length).toBeGreaterThan(0)
    for (const item of res.body.options) {
      expect(item).toHaveProperty('code')
      expect(item).toHaveProperty('name')
    }
  })
})
