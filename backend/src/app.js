require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

process.env.JSON_DB_INMEMORY = process.env.JSON_DB_INMEMORY || '1';

const authRoutes = require('./route-manifests/auth');
const registerRoutes = require('../modules/register-migrated/routes/register');
const orderRoutes = require('./route-manifests/orders');
const passengerRoutes = require('./routes/passengers');
const stationRoutes = require('./route-manifests/stations');
const ticketRoutes = require('./route-manifests/tickets');
const metricsRoutes = require('./route-manifests/metrics');
const queryStatsRoutes = require('./route-manifests/queryStats');
const trainRoutes = require('./route-manifests/trains');
const userRoutes = require('./route-manifests/user');
const dbService = require('./domain-providers/dbService');
const errorHandler = require('./request-interceptors/errorHandler');
const jsonDbService = require('./domain-providers/jsonDbService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/register', registerRoutes);
app.use('/api/terms', registerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/passengers', passengerRoutes);
app.use('/api/stations', stationRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/query-stats', queryStatsRoutes);
app.use('/api/trains', trainRoutes);
app.use('/api/user', userRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const databaseManager = require('./infra-config/database');
const http = require('http');
const wsServer = require('./websocket/wsServer');

async function startServer() {
  await jsonDbService.connect();
  await databaseManager.initDatabase();
  
  const server = http.createServer(app);
  wsServer.init(server);
  
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

if (require.main === module) {
  startServer().catch(err => {
    console.error('Failed to start server', err);
    process.exit(1);
  });
}

module.exports = app;
