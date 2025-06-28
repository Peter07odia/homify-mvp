import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';

// Ensure we have a valid Supabase URL
const validSupabaseUrl = SUPABASE_URL && SUPABASE_URL.trim() !== '' 
  ? SUPABASE_URL.trim() 
  : '';

if (!validSupabaseUrl) {
  console.error('SUPABASE_URL is not configured in .env file');
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Use Supabase Edge Function which handles upload + n8n webhook trigger
// This ensures images get proper URLs before being sent to n8n
export const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/empty-room`;

// Alternative: Use simplified transformation webhook directly
export const SIMPLE_TRANSFORM_WEBHOOK = 'https://jabaranks7.app.n8n.cloud/webhook/transform-room-simple';

// Export SUPABASE_ANON_KEY for direct API calls
export const SUPABASE_ANON_KEY_REF = SUPABASE_ANON_KEY;

// Export SUPABASE_URL for network connectivity tests
export const SUPABASE_URL_REF = SUPABASE_URL;

// FLOW: App → Supabase Edge Function → Upload to Storage → Get Public URL → Trigger n8n → n8n downloads from URL 