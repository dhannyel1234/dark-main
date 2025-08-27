import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { AuthHybrid } from '@/lib/auth-hybrid'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
        // Usar a função existente para garantir que o perfil existe
        const { user } = data
        try {
            await AuthHybrid.ensureProfile(user)
            console.log('Profile garantido com sucesso para usuário:', user.id)
        } catch (profileError) {
            console.error("Erro ao garantir perfil:", profileError)
            // Se falhar ao criar/atualizar profile, desloga o usuário
            await supabase.auth.signOut()
            return NextResponse.redirect(new URL('https://darkcloud.store/?error=profile_sync_failed'))
        }
    }
  }
  
  return NextResponse.redirect(new URL('https://darkcloud.store/dashboard'))
}