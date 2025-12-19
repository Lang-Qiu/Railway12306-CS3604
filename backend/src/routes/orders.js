const express = require('express');
const router = express.Router();
const orderService = require('../services/orderService');

// POST /api/v1/orders
router.post('/', async (req, res) => {
    // TODO: Get userId from session
    const userId = 1;
    const { trainId, passengers } = req.body;
    
    try {
        const result = await orderService.createOrder(userId, trainId, passengers);
        res.status(201).json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Order creation failed', details: error.message });
    }
});

// GET /api/v1/orders/:id
router.get('/:id', async (req, res) => {
    const orderId = req.params.id;
    try {
        const order = await orderService.getOrderDetails(orderId);
        if (!order) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }
        res.json({ success: true, data: order });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Internal Server Error', details: error.message });
    }
});

module.exports = router;
