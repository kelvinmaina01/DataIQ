/**
 * MySQL Database Connector
 * Implements IDatabaseConnector for MySQL databases
 */

import { injectable, inject } from "tsyringe";
import mysql, { Pool, PoolConnection } from "mysql2/promise";
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
export class MySQLConnector implements IDatabaseConnector {
    private pools: Map<string, Pool> = new Map();

    constructor(
        @inject(DatabaseConnectionManager) private connectionManager: DatabaseConnectionManager,
        @inject(CredentialsManager) private credentialsManager: CredentialsManager
    ) {
        console.log('[MySQLConnector] Initialized');
    }

    async testConnection(credentials: DatabaseCredentials): Promise<ConnectionResult> {
        console.log('[MySQLConnector] Testing connection to:', credentials.host);

        try {
            const connection = await mysql.createConnection({
                host: credentials.host,
                port: credentials.port,
                database: credentials.database,
                user: credentials.username,
                password: credentials.password,
                ssl: credentials.ssl ? {} : undefined
            });

            const [rows]: any = await connection.query('SELECT VERSION() as version, DATABASE() as database');
            await connection.end();

            console.log('[MySQLConnector] Test successful');

            return {
                success: true,
                message: "MySQL connection successful",
                metadata: {
                    version: rows[0].version,
                    database: rows[0].database
                }
            };
        } catch (error: any) {
            console.error('[MySQLConnector] Test failed:', error.message);
            return {
                success: false,
                message: `Connection failed: ${error.message}`,
                error: error as Error
            };
        }
    }

    async connect(credentials: DatabaseCredentials, connectionName: string): Promise<ConnectionResult> {
        const connectionId = `mysql_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        console.log('[MySQLConnector] Connecting:', connectionId);

        const pool = mysql.createPool({
            host: credentials.host,
            port: credentials.port,
            database: credentials.database,
            user: credentials.username,
            password: credentials.password,
            ssl: credentials.ssl ? {} : undefined,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        try {
            const connection = await pool.getConnection();
            const [rows]: any = await connection.query('SELECT VERSION() as version, DATABASE() as database');
            connection.release();

            this.pools.set(connectionId, pool);

            this.connectionManager.registerConnection({
                connectionId,
                connectorType: 'mysql',
                connectionName,
                userId: 'temp-user-id',
                connectedAt: new Date(),
                metadata: {
                    version: rows[0].version,
                    database: rows[0].database
                }
            });

            console.log('[MySQLConnector] Connected successfully:', connectionId);

            return {
                success: true,
                message: "MySQL connected successfully",
                connectionId,
                metadata: {
                    version: rows[0].version,
                    database: rows[0].database
                }
            };
        } catch (error: any) {
            await pool.end();
            console.error('[MySQLConnector] Connection failed:', error.message);

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

        console.log('[MySQLConnector] Listing tables for:', connectionId);

        const query = `
            SELECT TABLE_SCHEMA, TABLE_NAME
            FROM information_schema.TABLES
            WHERE TABLE_SCHEMA NOT IN ('information_schema', 'mysql', 'performance_schema', 'sys')
            ORDER BY TABLE_SCHEMA, TABLE_NAME;
        `;

        const [rows]: any = await pool.query(query);
        const tables = rows.map((row: any) => `${row.TABLE_SCHEMA}.${row.TABLE_NAME}`);

        console.log(`[MySQLConnector] Found ${tables.length} tables`);
        return tables;
    }

    async getSchema(connectionId: string, tableName: string): Promise<FieldInfo[]> {
        const pool = this.pools.get(connectionId);
        if (!pool) throw new Error("Connection not found");

        console.log('[MySQLConnector] Getting schema for:', tableName);

        const [schema, table] = tableName.includes('.')
            ? tableName.split('.')
            : ['', tableName];

        const query = `
            SELECT 
                COLUMN_NAME as name,
                DATA_TYPE as type,
                IS_NULLABLE = 'YES' as nullable,
                COLUMN_KEY = 'PRI' as isPrimaryKey
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
            ORDER BY ORDINAL_POSITION;
        `;

        const [rows]: any = await pool.query(query, [schema || await this.getCurrentDatabase(pool), table]);

        console.log(`[MySQLConnector] Found ${rows.length} columns`);
        return rows;
    }

    private async getCurrentDatabase(pool: Pool): Promise<string> {
        const [rows]: any = await pool.query('SELECT DATABASE() as db');
        return rows[0].db;
    }

    async query(connectionId: string, query: string, params?: any[]): Promise<QueryResult> {
        const pool = this.pools.get(connectionId);
        if (!pool) throw new Error("Connection not found");

        console.log('[MySQLConnector] Executing query');

        if (!query.trim().toLowerCase().startsWith("select")) {
            throw new Error("Only SELECT queries are allowed");
        }

        const startTime = Date.now();
        const [rows, fields]: any = await pool.query(query, params);
        const executionTime = Date.now() - startTime;

        console.log(`[MySQLConnector] Query executed in ${executionTime}ms, ${rows.length} rows`);

        return {
            rows,
            rowCount: rows.length,
            fields: fields.map((f: any) => ({
                name: f.name,
                type: f.type.toString(),
                nullable: true
            })),
            executionTime
        };
    }

    async sampleData(connectionId: string, tableName: string, limit: number = 10): Promise<QueryResult> {
        console.log(`[MySQLConnector] Sampling ${limit} rows from:`, tableName);

        if (!/^[a-zA-Z0-9_.]+$/.test(tableName)) {
            throw new Error("Invalid table name");
        }

        return this.query(connectionId, `SELECT * FROM ${tableName} LIMIT ${limit}`);
    }

    async disconnect(connectionId: string): Promise<void> {
        console.log('[MySQLConnector] Disconnecting:', connectionId);

        const pool = this.pools.get(connectionId);
        if (pool) {
            await pool.end();
            this.pools.delete(connectionId);
            this.connectionManager.removeConnection(connectionId);
            console.log('[MySQLConnector] Disconnected');
        }
    }

    async healthCheck(connectionId: string): Promise<boolean> {
        const pool = this.pools.get(connectionId);
        if (!pool) return false;

        try {
            const connection = await pool.getConnection();
            await connection.query("SELECT 1");
            connection.release();

            this.connectionManager.updateHealthCheck(connectionId);
            return true;
        } catch {
            return false;
        }
    }
}
