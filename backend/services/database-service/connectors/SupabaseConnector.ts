/**
 * Supabase Database Connector
 * Wrapper around PostgreSQL connector for Supabase
 * USES DIRECT DB CONNECTION (pg) to allow Schema Extraction
 */

import { injectable, inject } from "tsyringe";
import { Pool, PoolConfig } from "pg";
import { randomUUID } from "crypto";
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
export class SupabaseConnector implements IDatabaseConnector {
    private pools: Map<string, Pool> = new Map();

    constructor(
        @inject(DatabaseConnectionManager) private connectionManager: DatabaseConnectionManager,
        @inject(CredentialsManager) private credentialsManager: CredentialsManager
    ) {
        console.log('[SupabaseConnector] Initialized (Direct DB Mode)');
    }

    async testConnection(credentials: DatabaseCredentials): Promise<ConnectionResult> {
        console.log('[SupabaseConnector] Testing connection to:', credentials.host);

        // Supabase requires SSL
        const poolConfig: PoolConfig = {
            host: credentials.host,
            port: credentials.port,
            database: credentials.database,
            user: credentials.username,
            password: credentials.password,
            ssl: { rejectUnauthorized: false }, // Supabase enforces SSL
            connectionTimeoutMillis: 30000,
            max: 1
        };

        const testPool = new Pool(poolConfig);

        try {
            const client = await testPool.connect();
            const result = await client.query("SELECT version()");
            client.release();
            await testPool.end();

            console.log('[SupabaseConnector] Test successful');

            return {
                success: true,
                message: "Supabase connection successful",
                metadata: {
                    version: result.rows[0].version
                }
            };
        } catch (error: any) {
            await testPool.end();
            console.error('[SupabaseConnector] Test failed:', error.message);
            return {
                success: false,
                message: `Connection failed: ${error.message}`,
                error: error as Error
            };
        }
    }

    async connect(credentials: DatabaseCredentials, connectionName: string): Promise<ConnectionResult> {
        const connectionId = randomUUID();

        console.log('[SupabaseConnector] Connecting:', connectionId);

        const poolConfig: PoolConfig = {
            host: credentials.host,
            port: credentials.port,
            database: credentials.database,
            user: credentials.username,
            password: credentials.password,
            ssl: { rejectUnauthorized: false },
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 30000
        };

        const pool = new Pool(poolConfig);

        try {
            const client = await pool.connect();
            const result = await client.query("SELECT version()");
            client.release();

            this.pools.set(connectionId, pool);

            this.connectionManager.registerConnection({
                connectionId,
                connectorType: 'supabase',
                connectionName,
                userId: 'temp-user-id',
                connectedAt: new Date(),
                metadata: {
                    version: result.rows[0].version
                }
            });

            console.log('[SupabaseConnector] Connected successfully:', connectionId);

            return {
                success: true,
                message: "Supabase connected successfully",
                connectionId,
                metadata: {
                    version: result.rows[0].version
                }
            };
        } catch (error: any) {
            await pool.end();
            console.error('[SupabaseConnector] Connection failed:', error.message);
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

        console.log('[SupabaseConnector] Listing tables');

        // Standard Postgres Query
        const query = `
            SELECT table_schema || '.' || table_name as full_name
            FROM information_schema.tables
            WHERE table_schema NOT IN ('pg_catalog', 'information_schema', 'auth', 'storage', 'graphql_public')
              AND table_type = 'BASE TABLE'
            ORDER BY table_schema, table_name;
        `;

        const result = await pool.query(query);
        return result.rows.map(row => row.full_name);
    }

    async getSchema(connectionId: string, tableName: string): Promise<FieldInfo[]> {
        const pool = this.pools.get(connectionId);
        if (!pool) throw new Error("Connection not found");

        console.log('[SupabaseConnector] Getting schema for:', tableName);

        const [schema, table] = tableName.includes('.') ? tableName.split('.') : ['public', tableName];

        const query = `
            SELECT 
                column_name as name,
                data_type as type,
                is_nullable = 'YES' as nullable
            FROM information_schema.columns 
            WHERE table_schema = $1 AND table_name = $2
            ORDER BY ordinal_position;
        `;

        const result = await pool.query(query, [schema, table]);

        return result.rows.map(row => ({
            name: row.name,
            type: row.type,
            nullable: row.nullable
        }));
    }

    async query(connectionId: string, query: string, params?: any[]): Promise<QueryResult> {
        const pool = this.pools.get(connectionId);
        if (!pool) throw new Error("Connection not found");

        // Basic Security
        if (!query.trim().toLowerCase().startsWith("select")) {
            throw new Error("Only SELECT queries are allowed");
        }

        const startTime = Date.now();
        const result = await pool.query({ text: query, values: params, rowMode: 'array' });
        const executionTime = Date.now() - startTime;

        return {
            rows: result.rows as any[],
            rowCount: result.rowCount || 0,
            fields: result.fields.map(f => ({ name: f.name, type: f.dataTypeID.toString(), nullable: true })),
            executionTime
        };
    }

    async sampleData(connectionId: string, tableName: string, limit: number = 10): Promise<QueryResult> {
        // Sanitize
        if (!/^[a-zA-Z0-9_.]+$/.test(tableName)) throw new Error("Invalid table name");
        return this.query(connectionId, `SELECT * FROM ${tableName} LIMIT ${limit}`);
    }

    async disconnect(connectionId: string): Promise<void> {
        const pool = this.pools.get(connectionId);
        if (pool) {
            await pool.end();
            this.pools.delete(connectionId);
            this.connectionManager.removeConnection(connectionId);
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
