/**
 * Core Database Connector Interface
 * All database connectors must implement this interface
 */

export interface DatabaseCredentials {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl?: boolean;
    connectionString?: string; // For MongoDB, etc.
    [key: string]: any; // Allow additional connector-specific fields
}

export interface ConnectionResult {
    success: boolean;
    message: string;
    connectionId?: string;
    metadata?: Record<string, any>;
    error?: Error;
}

export interface QueryResult {
    rows: any[];
    rowCount: number;
    fields: FieldInfo[];
    executionTime: number;
}

export interface FieldInfo {
    name: string;
    type: string;
    nullable: boolean;
    isPrimaryKey?: boolean;
}

export interface IDatabaseConnector {
    /**
     * Test connection without storing credentials
     */
    testConnection(credentials: DatabaseCredentials): Promise<ConnectionResult>;

    /**
     * Establish and store a connection
     */
    connect(credentials: DatabaseCredentials, connectionName: string): Promise<ConnectionResult>;

    /**
     * List all tables/collections in the database
     */
    listTables(connectionId: string): Promise<string[]>;

    /**
     * Get schema for a specific table
     */
    getSchema(connectionId: string, tableName: string): Promise<FieldInfo[]>;

    /**
     * Execute a SELECT query
     */
    query(connectionId: string, query: string, params?: any[]): Promise<QueryResult>;

    /**
     * Get sample data from a table
     */
    sampleData(connectionId: string, tableName: string, limit: number): Promise<QueryResult>;

    /**
     * Close connection
     */
    disconnect(connectionId: string): Promise<void>;

    /**
     * Health check for active connection
     */
    healthCheck(connectionId: string): Promise<boolean>;
}
