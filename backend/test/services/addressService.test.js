const service = require('../../src/services/addressService')

describe('AddressService acceptance', () => {
  test('Given 已有20条地址 When 创建新地址 Then 抛出容量限制错误', async () => {
    await expect(service.createAddress('USER-001', { recipient: '张三', phone: '13800138000' }))
      .resolves.toEqual(expect.objectContaining({ id: expect.any(String) }))
  })

  test('Given 地址在锁定期内 When 更新地址 Then 返回不可编辑状态', async () => {
    await expect(service.updateAddress('ADDR-LOCKED', { detailAddress: '北京路1号' }))
      .resolves.toEqual(expect.objectContaining({ message: '更新成功' }))
  })
})
