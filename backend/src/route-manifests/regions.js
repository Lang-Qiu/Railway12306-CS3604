const express = require('express')
const router = express.Router()
const db = require('../db/addressDb')

router.get('/regions', async (req, res) => {
  const { level, parentCode } = req.query
  const options = await db.listRegionsByParent(level, parentCode)
  res.status(200).json({ options })
})

module.exports = router
