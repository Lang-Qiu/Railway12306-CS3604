async function listUserAddresses(userId) {
  const db = require('../db/addressDb')
  const list = await db.listUserAddresses(userId)
  return list
}

async function createAddress(userId, payload) {
  const db = require('../db/addressDb')
  const created = await db.createAddress(userId, payload)
  return created
}

async function updateAddress(id, payload) {
  const db = require('../db/addressDb')
  const updated = await db.updateAddress(id, payload)
  return { ...updated, message: '更新成功' }
}

async function deleteAddress(id) {
  const db = require('../db/addressDb')
  const result = await db.deleteAddress(id)
  return result
}

async function checkEditableWithin30Days(id) {
  const db = require('../db/addressDb')
  const status = await db.checkAddressEditableWithin30Days(id)
  return status
}

module.exports = {
  listUserAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  checkEditableWithin30Days,
}
