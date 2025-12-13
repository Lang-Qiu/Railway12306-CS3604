const db = require('../../src/db/addressDb')

describe('DB-UpdateAddress acceptance', () => {
  test('Given 地址未锁定 When 更新 Then 返回更新后的地址对象', async () => {
    const updated = await db.updateAddress('ADDR-001', { detailAddress: '北京路1号', recipient: '张三', phone: '13800138000' })
    expect(updated).toEqual(expect.objectContaining({ id: 'ADDR-001', detailAddress: '北京路1号' }))
  })
})

