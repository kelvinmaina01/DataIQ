/**
 * Simple Express Server for Database API
 * Run with: node backend/server.js
 */

import "reflect-metadata";
import dotenv from 'dotenv';

// Load environment variables
// Load environment variables from root directory
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '../.env');
console.log('Loading .env from:', envPath);
const result = dotenv.config({ path: envPath });
if (result.error) {
    console.error('Error loading .env file:', result.error);
}

import express from 'express';
import cors from 'cors';
import databaseRoutes from './routes/database';
import integrationRoutes from './integrations/routes';
import notebookRoutes from './notebook/routes';
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
app.use('/api/notebook', notebookRoutes);
app.use('/api/v1', notebookRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 Handler for undefined routes
app.use((req, res) => {
    console.log(`[404] Route not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 DataIQ Backend Server running on port ${PORT}`);
    console.log(`📡 Database API: http://localhost:${PORT}/api/database`);
    console.log(`🔗 Integrations API: http://localhost:${PORT}/api/integrations`);
    console.log(`🧠 Notebook API: http://localhost:${PORT}/api/notebook`);
    console.log(`💚 Health Check: http://localhost:${PORT}/health\n`);
});

export default app;
