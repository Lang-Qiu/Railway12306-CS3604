const express = require('express')
const metrics = require('../monitoring/metrics')

const router = express.Router()

router.get('/', (req,res) => {
  res.json({ success: true, metrics: metrics.snapshot() })
})

module.exports = router