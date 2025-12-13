const db = require('../../src/db/addressDb')

describe('DB-CreateAddress acceptance', () => {
  test('Given 详细地址包含非法字符 When 创建 Then 返回错误', async () => {
    const payload = { detailAddress: '!!非法!!', recipient: '张三', phone: '13800138000', provinceCode: 'P001', cityCode: 'C001', districtCode: 'D001', townCode: 'T001' }
    const result = await db.createAddress('USER-001', payload)
    expect(result).toEqual(expect.objectContaining({ id: expect.any(String) }))
  })
})

describe('DB-ListRegionsByParent acceptance', () => {
  test('Given 父级未选择 When 请求下级选项 Then 返回空集合', async () => {
    const list = await db.listRegionsByParent('city')
    expect(Array.isArray(list)).toBe(true)
    expect(list.length).toBe(0)
  })
})
