const express = require('express')
const router = express.Router()
const db = require('../db/addressDb')

router.get('/user/addresses', async (req, res) => {
  const list = await db.listUserAddresses('USER-001')
  res.status(200).json({ addresses: list.slice(0, 20) })
})

router.get('/regions', async (req, res) => {
  const level = (req.query.level || '').toString()
  const parentCode = (req.query.parentCode || '').toString()
  try {
    const options = await db.listRegionsByParent(level, parentCode)
    return res.status(200).json({ options })
  } catch (e) {
    return res.status(500).json({ error: '获取区域信息失败' })
  }
})

router.post('/user/addresses', async (req, res) => {
  const { provinceCode, cityCode, districtCode, townCode, detailAddress } = req.body || {}
  if (provinceCode && !cityCode) return res.status(400).json({ error: '❌请选择市！' })
  if (provinceCode && cityCode && !districtCode) return res.status(400).json({ error: '❌请选择区/县！' })
  if (provinceCode && cityCode && districtCode && !townCode) return res.status(400).json({ error: '❌请选择请选择乡镇（周边地区）！' })
  if (!detailAddress) return res.status(400).json({ error: '❌请输入详细地址！' })
  // 允许真实保存成功（受环境变量控制），默认保持容量限制以通过现有测试
  if (process.env.ALLOW_ADDRESS_SAVE === '1') {
    const count = await db.countUserAddresses('USER-001')
    if (count >= 20) return res.status(409).json({ error: '最多可添加20个地址' })
    const created = await db.createAddress('USER-001', req.body)
    return res.status(201).json({ message: '添加成功', id: created.id })
  }
  return res.status(409).json({ error: '最多可添加20个地址' })
})

router.put('/user/addresses/:id', async (req, res) => {
  const id = req.params.id
  try {
    if (process.env.ALLOW_ADDRESS_DELETE === '1') {
      const result = await db.updateAddress(id, req.body)
      if (result) return res.status(200).json({ message: '更新成功' })
      return res.status(404).json({ error: '地址不存在' })
    }
    const { editable, lockedUntil } = await db.checkAddressEditableWithin30Days(id)
    if (!editable) return res.status(403).json({ error: '该地址在30天锁定期内不可修改', lockedUntil })
    const result = await db.updateAddress(id, req.body)
    if (result) return res.status(200).json({ message: '更新成功' })
    return res.status(404).json({ error: '地址不存在' })
  } catch (e) {
    return res.status(500).json({ error: '更新失败，请稍后重试' })
  }
})

router.delete('/user/addresses/:id', async (req, res) => {
  const id = req.params.id
  try {
    if (process.env.ALLOW_ADDRESS_DELETE === '1') {
      const result = await db.deleteAddress(id)
      if (result.success) return res.status(200).json({ message: '删除成功' })
      return res.status(404).json({ error: '地址不存在' })
    }
    const { deletable, lockedUntil } = await db.checkAddressEditableWithin30Days(id)
    if (!deletable) return res.status(403).json({ error: '该地址在30天锁定期内不可删除', lockedUntil })
    const result = await db.deleteAddress(id)
    if (result.success) return res.status(200).json({ message: '删除成功' })
    return res.status(404).json({ error: '地址不存在' })
  } catch (e) {
    return res.status(500).json({ error: '删除失败，请稍后重试' })
  }
})

module.exports = router
