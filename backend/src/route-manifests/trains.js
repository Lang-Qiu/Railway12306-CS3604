const express = require('express');
const trainController = require('../request-handlers/trainController');

const router = express.Router();

router.get('/search', trainController.searchTrains);
router.get('/:trainNo/detail', trainController.getTrainDetail);

module.exports = router;
