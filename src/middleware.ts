import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/middleware';

// Tipos para os dados do usuário para clareza
interface UserProfile {
  admin_level: 'user' | 'admin' | 'owner';
}

interface UserMetadata {
  name?: string;
  avatar_url?: string;
  [key: string]: any;
}

interface SupabaseUser {
  id: string;
  email?: string;
  user_metadata: UserMetadata;
}

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request);

  // Atualiza a sessão do usuário a cada requisição
  const { data: { session } } = await supabase.auth.getSession();

  // Protege a rota /admin
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!session) {
      console.log('🔒 Middleware: Sessão não encontrada. Redirecionando.');
      return NextResponse.redirect(new URL('/', request.url));
    }

    try {
      // Busca o perfil do usuário para verificar o nível de admin
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('admin_level')
        .eq('id', session.user.id)
        .single<UserProfile>();

      if (error || !profile) {
        console.error('❌ Middleware: Perfil não encontrado ou erro ao buscar.', error);
        return NextResponse.redirect(new URL('/404', request.url));
      }

      const { admin_level } = profile;
      console.log(`🔑 Middleware: Usuário ${session.user.id} tem nível de acesso: ${admin_level}`);

      // Verifica se o usuário tem permissão de admin ou owner
      if (admin_level === 'admin' || admin_level === 'owner') {
        // Opcional: Envia o webhook apenas se a verificação for bem-sucedida
        await sendAdminAccessWebhook(request, session.user);
        return response || NextResponse.next();
      }

      // Se não for admin ou owner, nega o acesso
      console.log('🚫 Middleware: Acesso negado para o nível:', admin_level);
      return NextResponse.redirect(new URL('/404', request.url));

    } catch (e) {
      console.error('❌ Middleware: Erro inesperado ao verificar permissões:', e);
      return NextResponse.redirect(new URL('/404', request.url));
    }
  }

  return response || NextResponse.next();
}

async function sendAdminAccessWebhook(request: NextRequest, user: SupabaseUser) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_ADMIN;
  if (!webhookUrl) {
    console.warn('DISCORD_WEBHOOK_ADMIN não está configurado');
    return;
  }

  try {
    const now = new Date();
    const brazilTime = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).format(now);

    const embed = {
      title: "🔐 Acesso ao Dashboard Admin",
      description: "Um administrador acessou o dashboard.",
      color: 0xff0000,
      fields: [
        { name: "👤 Usuário", value: user.user_metadata.name || 'N/A', inline: true },
        { name: "📧 Email", value: user.email || 'N/A', inline: true },
        { name: "🆔 Discord ID", value: user.id, inline: true },
        { name: "🌐 Rota Acessada", value: `\`${request.nextUrl.pathname}\``, inline: false },
        { name: "🕒 Horário (Brasil)", value: brazilTime, inline: true },
        { name: "🌍 IP", value: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'N/A', inline: true },
        { name: "🖥️ User Agent", value: `\`${request.headers.get('user-agent')?.substring(0, 100) || 'N/A'}\``, inline: false }
      ],
      thumbnail: { url: user.user_metadata.avatar_url || undefined },
      timestamp: now.toISOString(),
      footer: { text: "Sistema de Monitoramento Admin" }
    };

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] })
    });
  } catch (error) {
    console.error('Erro ao enviar webhook para Discord:', error);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};