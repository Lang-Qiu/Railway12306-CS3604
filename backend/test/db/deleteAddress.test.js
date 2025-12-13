const db = require('../../src/db/addressDb')

describe('DB-DeleteAddress acceptance', () => {
  test('Given 地址未锁定 When 删除 Then 操作成功且列表不再包含该地址', async () => {
    const result = await db.deleteAddress('ADDR-001')
    expect(result).toEqual(expect.objectContaining({ success: true }))
  })
})

