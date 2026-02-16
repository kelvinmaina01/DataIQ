/**
 * Main entry point for Database Service
 * Initialize and export all database connectors
 */

import "reflect-metadata";
import { container, initializeDIContainer } from "./di/container";
import { DatabaseConnectorFactory } from "./factories/DatabaseConnectorFactory";
import { IDatabaseConnector } from "./interfaces/IDatabaseConnector";

// Initialize DI container
// initializeDIContainer(); // REMOVED: Called in server.ts after dotenv load

// Export factory for getting connectors
export function getDatabaseConnector(dbType: string): IDatabaseConnector {
    const factory = container.resolve(DatabaseConnectorFactory);
    return factory.getConnector(dbType);
}

// Export all interfaces and types
export * from "./interfaces/IDatabaseConnector";
export * from "./services/CredentialsManager";
export * from "./services/DatabaseConnectionManager";
export * from "./factories/DatabaseConnectorFactory";

// Export all connectors
export * from "./connectors/PostgreSQLConnector";
export * from "./connectors/MySQLConnector";
export * from "./connectors/SQLServerConnector";
export * from "./connectors/MongoDBConnector";
export * from "./connectors/SupabaseConnector";
export * from "./connectors/VerticaConnector";

console.log('[Database Service] Initialized and ready - 6 connectors available');
