/**
 * PostgreSQL Integration Tests
 * Tests full connection lifecycle with a real or test database
 */

import { PostgreSQLConnector } from "../connectors/PostgreSQLConnector";
import { DatabaseConnectionManager } from "../services/DatabaseConnectionManager";
import { CredentialsManager } from "../services/CredentialsManager";
import { DatabaseCredentials } from "../interfaces/IDatabaseConnector";

describe("PostgreSQL Integration Tests", () => {
    let connector: PostgreSQLConnector;
    let connectionManager: DatabaseConnectionManager;
    let credentialsManager: CredentialsManager;

    // Test credentials (update these for your test database)
    const testCredentials: DatabaseCredentials = {
        host: process.env.TEST_POSTGRES_HOST || "localhost",
        port: parseInt(process.env.TEST_POSTGRES_PORT || "5432"),
        database: process.env.TEST_POSTGRES_DB || "postgres",
        username: process.env.TEST_POSTGRES_USER || "postgres",
        password: process.env.TEST_POSTGRES_PASSWORD || "postgres",
        ssl: false
    };

    beforeAll(() => {
        // Set encryption key
        process.env.CREDENTIALS_ENCRYPTION_KEY = "690138bbfb2a9809ab12715815a27aaa5b193a49e6b81c2064570e28b54fd811";

        credentialsManager = new CredentialsManager();
        connectionManager = new DatabaseConnectionManager(credentialsManager);
        connector = new PostgreSQLConnector(connectionManager, credentialsManager);
    });

    describe("Connection Lifecycle", () => {
        let connectionId: string;

        it("should test connection successfully", async () => {
            const result = await connector.testConnection(testCredentials);

            expect(result.success).toBe(true);
            expect(result.message).toContain("successful");
            expect(result.metadata?.version).toBeDefined();
        }, 15000);

        it("should connect and get connection ID", async () => {
            const result = await connector.connect(testCredentials, "Test Connection");

            expect(result.success).toBe(true);
            expect(result.connectionId).toBeDefined();
            connectionId = result.connectionId!;
        }, 15000);

        it("should list tables", async () => {
            const tables = await connector.listTables(connectionId);

            expect(Array.isArray(tables)).toBe(true);
            // PostgreSQL always has some system tables
            expect(tables.length).toBeGreaterThan(0);
        }, 10000);

        it("should perform health check", async () => {
            const isHealthy = await connector.healthCheck(connectionId);
            expect(isHealthy).toBe(true);
        }, 10000);

        it("should disconnect successfully", async () => {
            await connector.disconnect(connectionId);

            // Health check should fail after disconnect
            const isHealthy = await connector.healthCheck(connectionId);
            expect(isHealthy).toBe(false);
        }, 10000);
    });

    describe("Error Handling", () => {
        it("should fail with invalid credentials", async () => {
            const invalidCreds: DatabaseCredentials = {
                ...testCredentials,
                password: "wrong_password"
            };

            const result = await connector.testConnection(invalidCreds);
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        }, 15000);

        it("should throw error for invalid connection ID", async () => {
            await expect(
                connector.listTables("invalid-connection-id")
            ).rejects.toThrow("Connection not found");
        });
    });
});
