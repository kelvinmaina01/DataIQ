-- Run this query in your Supabase SQL Editor to fix the RLS policies
-- This will allow uploads to the datasets bucket

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload" ON storage.objects;
DROP POLICY IF EXISTS "Public Update" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete" ON storage.objects;
DROP POLICY IF EXISTS "Allow All Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow All Insert" ON storage.objects;

-- Create separate policies for each operation
CREATE POLICY "Allow SELECT on datasets bucket" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'datasets');

CREATE POLICY "Allow INSERT on datasets bucket" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'datasets');

CREATE POLICY "Allow UPDATE on datasets bucket" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'datasets');

CREATE POLICY "Allow DELETE on datasets bucket" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'datasets');
