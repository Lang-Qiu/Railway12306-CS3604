const request = require('supertest')
const express = require('express')
const router = require('../../src/route-manifests/addresses')

describe('API-GET-UserAddresses acceptance', () => {
  let app
  beforeEach(() => {
    app = express()
    app.use('/api', router)
  })

  test('Given 已登录用户进入地址管理页 When 页面加载完成 Then 返回最多20条地址且按时间倒序', async () => {
    const res = await request(app).get('/api/user/addresses')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.addresses)).toBe(true)
    expect(res.body.addresses.length).toBeLessThanOrEqual(20)
  })
})

describe('API-POST-UserAddresses acceptance', () => {
  let app
  beforeEach(() => {
    app = express()
    app.use(express.json())
    app.use('/api', router)
  })

  test('Given 所在地址未完整选择 When 仅选择到省 Then 返回“❌请选择市！”', async () => {
    const res = await request(app).post('/api/user/addresses').send({ provinceCode: 'P001', detailAddress: '北京路1号', recipient: '张三', phone: '13800138000' })
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error', '❌请选择市！')
  })

  test('Given 所在地址未完整选择 When 仅选择到市 Then 返回“❌请选择区/县！”', async () => {
    const res = await request(app).post('/api/user/addresses').send({ provinceCode: 'P001', cityCode: 'C001', detailAddress: '北京路1号', recipient: '张三', phone: '13800138000' })
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error', '❌请选择区/县！')
  })

  test('Given 所在地址未完整选择 When 仅选择到区县 Then 返回“❌请选择请选择乡镇（周边地区）！”', async () => {
    const res = await request(app).post('/api/user/addresses').send({ provinceCode: 'P001', cityCode: 'C001', districtCode: 'D001', detailAddress: '北京路1号', recipient: '张三', phone: '13800138000' })
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error', '❌请选择请选择乡镇（周边地区）！')
  })

  test('Given 详细地址为空 When 点击保存 Then 返回“❌请输入详细地址！”', async () => {
    const res = await request(app).post('/api/user/addresses').send({ provinceCode: 'P001', cityCode: 'C001', districtCode: 'D001', townCode: 'T001', detailAddress: '', recipient: '张三', phone: '13800138000' })
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error', '❌请输入详细地址！')
  })

  test('Given 已有20条地址 When 点击保存 Then 返回409“最多可添加20个地址”', async () => {
    const res = await request(app).post('/api/user/addresses').send({ provinceCode: 'P001', cityCode: 'C001', districtCode: 'D001', townCode: 'T001', detailAddress: '北京路1号', recipient: '张三', phone: '13800138000' })
    expect(res.status).toBe(409)
    expect(res.body).toHaveProperty('error', '最多可添加20个地址')
  })
})

describe('API-PUT-UserAddress acceptance', () => {
  let app
  beforeEach(() => {
    app = express()
    app.use(express.json())
    app.use('/api', router)
  })

  test('Given 地址在30天锁定期内 When 点击保存 Then 返回403', async () => {
    const res = await request(app).put('/api/user/addresses/ADDR-001').send({ provinceCode: 'P001', cityCode: 'C001', districtCode: 'D001', townCode: 'T001', detailAddress: '北京路1号', recipient: '张三', phone: '13800138000' })
    expect(res.status).toBe(403)
    expect(res.body).toHaveProperty('error')
  })
})

describe('API-DELETE-UserAddress acceptance', () => {
  let app
  beforeEach(() => {
    app = express()
    app.use('/api', router)
  })

  test('Given 地址在30天锁定期内 When 确认删除 Then 返回403', async () => {
    const res = await request(app).delete('/api/user/addresses/ADDR-001')
    expect(res.status).toBe(403)
    expect(res.body).toHaveProperty('error')
  })
})
