/**
 * Connection Management Service
 * Handles testing and storing database/warehouse connections
 * WITHOUT importing any data - connections are stored for MCP access
 */

export interface DataConnection {
    id: string;
    connectorType: string;
    connectionName: string;
    credentials: Record<string, string>;
    status: 'connected' | 'disconnected' | 'error';
    lastTested?: Date;
    createdAt: Date;
}

export interface GoogleSheetsConnection {
    id: string;
    connectorType: 'google-sheets';
    connectionName: string;
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
    scope: string;
    userEmail?: string;
    status: 'connected' | 'disconnected' | 'error';
    createdAt: Date;
}

export interface MetaAdsConnection {
    id: string;
    connectorType: 'metaads';
    connectionName: string;
    accessToken: string;
    expiresAt: Date;
    scope: string;
    userEmail?: string;
    adAccountId?: string;
    status: 'connected' | 'disconnected' | 'error';
    createdAt: Date;
}

/**
 * Test a database connection without importing data
 */
export async function testConnection(
    connectorType: string,
    credentials: Record<string, string>
): Promise<{ success: boolean; message: string }> {
    console.log(`[ConnectionService] Testing connection to ${connectorType}...`);

    // Simulate connection test
    await new Promise(resolve => setTimeout(resolve, 2000));

    // In production, this would call your backend API to test the connection
    // Backend would try to connect but NOT fetch any data
    // Example: POST /api/connections/test
    // Body: { connectorType, credentials }

    // For now, simulate success
    const testSuccessful = Math.random() > 0.1; // 90% success rate

    if (testSuccessful) {
        return {
            success: true,
            message: 'Connection successful! Credentials are valid.'
        };
    } else {
        return {
            success: false,
            message: 'Connection failed. Please check your credentials.'
        };
    }
}

/**
 * Save a connection to local storage (will be Supabase in production)
 */
export async function saveConnection(connection: Omit<DataConnection, 'id' | 'createdAt'>): Promise<DataConnection> {
    const newConnection: DataConnection = {
        ...connection,
        id: `conn_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        createdAt: new Date()
    };

    // Get existing connections
    const existing = getStoredConnections();
    existing.push(newConnection);

    // Save to localStorage (will be Supabase in production)
    localStorage.setItem('data_connections', JSON.stringify(existing));

    console.log('[ConnectionService] Connection saved:', newConnection);
    return newConnection;
}

/**
 * Get all stored connections
 */
export function getStoredConnections(): DataConnection[] {
    const stored = localStorage.getItem('data_connections');
    if (!stored) return [];

    try {
        const connections = JSON.parse(stored);
        // Convert date strings back to Date objects
        return connections.map((conn: any) => ({
            ...conn,
            createdAt: new Date(conn.createdAt),
            lastTested: conn.lastTested ? new Date(conn.lastTested) : undefined
        }));
    } catch (error) {
        console.error('[ConnectionService] Error parsing connections:', error);
        return [];
    }
}

/**
 * Get connections for a specific connector type
 */
export function getConnectionsByType(connectorType: string): DataConnection[] {
    return getStoredConnections().filter(conn => conn.connectorType === connectorType);
}

/**
 * Delete a connection
 */
export function deleteConnection(connectionId: string): void {
    const connections = getStoredConnections().filter(conn => conn.id !== connectionId);
    localStorage.setItem('data_connections', JSON.stringify(connections));
}

/**
 * Check if a connector type has any active connections
 */
export function hasActiveConnection(connectorType: string): boolean {
    // Check database/warehouse connections
    const connections = getStoredConnections();
    const hasDB = connections.some(conn =>
        conn.connectorType === connectorType && conn.status === 'connected'
    );

    // Check Google Sheets/Drive/Ads connection
    if (connectorType === 'google-sheets' || connectorType === 'gsheets' || connectorType === 'gdrive' || connectorType === 'gads') {
        const sheetsConnection = getGoogleSheetsConnection();
        return sheetsConnection !== null && sheetsConnection.status === 'connected';
    }

    // Check Meta Ads connection
    if (connectorType === 'metaads') {
        const metaConnection = getMetaAdsConnection();
        return metaConnection !== null && metaConnection.status === 'connected';
    }

    return hasDB;
}

/**
 * Save Google Sheets OAuth connection
 */
export function saveGoogleSheetsConnection(connection: Omit<GoogleSheetsConnection, 'id' | 'createdAt'>): GoogleSheetsConnection {
    const newConnection: GoogleSheetsConnection = {
        ...connection,
        id: `gs_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        createdAt: new Date()
    };

    localStorage.setItem('google_sheets_connection', JSON.stringify(newConnection));
    console.log('[ConnectionService] Google Sheets connection saved:', newConnection);
    return newConnection;
}

