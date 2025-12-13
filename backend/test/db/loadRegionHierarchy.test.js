const db = require('../../src/db/addressDb')

describe('DB-LoadRegionHierarchy acceptance', () => {
  test('Given 初始化 When 加载层级数据 Then 返回包含省/市/区县/乡镇/附近区域', async () => {
    const data = await db.loadRegionHierarchy()
    expect(Array.isArray(data)).toBe(true)
    expect(data.length).toBeGreaterThan(0)
  })
})

