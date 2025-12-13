const db = require('../../src/db/addressDb')

describe('DB-CountUserAddresses acceptance', () => {
  test('Given 用户ID When 统计数量 Then 返回整数且用于校验20条限制', async () => {
    const count = await db.countUserAddresses('USER-001')
    expect(Number.isInteger(count)).toBe(true)
    expect(count).toBeLessThanOrEqual(20)
  })
})

