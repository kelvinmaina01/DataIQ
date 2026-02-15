/**
 * PostgreSQL Database Connector
 * Implements IDatabaseConnector for PostgreSQL databases
 */

import { injectable, inject } from "tsyringe";
import { Pool, PoolClient, PoolConfig } from "pg";
import {
    IDatabaseConnector,
    DatabaseCredentials,
    ConnectionResult,
    QueryResult,
    FieldInfo
} from "../interfaces/IDatabaseConnector";
import { DatabaseConnectionManager } from "../services/DatabaseConnectionManager";
import { CredentialsManager } from "../services/CredentialsManager";

@injectable()
export class PostgreSQLConnector implements IDatabaseConnector {
    private pools: Map<string, Pool> = new Map();

    constructor(
        @inject(DatabaseConnectionManager) private connectionManager: DatabaseConnectionManager,
        @inject(CredentialsManager) private credentialsManager: CredentialsManager
    ) {
        console.log('[PostgreSQLConnector] Initialized');
    }

    /**
     * Test connection without storing credentials
     */
    async testConnection(credentials: DatabaseCredentials): Promise<ConnectionResult> {
        console.log('[PostgreSQLConnector] Testing connection to:', credentials.host);

        const poolConfig: PoolConfig = {
            host: credentials.host,
            port: credentials.port,
            database: credentials.database,
            user: credentials.username,
            password: credentials.password,
            ssl: credentials.ssl ? { rejectUnauthorized: false } : false,
            connectionTimeoutMillis: parseInt(process.env.CONNECTION_TIMEOUT_MS || "30000"),
            max: 1 // Only one connection for testing
        };

        const testPool = new Pool(poolConfig);

        try {
            const client = await testPool.connect();
            const result = await client.query("SELECT version() as version, current_database() as database");
            client.release();
            await testPool.end();

            console.log('[PostgreSQLConnector] Test successful');

            return {
                success: true,
                message: "PostgreSQL connection successful",
                metadata: {
                    version: result.rows[0].version,
                    database: result.rows[0].database
                }
            };
        } catch (error: any) {
            await testPool.end();
            console.error('[PostgreSQLConnector] Test failed:', error.message);

            return {
                success: false,
                message: `Connection failed: ${error.message}`,
                error: error as Error
            };
        }
    }

