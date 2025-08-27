import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/middleware';
import aiConfigController from '@/functions/database/controllers/AIConfigController';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
    const { supabase } = createClient(request);

    // 1. Verificar se o usuário está autenticado
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // 2. Verificar se o usuário é admin ou owner
    const { data: profile } = await supabase
        .from('profiles')
        .select('admin_level')
        .eq('id', user.id)
        .single();

    if (profile?.admin_level !== 'admin' && profile?.admin_level !== 'owner') {
        return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    // 3. Processar a requisição
    try {
        const { key, value } = await request.json();

        if (!key || value === undefined) {
            return NextResponse.json({ error: 'Parâmetros key e value são obrigatórios.' }, { status: 400 });
        }

        const config = await aiConfigController.set(key, value);
        return NextResponse.json(config);
    } catch (error) {
        console.error('Erro ao definir configuração da IA:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}