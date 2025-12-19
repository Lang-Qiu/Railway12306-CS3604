const orderService = require('../domain-providers/orderService');

class OrderController {
  async createOrder(req, res) {
    try {
      // In a real app, userId comes from auth middleware
      const userId = req.headers['x-user-id'] || req.body.userId || 1;
      const { trainId, passengers } = req.body;

      if (!trainId || !passengers || !Array.isArray(passengers) || passengers.length === 0) {
        return res.status(400).json({ success: false, message: 'Missing required parameters: trainId and passengers' });
      }

      const result = await orderService.createOrder(userId, trainId, passengers);
      return res.status(201).json({ success: true, ...result });

    } catch (error) {
      console.error('Create order error:', error);
      return res.status(500).json({ success: false, message: error.message || 'Failed to create order' });
    }
  }

  async getOrderDetail(req, res) {
    try {
      const userId = req.headers['x-user-id'] || req.query.userId || 1;
      const { orderId } = req.params;
      
      const order = await orderService.getOrder(orderId, userId);
      
      if (!order) {
        // Fallback: If not found for userId 1, try without userId check for testing/mocking
        // Or if using mock data in PayPage which uses '12345'
        // Let's allow fetching if it's a mock ID like '12345' or simple number
        // But orderService.getOrder strictly checks userId. 
        // For development, let's relax or ensure PayPage sends correct userId or create a mock order.
        return res.status(404).json({ success: false, message: 'Order not found' });
      }
      
      return res.json({ success: true, data: order });
    } catch (error) {
      console.error('Get order detail error:', error);
      return res.status(500).json({ success: false, message: 'Failed to retrieve order details' });
    }
  }

  async listOrders(req, res) {
     // TODO: Implement list orders via orderService if needed
     res.status(501).json({ message: 'Not implemented' });
  }

  async confirmOrder(req, res) {
      res.status(501).json({ message: 'Not implemented' });
  }

  async newOrderData(req, res) {
      res.status(501).json({ message: 'Not implemented' });
  }
}

module.exports = new OrderController();
