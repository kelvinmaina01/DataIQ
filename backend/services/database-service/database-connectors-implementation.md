# Database Connectors - Enterprise Implementation Plan

## Executive Summary

This document outlines the comprehensive implementation strategy for all 6 database connectors in DataIQ with **enterprise-grade architecture**, **dependency injection patterns**, **security-first design**, and **production-ready** implementation.

**Target Databases**: PostgreSQL, MySQL, SQL Server, MongoDB, Supabase, Vertica

**Timeline**: 3-4 weeks for full implementation  
**Approach**: Test-Driven Development (TDD) + Production-First  
**Architecture**: Dependency Injection + Repository Pattern + Factory Pattern

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Dependency Injection Strategy](#dependency-injection-strategy)
3. [Security & Credentials](#security--credentials)
4. [Database-Specific Implementations](#database-specific-implementations)
5. [MCP Server Integration](#mcp-server-integration)
6. [Testing Strategy](#testing-strategy)
7. [Implementation Roadmap](#implementation-roadmap)

---

## Architecture Overview

### Design Principles

1. **Dependency Injection**: Loose coupling, testability, flexibility
2. **Repository Pattern**: Abstract data access logic
3. **Factory Pattern**: Dynamic connector instantiation
4. **Strategy Pattern**: Database-specific query builders
5. **SOLID Principles**: Single responsibility, open/closed, etc.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│          ├─ DataIngestionPage (UI)                      │
│          ├─ DatabaseConnectorPage (Forms)               │
│          └─ ConnectionDetailPage (Management)            │
└──────────────────┬──────────────────────────────────────┘
                   │ HTTP/REST
┌──────────────────▼──────────────────────────────────────┐
│               Backend API Layer                          │
│          ├─ /api/database/connect (POST)                │
│          ├─ /api/database/test (POST)                   │
│          ├─ /api/database/query (POST)                  │
│          └─ /api/database/disconnect (DELETE)           │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│           Database Service Layer (DI Container)          │
│                                                          │
│  ┌────────────────────────────────────────────┐        │
│  │   DatabaseConnectionManager (Singleton)     │        │
│  │   - Manages all active connections          │        │
│  │   - Connection pooling                      │        │
│  │   - Health checks                           │        │
│  └────────────────────────────────────────────┘        │
│                                                          │
│  ┌────────────────────────────────────────────┐        │
│  │   DatabaseConnectorFactory (Factory)        │        │
│  │   - Creates appropriate connector instances │        │
│  │   - Dependency injection                    │        │
│  └────────────────────────────────────────────┘        │
│                                                          │
│  ┌────────────────────────────────────────────┐        │
│  │   CredentialsManager (Security)             │        │
│  │   - Encryption/Decryption                   │        │
│  │   - Secure storage (Supabase)               │        │
│  │   - Token rotation                          │        │
│  └────────────────────────────────────────────┘        │
└──────────────────┬──────────────────────────────────────┘
                   │
       ┌───────────┴───────────┬───────────┬───────────┐
       ▼                       ▼           ▼           ▼
┌──────────────┐  ┌──────────────┐  ┌─────────┐  ┌─────────┐
│  PostgreSQL  │  │    MySQL     │  │ MongoDB │  │ Vertica │
│  Connector   │  │  Connector   │  │ Connector│  │Connector│
└──────────────┘  └──────────────┘  └─────────┘  └─────────┘
       │                  │              │            │
       └──────────────────┴──────────────┴────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │   MCP Server           │
              │   - Tool registration  │
              │   - Query execution    │
              │   - Schema inspection  │
              └────────────────────────┘
```

---

## Dependency Injection Strategy

### Why Dependency Injection?

**Benefits**:
- ✅ **Testability**: Easy to mock dependencies in unit tests
- ✅ **Flexibility**: Swap implementations without changing consumer code
- ✅ **Maintainability**: Clear dependencies, single responsibility
- ✅ **Scalability**: Add new databases without modifying existing code

### DI Container Implementation

We'll use **TSyringe** (Microsoft's lightweight DI container for TypeScript) or **InversifyJS** for enterprise-grade DI.

**Installation**:
```bash
npm install tsyringe reflect-metadata
# OR
npm install inversify reflect-metadata
```

### Core Interfaces (Contracts)

```typescript
// src/backend/services/database-service/interfaces/IDatabaseConnector.ts

export interface DatabaseCredentials {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl?: boolean;
    connectionString?: string; // For MongoDB, etc.
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
```

### Dependency Injection Setup

```typescript
// src/backend/services/database-service/di/container.ts

import "reflect-metadata";
import { container } from "tsyringe";

// Database connectors
import { PostgreSQLConnector } from "../connectors/PostgreSQLConnector";
import { MySQLConnector } from "../connectors/MySQLConnector";
import { SQLServerConnector } from "../connectors/SQLServerConnector";
import { MongoDBConnector } from "../connectors/MongoDBConnector";
import { SupabaseConnector } from "../connectors/SupabaseConnector";
import { VerticaConnector } from "../connectors/VerticaConnector";

// Services
import { DatabaseConnectionManager } from "../services/DatabaseConnectionManager";
import { CredentialsManager } from "../services/CredentialsManager";
import { DatabaseConnectorFactory } from "../factories/DatabaseConnectorFactory";

// Register singletons
container.registerSingleton("DatabaseConnectionManager", DatabaseConnectionManager);
container.registerSingleton("CredentialsManager", CredentialsManager);
container.registerSingleton("DatabaseConnectorFactory", DatabaseConnectorFactory);

// Register database connectors (transient - new instance per request)
container.register("PostgreSQLConnector", { useClass: PostgreSQLConnector });
container.register("MySQLConnector", { useClass: MySQLConnector });
container.register("SQLServerConnector", { useClass: SQLServerConnector });
container.register("MongoDBConnector", { useClass: MongoDBConnector});
container.register("SupabaseConnector", { useClass: SupabaseConnector });
container.register("VerticaConnector", { useClass: VerticaConnector });

export { container };
```

### Factory Pattern

```typescript
// src/backend/services/database-service/factories/DatabaseConnectorFactory.ts

import { injectable, inject } from "tsyringe";
import { IDatabaseConnector } from "../interfaces/IDatabaseConnector";

@injectable()
export class DatabaseConnectorFactory {
    constructor(
        @inject("PostgreSQLConnector") private postgresConnector: IDatabaseConnector,
        @inject("MySQLConnector") private mysqlConnector: IDatabaseConnector,
        @inject("SQLServerConnector") private sqlServerConnector: IDatabaseConnector,
        @inject("MongoDBConnector") private mongoConnector: IDatabaseConnector,
        @inject("SupabaseConnector") private supabaseConnector: IDatabaseConnector,
        @inject("VerticaConnector") private verticaConnector: IDatabaseConnector
    ) {}

    /**
     * Get connector instance by database type
     */
    getConnector(dbType: string): IDatabaseConnector {
        switch (dbType.toLowerCase()) {
            case "postgres":
            case "postgresql":
                return this.postgresConnector;
            case "mysql":
                return this.mysqlConnector;
            case "sqlserver":
            case "mssql":
                return this.sqlServerConnector;
            case "mongodb":
            case "mongo":
                return this.mongoConnector;
            case "supabase":
                return this.supabaseConnector;
            case "vertica":
                return this.verticaConnector;
            default:
                throw new Error(`Unsupported database type: ${dbType}`);
        }
    }
}
```

---

## Security & Credentials

### Encryption Strategy

**At-Rest Encryption**: All credentials encrypted before storage using AES-256-GCM

```typescript
// src/backend/services/database-service/services/CredentialsManager.ts

import crypto from "crypto";
import { injectable } from "tsyringe";
import { supabase } from "../../supabase/supabaseClient";

@injectable()
export class CredentialsManager {
    private readonly ENCRYPTION_KEY = process.env.CREDENTIALS_ENCRYPTION_KEY!;
    private readonly ALGORITHM = "aes-256-gcm";

    /**
     * Encrypt credentials before storage
     */
    encrypt(credentials: any): string {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(
            this.ALGORITHM,
            Buffer.from(this.ENCRYPTION_KEY, "hex"),
            iv
        );

        let encrypted = cipher.update(JSON.stringify(credentials), "utf8", "hex");
        encrypted += cipher.final("hex");
        
        const authTag = cipher.getAuthTag().toString("hex");
        
        return JSON.stringify({
            iv: iv.toString("hex"),
            content: encrypted,
            tag: authTag
        });
    }

    /**
     * Decrypt credentials from storage
     */
    decrypt(encryptedData: string): any {
        const { iv, content, tag } = JSON.parse(encryptedData);
        
        const decipher = crypto.createDecipheriv(
            this.ALGORITHM,
            Buffer.from(this.ENCRYPTION_KEY, "hex"),
            Buffer.from(iv, "hex")
        );
        
        decipher.setAuthTag(Buffer.from(tag, "hex"));
        
        let decrypted = decipher.update(content, "hex", "utf8");
        decrypted += decipher.final("utf8");
        
        return JSON.parse(decrypted);
    }

    /**
     * Store encrypted credentials in Supabase
     */
    async storeCredentials(
        userId: string,
        connectionId: string,
        credentials: any
    ): Promise<void> {
        const encrypted = this.encrypt(credentials);
        
        const { error } = await supabase
            .from("database_connections")
            .upsert({
                id: connectionId,
                user_id: userId,
                encrypted_credentials: encrypted,
                updated_at: new Date().toISOString()
            });

        if (error) throw error;
    }

    /**
     * Retrieve and decrypt credentials
     */
    async getCredentials(connectionId: string): Promise<any> {
        const { data, error } = await supabase
            .from("database_connections")
            .select("encrypted_credentials")
            .eq("id", connectionId)
            .single();

        if (error) throw error;
        if (!data) throw new Error("Connection not found");

        return this.decrypt(data.encrypted_credentials);
    }
}
```

### Environment Variables

```env
# Database Service Security
CREDENTIALS_ENCRYPTION_KEY=<64-character-hex-key>  # Generate with: openssl rand -hex 32

# Connection Limits
MAX_CONNECTIONS_PER_USER=10
CONNECTION_TIMEOUT_MS=30000
QUERY_TIMEOUT_MS=60000

# Rate Limiting
MAX_QUERIES_PER_MINUTE=100
```

### Database Schema (Supabase)

```sql
-- Database connections table
CREATE TABLE database_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    connector_type VARCHAR(50) NOT NULL, -- 'postgres', 'mysql', etc.
    connection_name VARCHAR(255) NOT NULL,
    encrypted_credentials TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'disconnected', 'error'
    last_tested_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(user_id, connection_name)
);

-- Row-Level Security
ALTER TABLE database_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own connections"
    ON database_connections
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_db_connections_user_id ON database_connections(user_id);
CREATE INDEX idx_db_connections_status ON database_connections(status);
```

---

## Database-Specific Implementations

### 1. PostgreSQL Connector

**NPM Package**: `pg` (node-postgres)

```typescript
// src/backend/services/database-service/connectors/PostgreSQLConnector.ts

import { injectable } from "tsyringe";
import { Pool, PoolClient } from "pg";
import { IDatabaseConnector, DatabaseCredentials, ConnectionResult, QueryResult } from "../interfaces/IDatabaseConnector";

@injectable()
export class PostgreSQLConnector implements IDatabaseConnector {
    private pools: Map<string, Pool> = new Map();

    async testConnection(credentials: DatabaseCredentials): Promise<ConnectionResult> {
        const client = new Pool({
            host: credentials.host,
            port: credentials.port,
            database: credentials.database,
            user: credentials.username,
            password: credentials.password,
            ssl: credentials.ssl ? { rejectUnauthorized: false } : false,
            connectionTimeoutMillis: 10000
        });

        try {
            const testClient = await client.connect();
            await testClient.query("SELECT NOW()");
            testClient.release();
            await client.end();

            return {
                success: true,
                message: "PostgreSQL connection successful"
            };
        } catch (error) {
            await client.end();
            return {
                success: false,
                message: `Connection failed: ${error.message}`,
                error: error as Error
            };
        }
    }

    async connect(credentials: DatabaseCredentials, connectionName: string): Promise<ConnectionResult> {
        const connectionId = `pg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const pool = new Pool({
            host: credentials.host,
            port: credentials.port,
            database: credentials.database,
            user: credentials.username,
            password: credentials.password,
            ssl: credentials.ssl ? { rejectUnauthorized: false } : false,
            max: 10, // Connection pool size
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000
        });

        try {
            // Test the connection
            const client = await pool.connect();
            const result = await client.query("SELECT version()");
            client.release();

            this.pools.set(connectionId, pool);

            return {
                success: true,
                message: "PostgreSQL connected successfully",
                connectionId,
                metadata: {
                    version: result.rows[0].version,
                    database: credentials.database
                }
            };
        } catch (error) {
            await pool.end();
            return {
                success: false,
                message: `Connection failed: ${error.message}`,
                error: error as Error
            };
        }
    }

    async listTables(connectionId: string): Promise<string[]> {
        const pool = this.pools.get(connectionId);
        if (!pool) throw new Error("Connection not found");

        const query = `
            SELECT table_schema || '.' || table_name as full_name
            FROM information_schema.tables
            WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
            ORDER BY table_schema, table_name;
        `;

        const result = await pool.query(query);
        return result.rows.map(row => row.full_name);
    }

    async getSchema(connectionId: string, tableName: string): Promise<any[]> {
        const pool = this.pools.get(connectionId);
        if (!pool) throw new Error("Connection not found");

        const [schema, table] = tableName.includes('.') 
            ? tableName.split('.') 
            : ['public', tableName];

        const query = `
            SELECT 
                column_name as name,
                data_type as type,
                is_nullable = 'YES' as nullable,
                column_default,
                CASE WHEN column_name IN (
                    SELECT column_name 
                    FROM information_schema.key_column_usage 
                    WHERE table_schema = $1 AND table_name = $2
                ) THEN true ELSE false END as "isPrimaryKey"
            FROM information_schema.columns
            WHERE table_schema = $1 AND table_name = $2
            ORDER BY ordinal_position;
        `;

        const result = await pool.query(query, [schema, table]);
        return result.rows;
    }

    async query(connectionId: string, query: string, params?: any[]): Promise<QueryResult> {
        const pool = this.pools.get(connectionId);
        if (!pool) throw new Error("Connection not found");

        const startTime = Date.now();
        const result = await pool.query(query, params);
        const executionTime = Date.now() - startTime;

        return {
            rows: result.rows,
            rowCount: result.rowCount || 0,
            fields: result.fields.map(f => ({
                name: f.name,
                type: f.dataTypeID.toString(),
                nullable: true
            })),
            executionTime
        };
    }

    async sampleData(connectionId: string, tableName: string, limit: number = 10): Promise<QueryResult> {
        return this.query(connectionId, `SELECT * FROM ${tableName} LIMIT ${limit}`);
    }

    async disconnect(connectionId: string): Promise<void> {
        const pool = this.pools.get(connectionId);
        if (pool) {
            await pool.end();
            this.pools.delete(connectionId);
        }
    }

    async healthCheck(connectionId: string): Promise<boolean> {
        const pool = this.pools.get(connectionId);
        if (!pool) return false;

        try {
            const client = await pool.connect();
            await client.query("SELECT 1");
            client.release();
            return true;
        } catch {
            return false;
        }
    }
}
```

### 2. MySQL Connector

**NPM Package**: `mysql2/promise`

```typescript
// Similar structure to PostgreSQL, but using mysql2 API
// Key differences: Different connection string format, different system tables
```

### 3. SQL Server Connector

**NPM Package**: `mssql`

```typescript
// Uses TDS protocol, Windows Auth support, different query syntax
```

### 4. MongoDB Connector

**NPM Package**: `mongodb`

```typescript
// NoSQL approach: collections instead of tables, document-based queries
```

### 5. Supabase Connector

**NPM Package**: `@supabase/supabase-js`

```typescript
// Wrapper around PostgreSQL with Supabase SDK
```

### 6. Vertica Connector

**NPM Package**: `vertica-nodejs`

```typescript
// Enterprise analytics database, similar to PostgreSQL but optimized for OLAP
```

---

## MCP Server Integration

### MCP Tool Registration

```typescript
// src/backend/mcp/databaseTools.ts

import { container } from "../services/database-service/di/container";
import { DatabaseConnectorFactory } from "../services/database-service/factories/DatabaseConnectorFactory";

export function registerDatabaseTools(server: any) {
    const factory = container.resolve(DatabaseConnectorFactory);

    // Tool 1: List Tables
    server.registerTool({
        name: "db_list_tables",
        description: "Lists all tables/collections in a database connection",
        inputSchema: {
            type: "object",
            properties: {
                connection_id: { type: "string", description: "Database connection ID" }
            },
            required: ["connection_id"]
        },
        handler: async (args: { connection_id: string }) => {
            const connection = await getConnectionFromStorage(args.connection_id);
            const connector = factory.getConnector(connection.connector_type);
            const tables = await connector.listTables(args.connection_id);
            return { tables };
        }
    });

    // Tool 2: Get Schema
    server.registerTool({
        name: "db_get_schema",
        description: "Get column schema for a specific table",
        inputSchema: {
            type: "object",
            properties: {
                connection_id: { type: "string" },
                table_name: { type: "string" }
            },
            required: ["connection_id", "table_name"]
        },
        handler: async (args: { connection_id: string; table_name: string }) => {
            const connection = await getConnectionFromStorage(args.connection_id);
            const connector = factory.getConnector(connection.connector_type);
            const schema = await connector.getSchema(args.connection_id, args.table_name);
            return { schema };
        }
    });

    // Tool 3: Sample Data
    server.registerTool({
        name: "db_sample_data",
        description: "Get sample rows from a table for context",
        inputSchema: {
            type: "object",
            properties: {
                connection_id: { type: "string" },
                table_name: { type: "string" },
                limit: { type: "number", default: 10 }
            },
            required: ["connection_id", "table_name"]
        },
        handler: async (args: any) => {
            const connection = await getConnectionFromStorage(args.connection_id);
            const connector = factory.getConnector(connection.connector_type);
            const result = await connector.sampleData(
                args.connection_id,
                args.table_name,
                args.limit || 10
            );
            return result;
        }
    });
    
    // Tool 4: Execute Query
    server.registerTool({
        name: "db_query",
        description: "Execute a SELECT query on a database",
        inputSchema: {
            type: "object",
            properties: {
                connection_id: { type: "string" },
                query: { type: "string", description: "SQL SELECT query" }
            },
            required: ["connection_id", "query"]
        },
        handler: async (args: { connection_id: string; query: string }) => {
            // Security: Validate query is SELECT only
            if (!args.query.trim().toLowerCase().startsWith("select")) {
                throw new Error("Only SELECT queries are allowed");
            }

            const connection = await getConnectionFromStorage(args.connection_id);
            const connector = factory.getConnector(connection.connector_type);
            const result = await connector.query(args.connection_id, args.query);
            return result;
        }
    });
}
```

---

## Testing Strategy

### 1. Unit Tests

**Framework**: Jest + ts-jest

```typescript
// src/backend/services/database-service/__tests__/PostgreSQLConnector.test.ts

import { PostgreSQLConnector } from "../connectors/PostgreSQLConnector";
import { DatabaseCredentials } from "../interfaces/IDatabaseConnector";

describe("PostgreSQLConnector", () => {
    let connector: PostgreSQLConnector;

    beforeEach(() => {
        connector = new PostgreSQLConnector();
    });

    describe("testConnection", () => {
        it("should successfully connect with valid credentials", async () => {
            const credentials: DatabaseCredentials = {
                host: "localhost",
                port: 5432,
                database: "test_db",
                username: "test_user",
                password: "test_pass"
            };

            const result = await connector.testConnection(credentials);
            expect(result.success).toBe(true);
        });

        it("should fail with invalid credentials", async () => {
            const credentials: DatabaseCredentials = {
                host: "invalid-host",
                port: 5432,
                database: "test_db",
                username: "wrong_user",
                password: "wrong_pass"
            };

            const result = await connector.testConnection(credentials);
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });

    describe("listTables", () => {
        it("should return all tables in database", async () => {
            const connectionId = await setupTestConnection();
            const tables = await connector.listTables(connectionId);
            
            expect(Array.isArray(tables)).toBe(true);
            expect(tables.length).toBeGreaterThan(0);
        });
    });
});
```

### 2. Integration Tests

```typescript
// Test full flow: Connect → Query → Disconnect
describe("PostgreSQL Integration", () => {
    it("should complete full connection lifecycle", async () => {
        const credentials = getTestCredentials();
        
        // Connect
        const connResult = await connector.connect(credentials, "test-conn");
        expect(connResult.success).toBe(true);
        
        const connectionId = connResult.connectionId!;
        
        // Query
        const queryResult = await connector.query(
            connectionId,
            "SELECT * FROM users LIMIT 5"
        );
        expect(queryResult.rows.length).toBeGreaterThan(0);
        
        // Disconnect
        await connector.disconnect(connectionId);
        
        // Verify disconnected
        const healthCheck = await connector.healthCheck(connectionId);
        expect(healthCheck).toBe(false);
    });
});
```

### 3. E2E Tests (Playwright)

```typescript
// Test from UI → Backend → Database
test("User can connect to PostgreSQL database", async ({ page }) => {
    await page.goto("/dashboard/ingestion");
    
    // Click PostgreSQL connector
    await page.click('[data-testid="postgres-connector"]');
    
    // Fill credentials
    await page.fill('[name="host"]', 'localhost');
    await page.fill('[name="port"]', '5432');
    await page.fill('[name="database"]', 'testdb');
    await page.fill('[name="username"]', 'testuser');
    await page.fill('[name="password"]', 'testpass');
    
    // Test connection
    await page.click('[data-testid="test-connection"]');
    await expect(page.locator('.success-message')).toBeVisible();
    
    // Save connection
    await page.click('[data-testid="save-connection"]');
    await expect(page).toHaveURL(/\/dashboard\/connection\/postgres/);
});
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1)
**Days 1-2**: Architecture Setup
- [ ] Create folder structure
- [ ] Install dependencies (tsyringe, pg, mysql2, mssql, mongodb, etc.)
- [ ] Set up DI container
- [ ] Define all interfaces
- [ ] Generate encryption keys

**Days 3-5**: Core Services
- [ ] Implement CredentialsManager (encryption/decryption)
- [ ] Implement DatabaseConnectionManager (pool management)
- [ ] Implement DatabaseConnectorFactory
- [ ] Create Supabase migration for database_connections table
- [ ] Write unit tests for core services

**Days 6-7**: PostgreSQL Connector
- [ ] Implement full PostgreSQLConnector
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Test with local PostgreSQL instance

### Phase 2: Database Connectors (Week 2)
**Days 8-10**: MySQL & SQL Server
- [ ] Implement MySQLConnector
- [ ] Implement SQLServerConnector
- [ ] Unit + integration tests for both
- [ ] Test with Docker containers

**Days 11-14**: MongoDB, Supabase, Vertica
- [ ] Implement MongoDBConnector
- [ ] Implement SupabaseConnector
- [ ] Implement VerticaConnector (if access available, otherwise mock)
- [ ] Comprehensive testing for all

### Phase 3: API & MCP Integration (Week 3)
**Days 15-17**: REST API
- [ ] Create REST endpoints (/api/database/*)
- [ ] Request validation (Zod)
- [ ] Error handling middleware
- [ ] Rate limiting
- [ ] API documentation (Swagger)

**Days 18-21**: MCP Server Integration
- [ ] Integrate with existing MCP server
- [ ] Register all database tools
- [ ] Test MCP tool execution
- [ ] Document MCP usage

### Phase 4: Frontend & Testing (Week 4)
**Days 22-24**: Frontend Integration
- [ ] Update DatabaseConnectorPage to use new API
- [ ] Add real-time connection testing
- [ ] Connection status indicators
- [ ] Error handling & user feedback

**Days 25-28**: Production Prep
- [ ] End-to-end tests (Playwright)
- [ ] Load testing (k6 or Artillery)
- [ ] Security audit
- [ ] Performance optimization
- [ ] Deployment preparation

---

## Success Criteria

✅ **Functionality**
- All 6 database connectors fully functional
- Connection pooling implemented
- Query execution with timeout protection
- Schema inspection working

✅ **Security**
- AES-256-GCM encryption for credentials
- Row-level security on database_connections table
- SQL injection prevention
- Rate limiting on queries

✅ **Testing**
- 90%+ unit test coverage
- Integration tests for all connectors
- E2E tests for critical flows
- Load tests passing (100 concurrent connections)

✅ **Performance**
- Connection establishment < 2s
- Query execution < 5s (with timeout)
- Health checks < 500ms

✅ **Documentation**
- API documentation (Swagger)
- MCP tools documentation
- Developer setup guide
- Troubleshooting guide

---

## Next Steps

1. **Review this plan** with the team
2. **Set up development environment** (Docker, local databases)
3. **Create GitHub project board** with all tasks
4. **Begin Phase 1** implementation
5. **Daily standups** to track progress

---

**Estimated Total Effort**: 3-4 weeks (1 developer, full-time)  
**Risk Level**: Medium (database diversity, security requirements)  
**Production Readiness**: High (TDD approach, enterprise patterns)

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-15  
**Author**: DataIQ Engineering Team
