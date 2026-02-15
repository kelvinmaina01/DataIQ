/**
 * Database Connector Factory
 * Creates appropriate database connector instances using dependency injection
 */

import { injectable, inject } from "tsyringe";
import { IDatabaseConnector } from "../interfaces/IDatabaseConnector";

@injectable()
export class DatabaseConnectorFactory {
    // Connectors will be injected when we implement them
    private connectors: Map<string, IDatabaseConnector> = new Map();

    /**
     * Register a connector (used by DI container)
     */
    registerConnector(type: string, connector: IDatabaseConnector): void {
        this.connectors.set(type.toLowerCase(), connector);
        console.log(`[DatabaseConnectorFactory] Registered connector: ${type}`);
    }

    /**
     * Get connector instance by database type
     */
    getConnector(dbType: string): IDatabaseConnector {
        const normalizedType = dbType.toLowerCase();

        // Handle type aliases
        const typeMap: Record<string, string> = {
            'postgresql': 'postgres',
            'mssql': 'sqlserver',
            'mongo': 'mongodb'
        };

        const mappedType = typeMap[normalizedType] || normalizedType;
        const connector = this.connectors.get(mappedType);

        if (!connector) {
            throw new Error(`Unsupported database type: ${dbType}`);
        }

        return connector;
    }

    /**
     * Get list of supported database types
     */
    getSupportedTypes(): string[] {
        return Array.from(this.connectors.keys());
    }

    /**
     * Check if a database type is supported
     */
    isSupported(dbType: string): boolean {
        const normalizedType = dbType.toLowerCase();
        return this.connectors.has(normalizedType);
    }
}
