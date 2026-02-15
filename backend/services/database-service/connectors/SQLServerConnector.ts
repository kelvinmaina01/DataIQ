/**
 * SQL Server Database Connector
 * Implements IDatabaseConnector for Microsoft SQL Server databases
 */

import { injectable, inject } from "tsyringe";
import * as sql from "mssql";
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
export class SQLServerConnector implements IDatabaseConnector {
    private pools: Map<string, sql.ConnectionPool> = new Map();

    constructor(
        @inject(DatabaseConnectionManager) private connectionManager: DatabaseConnectionManager,
        @inject(CredentialsManager) private credentialsManager: CredentialsManager
    ) {
        console.log('[SQLServerConnector] Initialized');
    }

    async testConnection(credentials: DatabaseCredentials): Promise<ConnectionResult> {
        console.log('[SQLServerConnector] Testing connection to:', credentials.host);

        const config: sql.config = {
            server: credentials.host,
            port: credentials.port,
            database: credentials.database,
            user: credentials.username,
            password: credentials.password,
            options: {
                encrypt: credentials.ssl || false,
                trustServerCertificate: true
            }
        };

        try {
            const pool = new sql.ConnectionPool(config);
            await pool.connect();

            const result = await pool.request().query('SELECT @@VERSION as version, DB_NAME() as database');
            await pool.close();

            console.log('[SQLServerConnector] Test successful');

            return {
                success: true,
                message: "SQL Server connection successful",
                metadata: {
                    version: result.recordset[0].version,
                    database: result.recordset[0].database
                }
            };
        } catch (error: any) {
            console.error('[SQLServerConnector] Test failed:', error.message);
            return {
                success: false,
                message: `Connection failed: ${error.message}`,
                error: error as Error
            };
        }
    }

    async connect(credentials: DatabaseCredentials, connectionName: string): Promise<ConnectionResult> {
        const connectionId = `sqlserver_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        console.log('[SQLServerConnector] Connecting:', connectionId);

        const config: sql.config = {
            server: credentials.host,
            port: credentials.port,
            database: credentials.database,
            user: credentials.username,
            password: credentials.password,
            pool: {
                max: 10,
                min: 0,
                idleTimeoutMillis: 30000
            },
            options: {
                encrypt: credentials.ssl || false,
                trustServerCertificate: true
            }
        };

        try {
            const pool = new sql.ConnectionPool(config);
            await pool.connect();

            const result = await pool.request().query('SELECT @@VERSION as version, DB_NAME() as database');
            const versionInfo = result.recordset[0];

            this.pools.set(connectionId, pool);

            this.connectionManager.registerConnection({
                connectionId,
                connectorType: 'sqlserver',
                connectionName,
                userId: 'temp-user-id',
                connectedAt: new Date(),
                metadata: {
                    version: versionInfo.version,
                    database: versionInfo.database
                }
            });

            console.log('[SQLServerConnector] Connected successfully:', connectionId);

            return {
                success: true,
                message: "SQL Server connected successfully",
                connectionId,
                metadata: {
                    version: versionInfo.version,
                    database: versionInfo.database
                }
            };
        } catch (error: any) {
            console.error('[SQLServerConnector] Connection failed:', error.message);

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

        console.log('[SQLServerConnector] Listing tables for:', connectionId);

        const query = `
            SELECT TABLE_SCHEMA + '.' + TABLE_NAME as full_name
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_TYPE = 'BASE TABLE'
              AND TABLE_SCHEMA NOT IN ('sys', 'INFORMATION_SCHEMA')
            ORDER BY TABLE_SCHEMA, TABLE_NAME;
        `;

        const result = await pool.request().query(query);
        const tables = result.recordset.map(row => row.full_name);

        console.log(`[SQLServerConnector] Found ${tables.length} tables`);
        return tables;
    }

    async getSchema(connectionId: string, tableName: string): Promise<FieldInfo[]> {
        const pool = this.pools.get(connectionId);
        if (!pool) throw new Error("Connection not found");

        console.log('[SQLServerConnector] Getting schema for:', tableName);

        const [schema, table] = tableName.includes('.')
            ? tableName.split('.')
            : ['dbo', tableName];

        const query = `
            SELECT 
                c.COLUMN_NAME as name,
                c.DATA_TYPE as type,
                CASE WHEN c.IS_NULLABLE = 'YES' THEN 1 ELSE 0 END as nullable,
                CASE WHEN pk.COLUMN_NAME IS NOT NULL THEN 1 ELSE 0 END as isPrimaryKey
            FROM INFORMATION_SCHEMA.COLUMNS c
            LEFT JOIN (
                SELECT ku.COLUMN_NAME
                FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
                JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE ku
                    ON tc.CONSTRAINT_NAME = ku.CONSTRAINT_NAME
                WHERE tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
                    AND tc.TABLE_SCHEMA = @schema
                    AND tc.TABLE_NAME = @table
            ) pk ON c.COLUMN_NAME = pk.COLUMN_NAME
            WHERE c.TABLE_SCHEMA = @schema 
                AND c.TABLE_NAME = @table
            ORDER BY c.ORDINAL_POSITION;
        `;

        const result = await pool.request()
            .input('schema', sql.VarChar, schema)
            .input('table', sql.VarChar, table)
            .query(query);

        console.log(`[SQLServerConnector] Found ${result.recordset.length} columns`);
        return result.recordset;
    }

    async query(connectionId: string, query: string, params?: any[]): Promise<QueryResult> {
        const pool = this.pools.get(connectionId);
        if (!pool) throw new Error("Connection not found");

        console.log('[SQLServerConnector] Executing query');

        if (!query.trim().toLowerCase().startsWith("select")) {
            throw new Error("Only SELECT queries are allowed");
        }

        const startTime = Date.now();
        const result = await pool.request().query(query);
        const executionTime = Date.now() - startTime;

        console.log(`[SQLServerConnector] Query executed in ${executionTime}ms, ${result.recordset.length} rows`);

        return {
            rows: result.recordset,
            rowCount: result.recordset.length,
            fields: Object.keys(result.recordset[0] || {}).map(name => ({
                name,
                type: 'unknown',
                nullable: true
            })),
            executionTime
        };
    }

    async sampleData(connectionId: string, tableName: string, limit: number = 10): Promise<QueryResult> {
        console.log(`[SQLServerConnector] Sampling ${limit} rows from:`, tableName);

        if (!/^[a-zA-Z0-9_.]+$/.test(tableName)) {
            throw new Error("Invalid table name");
        }

        return this.query(connectionId, `SELECT TOP ${limit} * FROM ${tableName}`);
    }

    async disconnect(connectionId: string): Promise<void> {
        console.log('[SQLServerConnector] Disconnecting:', connectionId);

        const pool = this.pools.get(connectionId);
        if (pool) {
            await pool.close();
            this.pools.delete(connectionId);
            this.connectionManager.removeConnection(connectionId);
            console.log('[SQLServerConnector] Disconnected');
        }
    }

    async healthCheck(connectionId: string): Promise<boolean> {
        const pool = this.pools.get(connectionId);
        if (!pool) return false;

        try {
            await pool.request().query("SELECT 1");
            this.connectionManager.updateHealthCheck(connectionId);
            return true;
        } catch {
            return false;
        }
    }
}
