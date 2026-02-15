/**
 * Simple Express Server for Database API
 * Run with: node backend/server.js
 */

import "reflect-metadata";
import express from 'express';
import cors from 'cors';
import databaseRoutes from './routes/database';
import integrationRoutes from './integrations/routes';
import { initializeDIContainer } from './services/database-service/di/container';

// Initialize DI container
initializeDIContainer();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/integrations', integrationRoutes);
app.use('/api/database', databaseRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 DataIQ Backend Server running on port ${PORT}`);
    console.log(`📡 Database API: http://localhost:${PORT}/api/database`);
    console.log(`🔗 Integrations API: http://localhost:${PORT}/api/integrations`);
    console.log(`💚 Health Check: http://localhost:${PORT}/health\n`);
});

export default app;
