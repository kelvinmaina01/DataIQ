import { createClient } from '@supabase/supabase-js';

// Replace with your actual Supabase URL and Anon Key
const supabaseUrl = 'https://nwqiqgiivwbknpkwaedh.supabase.co';
const supabaseAnonKey = 'sb_publishable_oyuBIE4w0b0vxQYA9ZdGRg_c2z2cpq8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Identity Bridge Helper
 * Informs Supabase of the current Firebase user UID to enforce RLS policies.
 */
export const setSupabaseIdentity = async (uid: string) => {
    // We call a Postgres function that sets the 'app.user_id' session variable
    return await supabase.rpc('set_app_user', { uid });
};
