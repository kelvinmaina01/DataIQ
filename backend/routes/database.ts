/**
 * Database API Routes
 * REST endpoints for database connectors
 */

import express, { Request, Response } from 'express';
import { z } from 'zod';
import { getDatabaseConnector } from '../services/database-service';
import { container } from '../services/database-service/di/container';
import { CredentialsManager } from '../services/database-service/services/CredentialsManager';
import { DatabaseConnectionManager } from '../services/database-service/services/DatabaseConnectionManager';
import { DatabaseCredentials } from '../services/database-service/interfaces/IDatabaseConnector';

const router = express.Router();

// Validation schemas
const testConnectionSchema = z.object({
    dbType: z.string(),
    credentials: z.object({
        host: z.string(),
        port: z.number(),
        database: z.string(),
        username: z.string(),
        password: z.string(),
        ssl: z.boolean().optional(),
        connectionString: z.string().optional()
    })
});

const connectSchema = z.object({
    dbType: z.string(),
    connectionName: z.string(),
    credentials: z.object({
        host: z.string(),
        port: z.number(),
        database: z.string(),
        username: z.string(),
        password: z.string(),
        ssl: z.boolean().optional(),
        connectionString: z.string().optional()
    })
});

const querySchema = z.object({
    connectionId: z.string(),
    query: z.string(),
    params: z.array(z.any()).optional()
});

/**
 * POST /api/database/test
 * Test database connection without storing credentials
 */
router.post('/test', async (req: Request, res: Response) => {
    try {
        const { dbType, credentials } = testConnectionSchema.parse(req.body);

        console.log('[Database API] Testing connection:', dbType);

        const connector = getDatabaseConnector(dbType);
        const result = await connector.testConnection(credentials as DatabaseCredentials);

        res.json(result);
    } catch (error: any) {
        console.error('[Database API] Test error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            error: error.toString()
        });
    }
});

/**
 * POST /api/database/connect
 * Establish and save a database connection
 */
router.post('/connect', async (req: Request, res: Response) => {
    try {
        const { dbType, connectionName, credentials } = connectSchema.parse(req.body);

        // TODO: Get userId from auth session
        const userId = req.headers['x-user-id'] as string || 'temp-user-id';

        console.log('[Database API] Connecting:', dbType, connectionName);

        const connector = getDatabaseConnector(dbType);
        const result = await connector.connect(credentials as DatabaseCredentials, connectionName);

        if (result.success && result.connectionId) {
            // Store encrypted credentials in Supabase
            const credentialsManager = container.resolve(CredentialsManager);
            await credentialsManager.storeCredentials(
                userId,
                result.connectionId,
                dbType,
                connectionName,
                credentials
            );

            console.log('[Database API] Connection saved:', result.connectionId);
        }

        res.json(result);
    } catch (error: any) {
        console.error('[Database API] Connect error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            error: error.toString()
        });
    }
});

/**
 * GET /api/database/connections
 * List all user's database connections
 */
