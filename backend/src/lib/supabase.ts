// src/lib/supabase.ts

import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY!;

if (!url || !key) {
  // Throw a clearer message, so you know to mock this in tests
  throw new Error('Supabase client: SUPABASE_URL and key are required (mock lib/supabase in tests).');
}

export const supabase = createClient(url, key, { auth: { persistSession: false } });
