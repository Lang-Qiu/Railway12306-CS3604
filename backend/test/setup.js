const path = require('path')
const fs = require('fs')

// 设置测试环境变量
process.env.NODE_ENV = 'test'
// 使用唯一的数据库文件避免锁冲突
const uniqueId = Date.now() + '-' + Math.floor(Math.random() * 1000)
process.env.TEST_DB_PATH = path.join(__dirname, `test-${uniqueId}.db`)
process.env.DB_PATH = process.env.TEST_DB_PATH
process.env.JWT_SECRET = 'test-jwt-secret-key'
process.env.JWT_EXPIRES_IN = '1h'

// 清理旧的测试数据库 (Optional, maybe cleanup old ones matching pattern?)
const testDbPath = process.env.TEST_DB_PATH
if (fs.existsSync(testDbPath)) {
  try {
    fs.unlinkSync(testDbPath)
  } catch (err) {
    // 文件可能被锁定，等待一下再试
    console.log('等待数据库文件解锁...')
    setTimeout(() => {
      try {
        if (fs.existsSync(testDbPath)) {
          fs.unlinkSync(testDbPath)
        }
      } catch (e) {
        // 忽略删除错误，让测试继续
        console.warn('无法删除旧数据库文件，将使用现有文件')
      }
    }, 500)
  }
}

// 导入dbService以初始化数据库
const dbService = require('../src/services/dbService')
const { initTestDatabase } = require('./init-test-db')

// 给数据库一点时间来初始化
beforeAll(async () => {
  // 0. 等待 dbService 自动初始化完成 (避免并发操作)
  await new Promise(resolve => setTimeout(resolve, 1000))

  // 1. 先关闭 dbService 的连接，防止文件锁冲突
  await dbService.close()
  
  // 2. 等待文件锁释放
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // 3. 初始化测试数据库（创建表和插入测试数据）
  console.log('开始初始化测试数据库...');
  await initTestDatabase(testDbPath)
  console.log('测试数据库初始化完成');
  
  // 4. 重新初始化 dbService 连接，供测试使用
  dbService.init()
  
  // 5. 等待 dbService 连接建立
  await new Promise(resolve => setTimeout(resolve, 500))
}, 60000) // 增加 Hook 超时时间到 60s

// 全局测试设置
afterAll(async () => {
  // 关闭数据库连接（等待完成）
  await dbService.close()
  
  // 给数据库更多时间来完全释放文件锁
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // 删除测试数据库文件
  if (fs.existsSync(testDbPath)) {
    try {
      fs.unlinkSync(testDbPath)
    } catch (err) {
      // 在 Windows 上文件可能仍被锁定，忽略删除错误
      console.warn('无法删除测试数据库文件:', err.message)
    }
  }
})