router.get('/connections', async (req: Request, res: Response) => {
    try {
        // TODO: Get userId from auth session
        const userId = req.headers['x-user-id'] as string || 'temp-user-id';

        const connectionManager = container.resolve(DatabaseConnectionManager);
        const connections = connectionManager.getUserConnections(userId);

        res.json({
            success: true,
            connections
        });
    } catch (error: any) {
        console.error('[Database API] List error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * GET /api/database/:connectionId/tables
 * List tables in a database connection
 */
router.get('/:connectionId/tables', async (req: Request, res: Response) => {
    try {
        const { connectionId } = req.params;

        const connectionManager = container.resolve(DatabaseConnectionManager);
        const connection = connectionManager.getConnection(connectionId);

        if (!connection) {
            return res.status(404).json({
                success: false,
                message: 'Connection not found'
            });
        }

        const connector = getDatabaseConnector(connection.connectorType);
        const tables = await connector.listTables(connectionId);

        res.json({
            success: true,
            tables
        });
    } catch (error: any) {
        console.error('[Database API] List tables error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * GET /api/database/:connectionId/schema/:tableName
 * Get table schema
 */
router.get('/:connectionId/schema/:tableName', async (req: Request, res: Response) => {
    try {
        const { connectionId, tableName } = req.params;

        const connectionManager = container.resolve(DatabaseConnectionManager);
        const connection = connectionManager.getConnection(connectionId);

        if (!connection) {
            return res.status(404).json({
                success: false,
                message: 'Connection not found'
            });
        }

        const connector = getDatabaseConnector(connection.connectorType);
        const schema = await connector.getSchema(connectionId, tableName);

        res.json({
            success: true,
            schema
        });
    } catch (error: any) {
        console.error('[Database API] Get schema error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * POST /api/database/:connectionId/query
 * Execute a query (SELECT only)
 */
router.post('/:connectionId/query', async (req: Request, res: Response) => {
    try {
        const { connectionId } = req.params;
        const { query, params } = querySchema.parse({ ...req.body, connectionId });

        const connectionManager = container.resolve(DatabaseConnectionManager);
        const connection = connectionManager.getConnection(connectionId);

        if (!connection) {
            return res.status(404).json({
                success: false,
                message: 'Connection not found'
            });
        }

        const connector = getDatabaseConnector(connection.connectorType);
        const result = await connector.query(connectionId, query, params);

        res.json({
            success: true,
            result
        });
    } catch (error: any) {
        console.error('[Database API] Query error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * GET /api/database/:connectionId/sample/:tableName
 * Get sample data from a table
 */
router.get('/:connectionId/sample/:tableName', async (req: Request, res: Response) => {
    try {
        const { connectionId, tableName } = req.params;
        const limit = parseInt(req.query.limit as string) || 10;

        const connectionManager = container.resolve(DatabaseConnectionManager);
        const connection = connectionManager.getConnection(connectionId);

        if (!connection) {
            return res.status(404).json({
                success: false,
                message: 'Connection not found'
            });
        }

        const connector = getDatabaseConnector(connection.connectorType);
        const result = await connector.sampleData(connectionId, tableName, limit);

        res.json({
            success: true,
            result
        });
    } catch (error: any) {
        console.error('[Database API] Sample data error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * DELETE /api/database/:connectionId
 * Disconnect and remove a database connection
 */
router.delete('/:connectionId', async (req: Request, res: Response) => {
    try {
        const { connectionId } = req.params;

        const connectionManager = container.resolve(DatabaseConnectionManager);
        const connection = connectionManager.getConnection(connectionId);

        if (!connection) {
            return res.status(404).json({
                success: false,
                message: 'Connection not found'
            });
        }

        // Disconnect from database
        const connector = getDatabaseConnector(connection.connectorType);
        await connector.disconnect(connectionId);

        // Delete encrypted credentials
        const credentialsManager = container.resolve(CredentialsManager);
        await credentialsManager.deleteCredentials(connectionId);

        res.json({
            success: true,
            message: 'Connection removed successfully'
        });
    } catch (error: any) {
        console.error('[Database API] Disconnect error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * GET /api/database/:connectionId/health
 * Check connection health
 */
router.get('/:connectionId/health', async (req: Request, res: Response) => {
    try {
        const { connectionId } = req.params;

        const connectionManager = container.resolve(DatabaseConnectionManager);
        const connection = connectionManager.getConnection(connectionId);

        if (!connection) {
            return res.status(404).json({
                success: false,
                message: 'Connection not found'
            });
        }

        const connector = getDatabaseConnector(connection.connectorType);
        const isHealthy = await connector.healthCheck(connectionId);

        res.json({
            success: true,
            healthy: isHealthy,
            lastCheck: connection.lastHealthCheck
        });
    } catch (error: any) {
        console.error('[Database API] Health check error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

export default router;
