import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/middleware';
import aiConfigController from '@/functions/database/controllers/AIConfigController';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    const { supabase } = createClient(request);

    // 1. Verificar se o usuário está autenticado
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const key = searchParams.get('key');

        // 2. Se uma chave específica for fornecida, retorna apenas essa configuração
        if (key) {
            const value = await aiConfigController.get(key);
            return NextResponse.json({ value });
        }

        // 3. Se nenhuma chave for fornecida, retorna todas as configurações
        const configs = await aiConfigController.getAll();
        return NextResponse.json(configs);
    } catch (error) {
        console.error('Erro ao obter configurações da IA:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}