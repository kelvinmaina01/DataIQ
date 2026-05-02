/**
 * MongoDB Database Connector
 * Implements IDatabaseConnector for MongoDB databases
 */

import { injectable, inject } from "tsyringe";
import { MongoClient, Db } from "mongodb";
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
export class MongoDBConnector implements IDatabaseConnector {
    private clients: Map<string, { client: MongoClient; db: Db }> = new Map();

    constructor(
        @inject(DatabaseConnectionManager) private connectionManager: DatabaseConnectionManager,
        @inject(CredentialsManager) private credentialsManager: CredentialsManager
    ) {
        console.log('[MongoDBConnector] Initialized');
    }

    private buildConnectionString(credentials: DatabaseCredentials): string {
        if (credentials.connectionString) {
            return credentials.connectionString;
        }

        return `mongodb://${credentials.username}:${credentials.password}@${credentials.host}:${credentials.port}/${credentials.database}`;
    }

    async testConnection(credentials: DatabaseCredentials): Promise<ConnectionResult> {
        console.log('[MongoDBConnector] Testing connection to:', credentials.host);

        const uri = this.buildConnectionString(credentials);
        const client = new MongoClient(uri);

        try {
            await client.connect();
            const admin = client.db().admin();
            const info = await admin.serverInfo();
            await client.close();

            console.log('[MongoDBConnector] Test successful');

            return {
                success: true,
                message: "MongoDB connection successful",
                metadata: {
                    version: info.version,
                    database: credentials.database
                }
            };
        } catch (error: any) {
            await client.close().catch(() => { });
            console.error('[MongoDBConnector] Test failed:', error.message);
            return {
                success: false,
                message: `Connection failed: ${error.message}`,
                error: error as Error
            };
        }
    }

    async connect(credentials: DatabaseCredentials, connectionName: string): Promise<ConnectionResult> {
        const connectionId = `mongodb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        console.log('[MongoDBConnector] Connecting:', connectionId);

        const uri = this.buildConnectionString(credentials);
        const client = new MongoClient(uri, {
            maxPoolSize: 10,
            minPoolSize: 0
        });

        try {
            await client.connect();
            const db = client.db(credentials.database);
            const admin = client.db().admin();
            const info = await admin.serverInfo();

            this.clients.set(connectionId, { client, db });

            this.connectionManager.registerConnection({
                connectionId,
                connectorType: 'mongodb',
                connectionName,
                userId: 'temp-user-id',
                connectedAt: new Date(),
                metadata: {
                    version: info.version,
                    database: credentials.database
                }
            });

            console.log('[MongoDBConnector] Connected successfully:', connectionId);

            return {
                success: true,
                message: "MongoDB connected successfully",
                connectionId,
                metadata: {
                    version: info.version,
                    database: credentials.database
                }
            };
        } catch (error: any) {
            await client.close().catch(() => { });
            console.error('[MongoDBConnector] Connection failed:', error.message);

            return {
                success: false,
                message: `Connection failed: ${error.message}`,
                error: error as Error
            };
        }
    }

    async listTables(connectionId: string): Promise<string[]> {
        const connection = this.clients.get(connectionId);
        if (!connection) throw new Error("Connection not found");

        console.log('[MongoDBConnector] Listing collections for:', connectionId);

        const collections = await connection.db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);

        console.log(`[MongoDBConnector] Found ${collectionNames.length} collections`);
        return collectionNames;
    }

    async getSchema(connectionId: string, tableName: string): Promise<FieldInfo[]> {
        const connection = this.clients.get(connectionId);
        if (!connection) throw new Error("Connection not found");

        console.log('[MongoDBConnector] Getting schema for:', tableName);

        // Sample first document to infer schema
        const collection = connection.db.collection(tableName);
        const sample = await collection.findOne();

        if (!sample) {
            return [];
        }

        const fields: FieldInfo[] = Object.keys(sample).map(key => ({
            name: key,
            type: typeof sample[key],
            nullable: true,
            isPrimaryKey: key === '_id'
        }));

        console.log(`[MongoDBConnector] Found ${fields.length} fields`);
        return fields;
    }

    async query(connectionId: string, query: string, params?: any[]): Promise<QueryResult> {
        const connection = this.clients.get(connectionId);
        if (!connection) throw new Error("Connection not found");

        console.log('[MongoDBConnector] Executing query');

        // Parse query as JSON for MongoDB find()
        let queryObj: any = {};
        try {
            queryObj = JSON.parse(query);
        } catch {
            throw new Error("Query must be valid JSON for MongoDB");
        }

        const startTime = Date.now();

        // Extract collection name from query
        const collectionName = queryObj.collection || 'unknown';
        const filter = queryObj.filter || {};
        const limit = queryObj.limit || 100;

        const collection = connection.db.collection(collectionName);
        const results = await collection.find(filter).limit(limit).toArray();

        const executionTime = Date.now() - startTime;

        const fields: FieldInfo[] = results.length > 0
            ? Object.keys(results[0]).map(key => ({
                name: key,
                type: typeof results[0][key],
                nullable: true
            }))
            : [];

        console.log(`[MongoDBConnector] Query executed in ${executionTime}ms, ${results.length} documents`);

        return {
            rows: results,
            rowCount: results.length,
            fields,
            executionTime
        };
    }

    async sampleData(connectionId: string, tableName: string, limit: number = 10): Promise<QueryResult> {
        const connection = this.clients.get(connectionId);
        if (!connection) throw new Error("Connection not found");

        console.log(`[MongoDBConnector] Sampling ${limit} documents from:`, tableName);

        const startTime = Date.now();
        const collection = connection.db.collection(tableName);
        const results = await collection.find().limit(limit).toArray();
        const executionTime = Date.now() - startTime;

        const fields: FieldInfo[] = results.length > 0
            ? Object.keys(results[0]).map(key => ({
                name: key,
                type: typeof results[0][key],
                nullable: true
            }))
            : [];

        return {
            rows: results,
            rowCount: results.length,
            fields,
            executionTime
        };
    }

    async disconnect(connectionId: string): Promise<void> {
        console.log('[MongoDBConnector] Disconnecting:', connectionId);

        const connection = this.clients.get(connectionId);
        if (connection) {
            await connection.client.close();
            this.clients.delete(connectionId);
            this.connectionManager.removeConnection(connectionId);
            console.log('[MongoDBConnector] Disconnected');
        }
    }

    async healthCheck(connectionId: string): Promise<boolean> {
        const connection = this.clients.get(connectionId);
        if (!connection) return false;

        try {
            await connection.db.admin().ping();
            this.connectionManager.updateHealthCheck(connectionId);
            return true;
        } catch {
            return false;
        }
    }
}
