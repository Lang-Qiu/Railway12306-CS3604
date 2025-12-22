const express = require('express');
const router = express.Router();
const passengerService = require('../services/passengerService');

// Helper to get current user ID (mock for now)
const getUserId = (req) => {
    // TODO: Get userId from session/token
    return 1;
};

// GET /api/v1/passengers
router.get('/', async (req, res) => {
  const userId = getUserId(req);
  try {
    const passengers = await passengerService.getPassengersByUserId(userId);
    res.json(passengers);
  } catch (error) {
    console.error('Error fetching passengers:', error);
    res.status(500).json({ error: 'Failed to fetch passengers' });
  }
});

// GET /api/v1/passengers/search?q=name
router.get('/search', async (req, res) => {
    const userId = getUserId(req);
    const query = req.query.q;
    try {
        const passengers = await passengerService.searchPassengers(userId, query);
        res.json(passengers);
    } catch (error) {
        console.error('Error searching passengers:', error);
        res.status(500).json({ error: 'Failed to search passengers' });
    }
});

// POST /api/v1/passengers
router.post('/', async (req, res) => {
    const userId = getUserId(req);
    try {
        const result = await passengerService.createPassenger(userId, req.body);
        res.status(201).json(result);
    } catch (error) {
        console.error('Error creating passenger:', error);
        res.status(500).json({ error: 'Failed to create passenger' });
    }
});

const wsServer = require('../websocket/wsServer');

// PUT /api/v1/passengers/:id
router.put('/:id', async (req, res) => {
    const userId = getUserId(req);
    const passengerId = req.params.id;
    // req.body should contain 'version' for concurrency control
    try {
        // If the frontend sends version, use it. Otherwise, strictly speaking we should fail or fetch first.
        // For now, let's assume if version is present we check it.
        const currentVersion = req.body.version;
        
        const result = await passengerService.updatePassenger(userId, passengerId, req.body, currentVersion);
        if (result.success) {
            // Fetch updated passenger to broadcast
            const updatedPassenger = await passengerService.getPassengerById(passengerId);
            wsServer.broadcast({
                type: 'PASSENGER_UPDATED',
                payload: updatedPassenger
            });
            res.json({ success: true, passenger: updatedPassenger });
        } else {
            res.status(409).json({ error: 'Passenger not found or version conflict' });
        }
    } catch (error) {
        console.error('Error updating passenger:', error);
        res.status(500).json({ error: 'Failed to update passenger' });
    }
});

// DELETE /api/v1/passengers/:id
router.delete('/:id', async (req, res) => {
    const userId = getUserId(req);
    const passengerId = req.params.id;
    try {
        const result = await passengerService.deletePassenger(userId, passengerId);
        if (result.success) {
            wsServer.broadcast({
                type: 'PASSENGER_DELETED',
                payload: { id: parseInt(passengerId) }
            });
            res.json(result);
        } else {
            res.status(404).json({ error: 'Passenger not found' });
        }
    } catch (error) {
        console.error('Error deleting passenger:', error);
        res.status(500).json({ error: 'Failed to delete passenger' });
    }
});

module.exports = router;
