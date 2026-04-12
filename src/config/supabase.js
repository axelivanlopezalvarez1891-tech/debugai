import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; // Use Service Role for backend operations

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️  Supabase credentials missing. Analysis and Auth will fail in production.');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
