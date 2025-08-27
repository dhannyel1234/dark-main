import { createClient } from '@supabase/supabase-js';

// As variáveis de ambiente devem ser configuradas no seu arquivo .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Variável de ambiente ausente: NEXT_PUBLIC_SUPABASE_URL");
}

if (!supabaseServiceRoleKey) {
  throw new Error("Variável de ambiente ausente: SUPABASE_SERVICE_ROLE_KEY");
}

// Exporta um cliente Supabase para uso no lado do servidor (com privilégios de serviço)
// Este cliente pode contornar as políticas de RLS e é seguro para usar apenas no backend.
export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    // É importante desabilitar a persistência de sessão no lado do servidor
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});