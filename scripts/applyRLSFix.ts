import { supabase } from './backend/supabase/supabaseClient';

/**
 * This script applies the RLS policy fix to Supabase storage.
 * Run this once to fix the manual upload issue.
 */
async function applyRLSFix() {
    console.log('Applying RLS policy fix to Supabase...');

    const sqlCommands = [
        // Drop existing policies
        `DROP POLICY IF EXISTS "Public Access" ON storage.objects;`,
        `DROP POLICY IF EXISTS "Public Upload" ON storage.objects;`,
        `DROP POLICY IF EXISTS "Public Update" ON storage.objects;`,
        `DROP POLICY IF EXISTS "Public Delete" ON storage.objects;`,
        `DROP POLICY IF EXISTS "Allow All Access" ON storage.objects;`,
        `DROP POLICY IF EXISTS "Allow All Insert" ON storage.objects;`,

        // Create new policies
        `CREATE POLICY "Allow SELECT on datasets bucket" 
         ON storage.objects FOR SELECT 
         USING (bucket_id = 'datasets');`,

        `CREATE POLICY "Allow INSERT on datasets bucket" 
         ON storage.objects FOR INSERT 
         WITH CHECK (bucket_id = 'datasets');`,

        `CREATE POLICY "Allow UPDATE on datasets bucket" 
         ON storage.objects FOR UPDATE 
         USING (bucket_id = 'datasets');`,

        `CREATE POLICY "Allow DELETE on datasets bucket" 
         ON storage.objects FOR DELETE 
         USING (bucket_id = 'datasets');`
    ];

    try {
        // Execute all SQL commands
        for (const sql of sqlCommands) {
            console.log('Executing:', sql.substring(0, 50) + '...');
            const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
            if (error) {
                console.error('Error executing SQL:', error);
                throw error;
            }
        }

        console.log('✅ RLS policies applied successfully!');
        console.log('You can now upload files to Supabase.');

    } catch (error) {
        console.error('❌ Failed to apply RLS fix:', error);
        console.log('\nPlease run the SQL manually in Supabase SQL Editor:');
        console.log('See: backend/supabase/migrations/fix_storage_rls.sql');
    }
}

// Run the fix
applyRLSFix();
