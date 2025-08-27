// Database setup - Using Supabase only
import { createClient } from '@/utils/supabase/server';

// Export the main Supabase client
export const supabase = createClient();

// For compatibility with existing code
export const db = supabase;

// Export database client creation function
export { createClient };