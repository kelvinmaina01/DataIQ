/**
 * Dependency Injection Container Setup
 * Registers all services and connectors
 */

import "reflect-metadata";
import { container } from "tsyringe";

// Services
import { CredentialsManager } from "../services/CredentialsManager";
import { DatabaseConnectionManager } from "../services/DatabaseConnectionManager";
import { DatabaseConnectorFactory } from "../factories/DatabaseConnectorFactory";
import { IDatabaseConnector } from "../interfaces/IDatabaseConnector";

// Database connectors
import { PostgreSQLConnector } from "../connectors/PostgreSQLConnector";
import { MySQLConnector } from "../connectors/MySQLConnector";
import { SQLServerConnector } from "../connectors/SQLServerConnector";
import { MongoDBConnector } from "../connectors/MongoDBConnector";
import { SupabaseConnector } from "../connectors/SupabaseConnector";
import { VerticaConnector } from "../connectors/VerticaConnector";

// Register singleton services
container.registerSingleton("CredentialsManager", CredentialsManager);
container.registerSingleton("DatabaseConnectionManager", DatabaseConnectionManager);
container.registerSingleton("DatabaseConnectorFactory", DatabaseConnectorFactory);

console.log('[DI Container] Core services registered');

// Register all database connectors
container.register("PostgreSQLConnector", { useClass: PostgreSQLConnector });
container.register("MySQLConnector", { useClass: MySQLConnector });
container.register("SQLServerConnector", { useClass: SQLServerConnector });
container.register("MongoDBConnector", { useClass: MongoDBConnector });
container.register("SupabaseConnector", { useClass: SupabaseConnector });
container.register("VerticaConnector", { useClass: VerticaConnector });

// Register connectors in factory
const factory = container.resolve(DatabaseConnectorFactory);

const postgresConnector = container.resolve<IDatabaseConnector>("PostgreSQLConnector" as any);
factory.registerConnector("postgres", postgresConnector);
factory.registerConnector("postgresql", postgresConnector);

const mysqlConnector = container.resolve<IDatabaseConnector>("MySQLConnector" as any);
factory.registerConnector("mysql", mysqlConnector);

const sqlserverConnector = container.resolve<IDatabaseConnector>("SQLServerConnector" as any);
factory.registerConnector("sqlserver", sqlserverConnector);
factory.registerConnector("mssql", sqlserverConnector);

const mongoConnector = container.resolve<IDatabaseConnector>("MongoDBConnector" as any);
factory.registerConnector("mongodb", mongoConnector);
factory.registerConnector("mongo", mongoConnector);

const supabaseConnector = container.resolve<IDatabaseConnector>("SupabaseConnector" as any);
factory.registerConnector("supabase", supabaseConnector);

const verticaConnector = container.resolve<IDatabaseConnector>("VerticaConnector" as any);
factory.registerConnector("vertica", verticaConnector);

console.log('[DI Container] All 6 database connectors registered');

export { container };

/**
 * Helper function to get service instances
 */
export function getService<T>(identifier: string): T {
    return container.resolve<T>(identifier as any);
}

/**
 * Initialize the DI container (call this on app startup)
 */
export function initializeDIContainer(): void {
    console.log('[DI Container] Initialization complete');
    console.log('[DI Container] Registered services:', [
        'CredentialsManager',
        'DatabaseConnectionManager',
        'DatabaseConnectorFactory'
    ]);
}
