const db = require('../../src/db/addressDb')

describe('DB-GetAddressById acceptance', () => {
  test('Given 存在地址ID When 查询 Then 返回完整地址对象', async () => {
    const address = await db.getAddressById('ADDR-001')
    expect(address).toEqual(expect.objectContaining({ id: 'ADDR-001' }))
  })
})

