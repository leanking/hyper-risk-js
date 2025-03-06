import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from './index';

// Check if Supabase URL and key are provided
if (!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.key) {
  console.error('Supabase URL and key must be provided in environment variables');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);

export default supabase; 