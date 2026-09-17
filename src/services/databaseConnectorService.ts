/**
 * Database Connector Service
 * Frontend client for real database connector API
 */

export interface DatabaseCredentials {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl?: boolean;
    connectionString?: string;
}

export interface ConnectionResult {
    success: boolean;
    message: string;
    connectionId?: string;
    metadata?: Record<string, any>;
    error?: any;
}

export interface QueryResult {
    rows: any[];
    rowCount: number;
    fields: Array<{ name: string; type: string; nullable: boolean }>;
    executionTime: number;
}

export interface DatabaseConnection {
    connectionId: string;
    connectorType: string;
    connectionName: string;
    userId: string;
    connectedAt: Date;
    metadata?: Record<string, any>;
}

class DatabaseConnectorService {
    private baseUrl = '/api/database';

    /**
     * Test database connection without storing credentials
     */
    async testConnection(dbType: string, credentials: DatabaseCredentials): Promise<ConnectionResult> {
        try {
            const response = await fetch(`${this.baseUrl}/test`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': 'temp-user-id'
                },
                body: JSON.stringify({ dbType, credentials })
            });

            // Check response status
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Backend error (${response.status}): ${errorText}`);
            }

            // Check content type
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Backend returned non-JSON response');
            }

            return await response.json();
        } catch (error: any) {
            console.error('[DatabaseConnectorService] Test error:', error);

            // Provide helpful error messages
            if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
                return {
                    success: false,
                    message: '❌ Backend server is not responding. Please ensure: npm run backend:dev is running',
                    error
                };
            }

            return {
                success: false,
                message: error.message || 'Connection test failed',
                error
            };
        }
    }

    /**
     * Connect to database and save credentials
     */
    async connect(
        dbType: string,
        connectionName: string,
        credentials: DatabaseCredentials
    ): Promise<ConnectionResult> {
        try {
            const response = await fetch(`${this.baseUrl}/connect`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': 'temp-user-id'
                },
                body: JSON.stringify({ dbType, connectionName, credentials })
            });

            // Check response status
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Backend error (${response.status}): ${errorText}`);
            }

            // Check content type
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Backend returned non-JSON response');
            }

            return await response.json();
        } catch (error: any) {
            console.error('[DatabaseConnectorService] Connect error:', error);

            // Provide helpful error messages
            if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
                return {
                    success: false,
                    message: '❌ Backend server is not responding. Please ensure: npm run backend:dev is running',
                    error
                };
            }

            return {
                success: false,
                message: error.message || 'Connection failed',
                error
            };
        }
    }

    /**
     * List all user's database connections
     */
    async listConnections(): Promise<DatabaseConnection[]> {
        try {
            const response = await fetch(`${this.baseUrl}/connections`, {
                headers: {
                    'x-user-id': 'temp-user-id'
                }
            });

            const data = await response.json();
            return data.connections || [];
        } catch (error) {
            console.error('[DatabaseConnectorService] List connections error:', error);
            return [];
        }
    }

    /**
     * List tables in a database connection
     */
    async listTables(connectionId: string): Promise<string[]> {
        try {
            const response = await fetch(`${this.baseUrl}/${connectionId}/tables`);
            const data = await response.json();
            return data.tables || [];
        } catch (error) {
            console.error('[DatabaseConnectorService] List tables error:', error);
            return [];
        }
    }

    /**
     * Get schema for a specific table
     */
    async getSchema(connectionId: string, tableName: string): Promise<any[]> {
        try {
            const response = await fetch(`${this.baseUrl}/${connectionId}/schema/${encodeURIComponent(tableName)}`);
            const data = await response.json();
            return data.schema || [];
        } catch (error) {
            console.error('[DatabaseConnectorService] Get schema error:', error);
            return [];
        }
    }

    /**
     * Execute a query
     */
    async query(connectionId: string, query: string, params?: any[]): Promise<QueryResult | null> {
        try {
            const response = await fetch(`${this.baseUrl}/${connectionId}/query`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, params })
            });

            const data = await response.json();
            return data.result || null;
        } catch (error) {
            console.error('[DatabaseConnectorService] Query error:', error);
            return null;
        }
    }

    /**
     * Get sample data from a table
     */
    async sampleData(connectionId: string, tableName: string, limit: number = 10): Promise<QueryResult | null> {
        try {
            const response = await fetch(`${this.baseUrl}/${connectionId}/sample/${encodeURIComponent(tableName)}?limit=${limit}`);
            const data = await response.json();
            return data.result || null;
        } catch (error) {
            console.error('[DatabaseConnectorService] Sample data error:', error);
            return null;
        }
    }

    /**
     * Disconnect and remove a connection
     */
    async disconnect(connectionId: string): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/${connectionId}`, {
                method: 'DELETE'
            });

            const data = await response.json();
            return data.success;
        } catch (error) {
            console.error('[DatabaseConnectorService] Disconnect error:', error);
            return false;
        }
    }

    /**
     * Check connection health
     */
    async healthCheck(connectionId: string): Promise<{ healthy: boolean; lastCheck?: Date }> {
        try {
            const response = await fetch(`${this.baseUrl}/${connectionId}/health`);
            const data = await response.json();
            return {
                healthy: data.healthy,
                lastCheck: data.lastCheck
            };
        } catch (error) {
            console.error('[DatabaseConnectorService] Health check error:', error);
            return { healthy: false };
        }
    }
}

// Export singleton instance
export const databaseConnectorService = new DatabaseConnectorService();
