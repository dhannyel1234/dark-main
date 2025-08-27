import { createClient } from '@supabase/supabase-js'

/**
 * Cliente Supabase para operações administrativas no servidor
 * Usa SERVICE_ROLE_KEY para bypass de RLS (Row Level Security)
 * APENAS para uso em server-side operations
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}