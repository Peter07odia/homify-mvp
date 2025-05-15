import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';

// Create a single supabase client for interacting with your database
export const supabase = createClient(
  SUPABASE_URL || '',
  SUPABASE_ANON_KEY || ''
);

// Export URLs for edge functions
export const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/empty-room`; 