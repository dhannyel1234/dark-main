import { NextRequest, NextResponse } from 'next/server';
import { AuthHybrid } from '@/lib/auth-hybrid';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação e permissão
    const user = await AuthHybrid.getAuthenticatedUser();
    if (!user) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    if (!user.profile || !['admin', 'owner'].includes(user.profile.admin_level)) {
        await AuthHybrid.sendSecurityWebhook(request, user, 'Tentativa de limpar fila sem permissão');
        return NextResponse.json({ error: 'Acesso negado - Apenas administradores' }, { status: 403 });
    }

    // Usar Supabase para operação na fila
    const supabase = await createClient();

    const { error, count } = await supabase
      .from('queue')
      .delete()
      .eq('status', 'waiting');

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, deleted: count });
  } catch (error) {
    console.error("Erro ao limpar fila:", error);
    return NextResponse.json({ error: 'Erro ao limpar filas' }, { status: 500 });
  }
}