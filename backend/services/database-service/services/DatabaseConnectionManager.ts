/**
 * Database Connection Manager
 * Manages all active database connections and connection pools
 */

import { injectable, inject } from "tsyringe";
import { CredentialsManager } from "./CredentialsManager";

export interface ActiveConnection {
    connectionId: string;
    connectorType: string;
    connectionName: string;
    userId: string;
    connectedAt: Date;
    lastHealthCheck?: Date;
    metadata?: Record<string, any>;
}

@injectable()
export class DatabaseConnectionManager {
    private activeConnections: Map<string, ActiveConnection> = new Map();

    constructor(
        @inject(CredentialsManager) private credentialsManager: CredentialsManager
    ) {
        console.log('[DatabaseConnectionManager] Initialized');
    }

    /**
     * Register a new active connection
     */
    registerConnection(connection: ActiveConnection): void {
        this.activeConnections.set(connection.connectionId, connection);
        console.log('[DatabaseConnectionManager] Registered:', connection.connectionId);
    }

    /**
     * Get connection details
     */
    getConnection(connectionId: string): ActiveConnection | undefined {
        return this.activeConnections.get(connectionId);
    }

    /**
     * Get all connections for a user
     */
    getUserConnections(userId: string): ActiveConnection[] {
        return Array.from(this.activeConnections.values())
            .filter(conn => conn.userId === userId);
    }

    /**
     * Remove a connection
     */
    removeConnection(connectionId: string): boolean {
        const removed = this.activeConnections.delete(connectionId);
        if (removed) {
            console.log('[DatabaseConnectionManager] Removed:', connectionId);
        }
        return removed;
    }

    /**
     * Update health check timestamp
     */
    updateHealthCheck(connectionId: string): void {
        const connection = this.activeConnections.get(connectionId);
        if (connection) {
            connection.lastHealthCheck = new Date();
        }
    }

    /**
     * Get total active connections
     */
    getActiveCount(): number {
        return this.activeConnections.size;
    }

    /**
     * Clean up stale connections (older than 1 hour without health check)
     */
    cleanupStaleConnections(): number {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        let removed = 0;

        for (const [id, conn] of this.activeConnections.entries()) {
            if (conn.lastHealthCheck && conn.lastHealthCheck < oneHourAgo) {
                this.activeConnections.delete(id);
                removed++;
            }
        }

        if (removed > 0) {
            console.log(`[DatabaseConnectionManager] Cleaned up ${removed} stale connections`);
        }

        return removed;
    }
}
