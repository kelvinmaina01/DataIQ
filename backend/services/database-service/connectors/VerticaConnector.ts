/**
 * Vertica Database Connector
 * Implements IDatabaseConnector for Vertica analytics database
 * Note: Using ODBC/JDBC approach since vertica-nodejs may not be readily available
 */

import { injectable, inject } from "tsyringe";
import { Pool, PoolConfig } from "pg"; // Vertica is compatible with PostgreSQL protocol
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
export class VerticaConnector implements IDatabaseConnector {
    private pools: Map<string, Pool> = new Map();

    constructor(
        @inject(DatabaseConnectionManager) private connectionManager: DatabaseConnectionManager,
        @inject(CredentialsManager) private credentialsManager: CredentialsManager
    ) {
        console.log('[VerticaConnector] Initialized');
    }

    async testConnection(credentials: DatabaseCredentials): Promise<ConnectionResult> {
        console.log('[VerticaConnector] Testing connection to:', credentials.host);

        const poolConfig: PoolConfig = {
            host: credentials.host,
            port: credentials.port || 5433, // Vertica default port
            database: credentials.database,
            user: credentials.username,
            password: credentials.password,
            ssl: credentials.ssl ? { rejectUnauthorized: false } : false,
            connectionTimeoutMillis: 30000,
            max: 1
        };

        const testPool = new Pool(poolConfig);

        try {
            const client = await testPool.connect();
            const result = await client.query("SELECT version() as version, current_database() as database");
            client.release();
            await testPool.end();

            console.log('[VerticaConnector] Test successful');

            return {
                success: true,
                message: "Vertica connection successful",
                metadata: {
                    version: result.rows[0].version,
                    database: result.rows[0].database
                }
            };
        } catch (error: any) {
            await testPool.end();
            console.error('[VerticaConnector] Test failed:', error.message);

            return {
                success: false,
                message: `Connection failed: ${error.message}`,
                error: error as Error
            };
        }
    }

    async connect(credentials: DatabaseCredentials, connectionName: string): Promise<ConnectionResult> {
        const connectionId = `vertica_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        console.log('[VerticaConnector] Connecting:', connectionId);

        const poolConfig: PoolConfig = {
            host: credentials.host,
            port: credentials.port || 5433,
            database: credentials.database,
            user: credentials.username,
            password: credentials.password,
            ssl: credentials.ssl ? { rejectUnauthorized: false } : false,
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 30000
        };

        const pool = new Pool(poolConfig);

        try {
            const client = await pool.connect();
            const result = await client.query("SELECT version() as version, current_database() as database");
            const versionInfo = result.rows[0];
            client.release();

            this.pools.set(connectionId, pool);

            this.connectionManager.registerConnection({
                connectionId,
                connectorType: 'vertica',
                connectionName,
                userId: 'temp-user-id',
                connectedAt: new Date(),
                metadata: {
                    version: versionInfo.version,
                    database: versionInfo.database
                }
            });

            console.log('[VerticaConnector] Connected successfully:', connectionId);

            return {
                success: true,
                message: "Vertica connected successfully",
                connectionId,
                metadata: {
                    version: versionInfo.version,
                    database: versionInfo.database
                }
            };
        } catch (error: any) {
            await pool.end();
            console.error('[VerticaConnector] Connection failed:', error.message);

            return {
                success: false,
                message: `Connection failed: ${error.message}`,
                error: error as Error
            };
        }
    }

    async listTables(connectionId: string): Promise<string[]> {
        const pool = this.pools.get(connectionId);
        if (!pool) throw new Error("Connection not found");

        console.log('[VerticaConnector] Listing tables for:', connectionId);

        // Vertica-specific system tables
        const query = `
            SELECT table_schema || '.' || table_name as full_name
            FROM v_catalog.tables
            WHERE table_schema NOT IN ('v_catalog', 'v_monitor', 'v_internal')
              AND is_system_table = false
            ORDER BY table_schema, table_name;
        `;

        const result = await pool.query(query);
        const tables = result.rows.map(row => row.full_name);

        console.log(`[VerticaConnector] Found ${tables.length} tables`);
        return tables;
    }

    async getSchema(connectionId: string, tableName: string): Promise<FieldInfo[]> {
        const pool = this.pools.get(connectionId);
        if (!pool) throw new Error("Connection not found");

        console.log('[VerticaConnector] Getting schema for:', tableName);

        const [schema, table] = tableName.includes('.')
            ? tableName.split('.')
            : ['public', tableName];

        // Vertica-specific column information
        const query = `
            SELECT 
                column_name as name,
                data_type as type,
                is_nullable as nullable,
                CASE WHEN constraint_type = 'p' THEN true ELSE false END as "isPrimaryKey"
            FROM v_catalog.columns c
            LEFT JOIN v_catalog.constraint_columns cc 
                ON c.table_id = cc.table_id AND c.column_name = cc.column_name
            LEFT JOIN v_catalog.table_constraints tc
                ON cc.constraint_id = tc.constraint_id
            WHERE c.table_schema = $1 AND c.table_name = $2
            ORDER BY c.ordinal_position;
        `;

        const result = await pool.query(query, [schema, table]);

        console.log(`[VerticaConnector] Found ${result.rows.length} columns`);
        return result.rows;
    }

    async query(connectionId: string, query: string, params?: any[]): Promise<QueryResult> {
        const pool = this.pools.get(connectionId);
        if (!pool) throw new Error("Connection not found");

        console.log('[VerticaConnector] Executing query');

        if (!query.trim().toLowerCase().startsWith("select")) {
            throw new Error("Only SELECT queries are allowed");
        }

        const startTime = Date.now();
        const result = await pool.query(query, params);
        const executionTime = Date.now() - startTime;

        console.log(`[VerticaConnector] Query executed in ${executionTime}ms, ${result.rowCount} rows`);

        return {
            rows: result.rows,
            rowCount: result.rowCount || 0,
            fields: result.fields.map(f => ({
                name: f.name,
                type: f.dataTypeID.toString(),
                nullable: true
            })),
            executionTime
        };
    }

    async sampleData(connectionId: string, tableName: string, limit: number = 10): Promise<QueryResult> {
        console.log(`[VerticaConnector] Sampling ${limit} rows from:`, tableName);

        if (!/^[a-zA-Z0-9_.]+$/.test(tableName)) {
            throw new Error("Invalid table name");
        }

        return this.query(connectionId, `SELECT * FROM ${tableName} LIMIT ${limit}`);
    }

    async disconnect(connectionId: string): Promise<void> {
        console.log('[VerticaConnector] Disconnecting:', connectionId);

        const pool = this.pools.get(connectionId);
        if (pool) {
            await pool.end();
            this.pools.delete(connectionId);
            this.connectionManager.removeConnection(connectionId);
            console.log('[VerticaConnector] Disconnected');
        }
    }

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
