const express = require('express');
const router = express.Router();
const paymentService = require('../services/paymentService');

// POST /api/v1/payment/:orderId/confirm
router.post('/:orderId/confirm', async (req, res) => {
    const { orderId } = req.params;
    try {
        const result = await paymentService.confirmPayment(orderId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Payment failed', details: error.message });
    }
});

// POST /api/v1/payment/:orderId/cancel
router.post('/:orderId/cancel', async (req, res) => {
    const { orderId } = req.params;
    try {
        const result = await paymentService.cancelOrder(orderId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Cancellation failed', details: error.message });
    }
});

module.exports = router;