    /**
     * Establish and store a connection
     */
    async connect(credentials: DatabaseCredentials, connectionName: string): Promise<ConnectionResult> {
        const connectionId = `pg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        console.log('[PostgreSQLConnector] Connecting:', connectionId);

        const poolConfig: PoolConfig = {
            host: credentials.host,
            port: credentials.port,
            database: credentials.database,
            user: credentials.username,
            password: credentials.password,
            ssl: credentials.ssl ? { rejectUnauthorized: false } : false,
            max: 10, // Connection pool size
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: parseInt(process.env.CONNECTION_TIMEOUT_MS || "30000")
        };

        const pool = new Pool(poolConfig);

        try {
            // Test the connection
            const client = await pool.connect();
            const result = await client.query("SELECT version() as version, current_database() as database");
            const versionInfo = result.rows[0];
            client.release();

            // Store the pool
            this.pools.set(connectionId, pool);

            // Register in connection manager
            this.connectionManager.registerConnection({
                connectionId,
                connectorType: 'postgres',
                connectionName,
                userId: 'temp-user-id', // TODO: Get from auth context
                connectedAt: new Date(),
                metadata: {
                    version: versionInfo.version,
                    database: versionInfo.database
                }
            });

            console.log('[PostgreSQLConnector] Connected successfully:', connectionId);

            return {
                success: true,
                message: "PostgreSQL connected successfully",
                connectionId,
                metadata: {
                    version: versionInfo.version,
                    database: versionInfo.database
                }
            };
        } catch (error: any) {
            await pool.end();
            console.error('[PostgreSQLConnector] Connection failed:', error.message);

            return {
                success: false,
                message: `Connection failed: ${error.message}`,
                error: error as Error
            };
        }
    }

    /**
     * List all tables in the database
     */
    async listTables(connectionId: string): Promise<string[]> {
        const pool = this.pools.get(connectionId);
        if (!pool) throw new Error("Connection not found");

        console.log('[PostgreSQLConnector] Listing tables for:', connectionId);

        const query = `
            SELECT table_schema || '.' || table_name as full_name
            FROM information_schema.tables
            WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
              AND table_type = 'BASE TABLE'
            ORDER BY table_schema, table_name;
        `;

        const result = await pool.query(query);
        const tables = result.rows.map(row => row.full_name);

        console.log(`[PostgreSQLConnector] Found ${tables.length} tables`);
        return tables;
    }

    /**
     * Get schema for a specific table
     */
    async getSchema(connectionId: string, tableName: string): Promise<FieldInfo[]> {
        const pool = this.pools.get(connectionId);
        if (!pool) throw new Error("Connection not found");

        console.log('[PostgreSQLConnector] Getting schema for:', tableName);

        const [schema, table] = tableName.includes('.')
            ? tableName.split('.')
            : ['public', tableName];

        const query = `
            SELECT 
                c.column_name as name,
                c.data_type as type,
                c.is_nullable = 'YES' as nullable,
                c.column_default,
                CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as "isPrimaryKey"
            FROM information_schema.columns c
            LEFT JOIN (
                SELECT ku.column_name
                FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage ku
                    ON tc.constraint_name = ku.constraint_name
                    AND tc.table_schema = ku.table_schema
                WHERE tc.constraint_type = 'PRIMARY KEY'
                    AND tc.table_schema = $1
                    AND tc.table_name = $2
            ) pk ON c.column_name = pk.column_name
            WHERE c.table_schema = $1 
                AND c.table_name = $2
            ORDER BY c.ordinal_position;
        `;

        const result = await pool.query(query, [schema, table]);

        console.log(`[PostgreSQLConnector] Found ${result.rows.length} columns`);
        return result.rows;
    }

    /**
     * Execute a SELECT query
     */
    async query(connectionId: string, query: string, params?: any[]): Promise<QueryResult> {
        const pool = this.pools.get(connectionId);
        if (!pool) throw new Error("Connection not found");

        console.log('[PostgreSQLConnector] Executing query');

        // Security: Validate query is SELECT only
        if (!query.trim().toLowerCase().startsWith("select")) {
            throw new Error("Only SELECT queries are allowed");
        }

        const startTime = Date.now();

        try {
            const result = await pool.query({
                text: query,
                values: params,
                rowMode: 'array'
            });

            const executionTime = Date.now() - startTime;

            console.log(`[PostgreSQLConnector] Query executed in ${executionTime}ms, ${result.rowCount} rows`);

            return {
                rows: result.rows as any[],
                rowCount: result.rowCount || 0,
                fields: result.fields.map(f => ({
                    name: f.name,
                    type: f.dataTypeID.toString(),
                    nullable: true
                })),
                executionTime
            };
        } catch (error: any) {
            console.error('[PostgreSQLConnector] Query error:', error.message);
            throw error;
        }
    }

    /**
     * Get sample data from a table
     */
    async sampleData(connectionId: string, tableName: string, limit: number = 10): Promise<QueryResult> {
        console.log(`[PostgreSQLConnector] Sampling ${limit} rows from:`, tableName);

        // Security: Sanitize table name (only allow alphanumeric, underscore, dot)
        if (!/^[a-zA-Z0-9_.]+$/.test(tableName)) {
            throw new Error("Invalid table name");
        }

        return this.query(connectionId, `SELECT * FROM ${tableName} LIMIT ${limit}`);
    }

    /**
     * Close connection
     */
    async disconnect(connectionId: string): Promise<void> {
        console.log('[PostgreSQLConnector] Disconnecting:', connectionId);

        const pool = this.pools.get(connectionId);
        if (pool) {
            await pool.end();
            this.pools.delete(connectionId);
            this.connectionManager.removeConnection(connectionId);
            console.log('[PostgreSQLConnector] Disconnected');
        }
    }

    /**
     * Health check for active connection
     */
    async healthCheck(connectionId: string): Promise<boolean> {
        const pool = this.pools.get(connectionId);
        if (!pool) return false;

        try {
            const client = await pool.connect();
            await client.query("SELECT 1");
            client.release();

            this.connectionManager.updateHealthCheck(connectionId);
            return true;
        } catch {
            return false;
        }
    }
}
