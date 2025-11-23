const express = require('express');
const trainController = require('../request-handlers/trainController');

const router = express.Router();

router.get('/', trainController.getTrains);

module.exports = router;