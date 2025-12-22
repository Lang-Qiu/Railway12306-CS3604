const WebSocket = require('ws');
const passengerService = require('../services/passengerService');

let wss;

const init = (server) => {
  wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    console.log('Client connected');

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        
        if (data.type === 'PASSENGER_UPDATE') {
          await handlePassengerUpdate(ws, data.payload);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({ type: 'ERROR', message: 'Invalid message format' }));
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected');
    });
  });
};

const handlePassengerUpdate = async (ws, payload) => {
  const { userId, passengerId, updates, version } = payload;
  
  try {
    // Optimistic locking check is done in service
    const result = await passengerService.updatePassenger(userId, passengerId, updates, version);
    
    if (result.success) {
      // Broadcast to all clients (including sender, to confirm version update)
      const updatedPassenger = await passengerService.getPassengerById(passengerId);
      broadcast({
        type: 'PASSENGER_UPDATED',
        payload: updatedPassenger
      });
    } else {
      ws.send(JSON.stringify({
        type: 'UPDATE_FAILED',
        payload: { message: 'Version conflict or not found', passengerId }
      }));
    }
  } catch (error) {
    console.error('Update error:', error);
    ws.send(JSON.stringify({
      type: 'ERROR',
      message: 'Update failed internal error'
    }));
  }
};

const broadcast = (data) => {
  if (!wss) return;
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
};

module.exports = { init, broadcast };
