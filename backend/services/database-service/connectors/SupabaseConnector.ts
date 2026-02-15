/**
 * Supabase Database Connector
 * Wrapper around PostgreSQL connector for Supabase
 */

import { injectable, inject } from "tsyringe";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
    IDatabaseConnector,
    DatabaseCredentials,
    ConnectionResult,
    QueryResult,
    FieldInfo
} from "../interfaces/IDatabaseConnector";
import { DatabaseConnectionManager } from "../services/DatabaseConnectionManager";
import { CredentialsManager } from "../services/CredentialsManager";

interface SupabaseCredentials extends DatabaseCredentials {
    supabaseUrl?: string;
    supabaseKey?: string;
}

@injectable()
export class SupabaseConnector implements IDatabaseConnector {
    private clients: Map<string, SupabaseClient> = new Map();

    constructor(
        @inject(DatabaseConnectionManager) private connectionManager: DatabaseConnectionManager,
        @inject(CredentialsManager) private credentialsManager: CredentialsManager
    ) {
        console.log('[SupabaseConnector] Initialized');
    }

    async testConnection(credentials: DatabaseCredentials): Promise<ConnectionResult> {
        console.log('[SupabaseConnector] Testing connection');

        const supabaseCreds = credentials as SupabaseCredentials;

        if (!supabaseCreds.supabaseUrl || !supabaseCreds.supabaseKey) {
            return {
                success: false,
                message: "Supabase URL and Key are required",
                error: new Error("Missing Supabase credentials")
            };
        }

        try {
            const client = createClient(supabaseCreds.supabaseUrl, supabaseCreds.supabaseKey);

            // Test connection by listing a table
            const { data, error } = await client.from('_supabase_migrations').select('*').limit(1);

            if (error && !error.message.includes('does not exist')) {
                throw error;
            }

            console.log('[SupabaseConnector] Test successful');

            return {
                success: true,
                message: "Supabase connection successful",
                metadata: {
                    url: supabaseCreds.supabaseUrl,
                    authenticated: true
                }
            };
        } catch (error: any) {
            console.error('[SupabaseConnector] Test failed:', error.message);
            return {
                success: false,
                message: `Connection failed: ${error.message}`,
                error: error as Error
            };
        }
    }

    async connect(credentials: DatabaseCredentials, connectionName: string): Promise<ConnectionResult> {
        const connectionId = `supabase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        console.log('[SupabaseConnector] Connecting:', connectionId);

        const supabaseCreds = credentials as SupabaseCredentials;

        if (!supabaseCreds.supabaseUrl || !supabaseCreds.supabaseKey) {
            return {
                success: false,
                message: "Supabase URL and Key are required",
                error: new Error("Missing Supabase credentials")
            };
        }

        try {
            const client = createClient(supabaseCreds.supabaseUrl, supabaseCreds.supabaseKey);

            // Test connection
            const { error } = await client.from('_supabase_migrations').select('*').limit(1);
            if (error && !error.message.includes('does not exist')) {
                throw error;
            }

            this.clients.set(connectionId, client);

            this.connectionManager.registerConnection({
                connectionId,
                connectorType: 'supabase',
                connectionName,
                userId: 'temp-user-id',
                connectedAt: new Date(),
                metadata: {
                    url: supabaseCreds.supabaseUrl
                }
            });

            console.log('[SupabaseConnector] Connected successfully:', connectionId);

            return {
                success: true,
                message: "Supabase connected successfully",
                connectionId,
                metadata: {
                    url: supabaseCreds.supabaseUrl
                }
            };
        } catch (error: any) {
            console.error('[SupabaseConnector] Connection failed:', error.message);

            return {
                success: false,
                message: `Connection failed: ${error.message}`,
                error: error as Error
            };
        }
    }

    async listTables(connectionId: string): Promise<string[]> {
        const client = this.clients.get(connectionId);
        if (!client) throw new Error("Connection not found");

        console.log('[SupabaseConnector] Listing tables for:', connectionId);

        // Use RPC to get tables from information_schema
        const { data, error } = await client.rpc('get_tables' as any);

        if (error) {
            // Fallback: just return empty if RPC doesn't exist
            console.warn('[SupabaseConnector] Could not list tables:', error.message);
            return [];
        }

        const tables = data?.map((t: any) => `${t.table_schema}.${t.table_name}`) || [];

        console.log(`[SupabaseConnector] Found ${tables.length} tables`);
        return tables;
    }

    async getSchema(connectionId: string, tableName: string): Promise<FieldInfo[]> {
        const client = this.clients.get(connectionId);
        if (!client) throw new Error("Connection not found");

        console.log('[SupabaseConnector] Getting schema for:', tableName);

        // Sample one row to infer schema
        const { data, error } = await client.from(tableName).select('*').limit(1);

        if (error) {
            throw error;
        }

        if (!data || data.length === 0) {
            return [];
        }

        const fields: FieldInfo[] = Object.keys(data[0]).map(key => ({
            name: key,
            type: typeof data[0][key],
            nullable: true,
            isPrimaryKey: key === 'id'
        }));

        console.log(`[SupabaseConnector] Found ${fields.length} columns`);
        return fields;
    }

    async query(connectionId: string, query: string, params?: any[]): Promise<QueryResult> {
        throw new Error("Direct SQL queries not supported for Supabase connector. Use table name in sampleData instead.");
    }

    async sampleData(connectionId: string, tableName: string, limit: number = 10): Promise<QueryResult> {
        const client = this.clients.get(connectionId);
        if (!client) throw new Error("Connection not found");

        console.log(`[SupabaseConnector] Sampling ${limit} rows from:`, tableName);

        const startTime = Date.now();
        const { data, error } = await client.from(tableName).select('*').limit(limit);
        const executionTime = Date.now() - startTime;

        if (error) {
            throw error;
        }

        const fields: FieldInfo[] = data && data.length > 0
            ? Object.keys(data[0]).map(key => ({
                name: key,
                type: typeof data[0][key],
                nullable: true
            }))
            : [];

        return {
            rows: data || [],
            rowCount: data?.length || 0,
            fields,
            executionTime
        };
    }

    async disconnect(connectionId: string): Promise<void> {
        console.log('[SupabaseConnector] Disconnecting:', connectionId);

        const client = this.clients.get(connectionId);
        if (client) {
            // Supabase client doesn't need explicit disconnect
            this.clients.delete(connectionId);
            this.connectionManager.removeConnection(connectionId);
            console.log('[SupabaseConnector] Disconnected');
        }
    }

    async healthCheck(connectionId: string): Promise<boolean> {
        const client = this.clients.get(connectionId);
        if (!client) return false;

        try {
            await client.from('_supabase_migrations').select('*').limit(1);
            this.connectionManager.updateHealthCheck(connectionId);
            return true;
        } catch {
            return false;
        }
    }
}
