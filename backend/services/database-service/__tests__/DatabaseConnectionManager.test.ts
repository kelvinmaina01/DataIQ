/**
 * Unit Tests for DatabaseConnectionManager
 */

import { DatabaseConnectionManager } from "../services/DatabaseConnectionManager";
import { CredentialsManager } from "../services/CredentialsManager";
import { ActiveConnection } from "../services/DatabaseConnectionManager";

// Mock CredentialsManager
jest.mock("../services/CredentialsManager");

describe("DatabaseConnectionManager", () => {
    let manager: DatabaseConnectionManager;
    let mockCredentialsManager: jest.Mocked<CredentialsManager>;

    beforeEach(() => {
        mockCredentialsManager = new CredentialsManager() as jest.Mocked<CredentialsManager>;
        manager = new DatabaseConnectionManager(mockCredentialsManager);
    });

    describe("Connection Registration", () => {
        it("should register a new connection", () => {
            const connection: ActiveConnection = {
                connectionId: "test-conn-1",
                connectorType: "postgres",
                connectionName: "My Postgres",
                userId: "user-123",
                connectedAt: new Date()
            };

            manager.registerConnection(connection);
            const retrieved = manager.getConnection("test-conn-1");

            expect(retrieved).toEqual(connection);
        });

        it("should get all connections for a user", () => {
            const conn1: ActiveConnection = {
                connectionId: "conn-1",
                connectorType: "postgres",
                connectionName: "DB1",
                userId: "user-123",
                connectedAt: new Date()
            };

            const conn2: ActiveConnection = {
                connectionId: "conn-2",
                connectorType: "mysql",
                connectionName: "DB2",
                userId: "user-123",
                connectedAt: new Date()
            };

            const conn3: ActiveConnection = {
                connectionId: "conn-3",
                connectorType: "postgres",
                connectionName: "DB3",
                userId: "user-456",
                connectedAt: new Date()
            };

            manager.registerConnection(conn1);
            manager.registerConnection(conn2);
            manager.registerConnection(conn3);

            const userConns = manager.getUserConnections("user-123");
            expect(userConns).toHaveLength(2);
            expect(userConns).toContainEqual(conn1);
            expect(userConns).toContainEqual(conn2);
        });
    });

    describe("Connection Removal", () => {
        it("should remove a connection", () => {
            const connection: ActiveConnection = {
                connectionId: "test-conn",
                connectorType: "postgres",
                connectionName: "Test",
                userId: "user-123",
                connectedAt: new Date()
            };

            manager.registerConnection(connection);
            expect(manager.getConnection("test-conn")).toBeDefined();

            const removed = manager.removeConnection("test-conn");
            expect(removed).toBe(true);
            expect(manager.getConnection("test-conn")).toBeUndefined();
        });

        it("should return false when removing non-existent connection", () => {
            const removed = manager.removeConnection("non-existent");
            expect(removed).toBe(false);
        });
    });

    describe("Health Check Updates", () => {
        it("should update health check timestamp", () => {
            const connection: ActiveConnection = {
                connectionId: "test-conn",
                connectorType: "postgres",
                connectionName: "Test",
                userId: "user-123",
                connectedAt: new Date()
            };

            manager.registerConnection(connection);
            manager.updateHealthCheck("test-conn");

            const updated = manager.getConnection("test-conn");
            expect(updated?.lastHealthCheck).toBeDefined();
        });
    });

    describe("Active Count", () => {
        it("should return correct active connection count", () => {
            expect(manager.getActiveCount()).toBe(0);

            manager.registerConnection({
                connectionId: "conn-1",
                connectorType: "postgres",
                connectionName: "DB1",
                userId: "user-123",
                connectedAt: new Date()
            });

            expect(manager.getActiveCount()).toBe(1);

            manager.registerConnection({
                connectionId: "conn-2",
                connectorType: "mysql",
                connectionName: "DB2",
                userId: "user-123",
                connectedAt: new Date()
            });

            expect(manager.getActiveCount()).toBe(2);
        });
    });

    describe("Cleanup Stale Connections", () => {
        it("should remove connections with old health checks", () => {
            const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

            manager.registerConnection({
                connectionId: "stale-conn",
                connectorType: "postgres",
                connectionName: "Stale",
                userId: "user-123",
                connectedAt: new Date(),
                lastHealthCheck: twoHoursAgo
            });

            manager.registerConnection({
                connectionId: "fresh-conn",
                connectorType: "postgres",
                connectionName: "Fresh",
                userId: "user-123",
                connectedAt: new Date(),
                lastHealthCheck: new Date()
            });

            const removed = manager.cleanupStaleConnections();
            expect(removed).toBe(1);
            expect(manager.getConnection("stale-conn")).toBeUndefined();
            expect(manager.getConnection("fresh-conn")).toBeDefined();
        });
    });
});
