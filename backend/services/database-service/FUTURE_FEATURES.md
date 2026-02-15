# Future Features (Not Yet Implemented in 10% Baseline)

## 1. IP Whitelisting

**Status**: Placeholder UI only - not implemented

**What's Needed**:
- Static IP addresses for DataIQ servers
- UI to show IPs to whitelist
- Instructions for common database providers
- Detection of IP whitelist requirements

**Implementation Plan**:
```typescript
// Store DataIQ's static IPs
const DATAIQ_IPS = [
  '52.1.2.3',
  '52.1.2.4',
  '52.1.2.5'
];

// Show in UI
<Alert>
  <AlertTitle>IP Whitelisting Required</AlertTitle>
  <AlertDescription>
    Add these IPs to your database firewall:
    {DATAIQ_IPS.map(ip => <code key={ip}>{ip}</code>)}
  </AlertDescription>
</Alert>
```

**Priority**: Medium (needed for production deployment)

---

## 2. SSH Tunnel Support

**Status**: Not implemented - direct connections only

**What's Needed**:
- SSH tunnel library (`tunnel-ssh` or `ssh2`)
- UI toggle for "Direct Connection" vs "SSH Tunnel"
- Additional fields:
  - SSH Host
  - SSH Port (default 22)
  - SSH Username
  - SSH Private Key or Password
- Tunnel lifecycle management

**Implementation Plan**:
```typescript
interface SSHTunnelConfig {
  sshHost: string;
  sshPort: number;
  sshUsername: string;
  sshPrivateKey?: string;  // or password
  sshPassword?: string;
  localPort?: number;  // auto-assign
}

// Modify IDatabaseConnector
interface DatabaseCredentials {
  // ... existing fields
  useSshTunnel?: boolean;
  sshConfig?: SSHTunnelConfig;
}

// In connector
async connect(credentials: DatabaseCredentials) {
  if (credentials.useSshTunnel) {
    // 1. Establish SSH tunnel
    const tunnel = await createSSHTunnel(credentials.sshConfig);
    
    // 2. Connect to localhost:localPort instead of remote host
    const connection = await createConnection({
      host: 'localhost',
      port: tunnel.localPort,
      // ... other credentials
    });
    
    // 3. Store tunnel reference for cleanup
    this.tunnels.set(connectionId, tunnel);
  }
}
```

**Priority**: High (many production databases require SSH tunnels)

---

## 3. SSL/TLS Certificate Validation

**Status**: Basic SSL support - no custom certs

**What's Needed**:
- Custom CA certificate upload
- Client certificate support (mutual TLS)
- Certificate validation options
- Self-signed certificate handling

**Implementation Plan**:
```typescript
interface SSLConfig {
  enabled: boolean;
  rejectUnauthorized?: boolean;  // for self-signed
  ca?: string;  // CA certificate
  cert?: string;  // Client certificate
  key?: string;  // Client key
}

// PostgreSQL example
const pool = new Pool({
  ssl: credentials.ssl ? {
    rejectUnauthorized: credentials.sslConfig?.rejectUnauthorized ?? true,
    ca: credentials.sslConfig?.ca,
    cert: credentials.sslConfig?.cert,
    key: credentials.sslConfig?.key
  } : false
});
```

**Priority**: Medium

---

## 4. Connection Pooling Customization

**Status**: Default pool settings only

**What's Needed**:
- UI for pool configuration
- Different presets (small/medium/large/custom)
- Real-time pool metrics

**Implementation Plan**:
```typescript
interface PoolConfig {
  min?: number;  // minimum connections
  max?: number;  // maximum connections
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

// Allow users to configure
const customPool = new Pool({
  ...credentials,
  min: poolConfig.min || 2,
  max: poolConfig.max || 10,
  idleTimeoutMillis: poolConfig.idleTimeoutMillis || 30000,
  connectionTimeoutMillis: poolConfig.connectionTimeoutMillis || 2000
});
```

**Priority**: Low (current defaults work for most use cases)

---

## 5. Read-Only User Validation

**Status**: Frontend recommendation only - not enforced

**What's Needed**:
- Query user's permissions on connect
- Warn if user has write access
- Block dangerous operations
- Audit log for all queries

**Implementation Plan**:
```typescript
async validateReadOnlyAccess(connectionId: string): Promise<boolean> {
  // PostgreSQL example
  const result = await this.query(connectionId, `
    SELECT has_table_privilege(current_user, tablename, 'UPDATE') as can_update
    FROM pg_tables
    WHERE schemaname = 'public'
    LIMIT 1
  `);
  
  if (result.rows[0]?.can_update) {
    console.warn('User has write access - recommend read-only user');
    return false;
  }
  
  return true;
}
```

**Priority**: High (security best practice)

---

## 6. Query Timeout & Rate Limiting

**Status**: Not implemented

**What's Needed**:
- Configurable query timeouts
- Rate limiting per user/connection
- Query cost estimation
- Automatic query cancellation

**Implementation Plan**:
```typescript
interface QueryOptions {
  timeout?: number;  // milliseconds
  maxRows?: number;
}

async query(
  connectionId: string,
  query: string,
  options: QueryOptions = {}
): Promise<QueryResult> {
  const timeout = options.timeout || 30000;
  const maxRows = options.maxRows || 10000;
  
  // Set statement timeout (PostgreSQL)
  await this.execute(`SET statement_timeout = ${timeout}`);
  
  // Add LIMIT if not present
  const limitedQuery = query.includes('LIMIT')
    ? query
    : `${query} LIMIT ${maxRows}`;
  
  return await this.execute(limitedQuery);
}
```

**Priority**: High (prevent runaway queries)

---

## Implementation Roadmap

### Phase 1 (Current - 10% Baseline) ✅
- Basic connection support
- Credentials encryption
- Read-only queries
- Connection pooling (defaults)

### Phase 2 (Next - 50% Implementation)
- SSH Tunnel support
- Read-only validation
- Query timeouts & rate limiting
- IP whitelist documentation

### Phase 3 (Production - 100%)
- Custom SSL certificates
- Connection pool customization
- Advanced security features
- Monitoring & alerting

---

## Current Workarounds

### For SSH Tunnel:
1. Use a bastion host with port forwarding
2. Set up VPN access to database network
3. Use cloud provider's managed tunneling (AWS SSM, GCP Cloud SQL Proxy)

### For IP Whitelist:
1. User must manually configure their firewall
2. We provide documentation for common providers
3. Test connection to verify setup

---

**Last Updated**: 2026-02-15  
**Status**: 10% baseline complete - advanced features pending
