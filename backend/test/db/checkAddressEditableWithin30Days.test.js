const db = require('../../src/db/addressDb')

describe('DB-CheckAddressEditableWithin30Days acceptance', () => {
  test('Given 地址用于已支付订单且在30天内 When 检查 Then 返回不可编辑/删除状态', async () => {
    const status = await db.checkAddressEditableWithin30Days('ADDR-LOCKED')
    expect(status).toEqual(expect.objectContaining({ editable: false, deletable: false, lockedUntil: expect.any(String) }))
  })
})

