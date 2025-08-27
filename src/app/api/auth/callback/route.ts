import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
        // Sincronizar dados do perfil do Discord com a tabela `profiles`
        const { user } = data
        const { error: profileError } = await supabase.from('profiles').upsert({
            id: user.id,
            discord_username: user.user_metadata.user_name,
            avatar_url: user.user_metadata.avatar_url,
            updated_at: new Date().toISOString()
        })

        if (profileError) {
            console.error("Erro ao sincronizar perfil:", profileError)
            // Se falhar ao criar/atualizar profile, desloga o usuário
            await supabase.auth.signOut()
            return NextResponse.redirect(new URL('https://darkcloud.store/?error=profile_sync_failed'))
        }

        // Verificar se o profile foi realmente criado
        const { data: profile, error: checkError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .single()

        if (checkError || !profile) {
            console.error("Profile não encontrado após upsert:", checkError)
            // Se profile não existe, desloga o usuário
            await supabase.auth.signOut()
            return NextResponse.redirect(new URL('https://darkcloud.store/?error=profile_not_found'))
        }
    }
  }
  
  return NextResponse.redirect(new URL('https://darkcloud.store/dashboard'))
}