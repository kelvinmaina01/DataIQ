-- Datasets Table
CREATE TABLE IF NOT EXISTS datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL, -- This holds the Firebase UID
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    row_count INTEGER DEFAULT 0,
    column_count INTEGER DEFAULT 0,
    quality_score NUMERIC DEFAULT 0,
    grade TEXT,
    domain TEXT,
    method TEXT DEFAULT 'Manual Upload',
    file_size BIGINT DEFAULT 0,
    status TEXT DEFAULT 'Active',
    storage_path TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Identity Bridge Function for Firebase Auth
-- This sets a session variable that RLS can check
CREATE OR REPLACE FUNCTION set_app_user(uid TEXT)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_user_id', uid, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;

-- Secure RLS Policy using the Identity Bridge
DROP POLICY IF EXISTS "Users can only access their own datasets" ON datasets;
CREATE POLICY "Users can only access their own datasets" 
ON datasets 
FOR ALL 
USING (user_id = current_setting('app.current_user_id', true));

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_datasets_updated_at
BEFORE UPDATE ON datasets
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Storage Setup (Can only be run by service role or manually in SQL editor)
-- This ensures the 'datasets' bucket exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('datasets', 'datasets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies (Simplified for Firebase compatibility via app layer isolation)
-- We allow all authenticated-like uploads to the 'datasets' bucket
-- but we enforce the directory structure in the application code.
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'datasets');
CREATE POLICY "Public Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'datasets');
