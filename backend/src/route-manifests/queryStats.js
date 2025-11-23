const express = require('express')
const qs = require('../monitoring/queryStats')
const router = express.Router()
router.get('/', (req,res)=>{ res.json({ success:true, stats: qs.snapshot() }) })
module.exports = router