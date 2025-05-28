import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, N8N_WEBHOOK_URL, STYLE_WEBHOOK_URL } from '@env';

// Ensure we have a valid Supabase URL
const validSupabaseUrl = SUPABASE_URL && SUPABASE_URL.trim() !== '' 
  ? SUPABASE_URL.trim() 
  : '';

if (!validSupabaseUrl) {
  console.error('SUPABASE_URL is not configured in .env file');
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export the Edge Function URL for use in services
// App uploads to Supabase Edge Function, which then triggers N8N webhook
export const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/empty-room`;

// Export N8N webhook URL for reference (used by Edge Function, not directly by app)
export const N8N_WEBHOOK_URL_REF = N8N_WEBHOOK_URL;

// Export Style webhook URL for style processing
export const STYLE_WEBHOOK_URL_REF = STYLE_WEBHOOK_URL;

// Export SUPABASE_ANON_KEY for direct API calls
export const SUPABASE_ANON_KEY_REF = SUPABASE_ANON_KEY;

// NOTE: Currently using N8N webhook for image processing 