/**
 * Get Google Sheets connection (only one allowed per user)
 */
export function getGoogleSheetsConnection(): GoogleSheetsConnection | null {
    const stored = localStorage.getItem('google_sheets_connection');
    if (!stored) return null;

    try {
        const connection = JSON.parse(stored);
        return {
            ...connection,
            createdAt: new Date(connection.createdAt),
            expiresAt: new Date(connection.expiresAt)
        };
    } catch (error) {
        console.error('[ConnectionService] Error parsing Google Sheets connection:', error);
        return null;
    }
}

/**
 * Check if Google Sheets token is expired
 */
export function isGoogleTokenExpired(): boolean {
    const connection = getGoogleSheetsConnection();
    if (!connection) return true;

    return new Date() >= connection.expiresAt;
}

/**
 * Refresh Google OAuth token
 * In production, this would call the backend to refresh using the refresh token
 */
export async function refreshGoogleToken(): Promise<{ success: boolean; message: string }> {
    const connection = getGoogleSheetsConnection();
    if (!connection) {
        return { success: false, message: 'No connection found' };
    }

    // In production, call: POST /api/integrations/google/refresh
    // Body: { refreshToken: connection.refreshToken }

    console.log('[ConnectionService] Refreshing Google token...');

    // For MVP, we'll just extend the expiration (in production, use real OAuth refresh)
    const updatedConnection: GoogleSheetsConnection = {
        ...connection,
        expiresAt: new Date(Date.now() + 3600 * 1000), // Extend by 1 hour
    };

    localStorage.setItem('google_sheets_connection', JSON.stringify(updatedConnection));

    return {
        success: true,
        message: 'Token refreshed successfully'
    };
}

/**
 * Disconnect (delete) Google Sheets connection
 */
export function disconnectGoogleSheets(): void {
    localStorage.removeItem('google_sheets_connection');
    console.log('[ConnectionService] Google Sheets connection removed');
}

/**
 * Save Meta Ads OAuth connection
 */
export function saveMetaAdsConnection(connection: Omit<MetaAdsConnection, 'id' | 'createdAt'>): MetaAdsConnection {
    const newConnection: MetaAdsConnection = {
        ...connection,
        id: `meta_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        createdAt: new Date()
    };

    localStorage.setItem('meta_ads_connection', JSON.stringify(newConnection));
    console.log('[ConnectionService] Meta Ads connection saved:', newConnection);
    return newConnection;
}

/**
 * Get Meta Ads connection (only one allowed per user)
 */
export function getMetaAdsConnection(): MetaAdsConnection | null {
    const stored = localStorage.getItem('meta_ads_connection');
    if (!stored) return null;

    try {
        const connection = JSON.parse(stored);
        return {
            ...connection,
            createdAt: new Date(connection.createdAt),
            expiresAt: new Date(connection.expiresAt)
        };
    } catch (error) {
        console.error('[ConnectionService] Error parsing Meta Ads connection:', error);
        return null;
    }
}

/**
 * Disconnect (delete) Meta Ads connection
 */
export function disconnectMetaAds(): void {
    localStorage.removeItem('meta_ads_connection');
    console.log('[ConnectionService] Meta Ads connection removed');
}
