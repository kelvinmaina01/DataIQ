-- Database Connections Table Migration
-- Stores encrypted database connection credentials

-- Create database_connections table
CREATE TABLE IF NOT EXISTS database_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    connector_type VARCHAR(50) NOT NULL, -- 'postgres', 'mysql', 'sqlserver', 'mongodb', 'supabase', 'vertica'
    connection_name VARCHAR(255) NOT NULL,
    encrypted_credentials TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'disconnected', 'error'
    last_tested_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    CONSTRAINT unique_user_connection_name UNIQUE(user_id, connection_name)
);

-- Enable Row-Level Security
ALTER TABLE database_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own connections
CREATE POLICY "Users can manage their own database connections"
    ON database_connections
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_db_connections_user_id ON database_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_db_connections_status ON database_connections(status);
CREATE INDEX IF NOT EXISTS idx_db_connections_connector_type ON database_connections(connector_type);
CREATE INDEX IF NOT EXISTS idx_db_connections_created_at ON database_connections(created_at DESC);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_database_connections_updated_at
    BEFORE UPDATE ON database_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comment on table
COMMENT ON TABLE database_connections IS 'Stores encrypted credentials for database connections';
COMMENT ON COLUMN database_connections.encrypted_credentials IS 'AES-256-GCM encrypted credentials JSON';
COMMENT ON COLUMN database_connections.metadata IS 'Additional connection metadata (database version, etc.)';
