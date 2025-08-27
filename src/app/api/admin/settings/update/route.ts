import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
    const supabase = await createClient();

    // 1. Verificar se o requisitante está autenticado e é owner
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('admin_level')
        .eq('id', user.id)
        .single();

    if (profile?.admin_level !== 'owner') {
        return NextResponse.json({ error: 'Acesso negado. Apenas o owner pode atualizar as configurações.' }, { status: 403 });
    }

    // 2. Obter dados do corpo da requisição
    const { key, value } = await request.json();

    if (!key || typeof value !== 'string') {
        return NextResponse.json({ error: 'Parâmetros key (string) e value (string) são obrigatórios.' }, { status: 400 });
    }

    // 3. Atualizar a configuração
    try {
        const { data, error } = await supabase
            .from('ai_configs') // Usando a tabela de configurações existente
            .update({ value, updated_at: new Date().toISOString() })
            .eq('key', key)
            .select()
            .single();

        if (error) {
            // Se a chave não existir, podemos criá-la
            if (error.code === 'PGRST116') {
                const { data: newData, error: newError } = await supabase
                    .from('ai_configs')
                    .insert({ key, value })
                    .select()
                    .single();
                
                if (newError) throw newError;

                return NextResponse.json({ message: 'Configuração criada com sucesso.', setting: newData });
            }
            throw error;
        }

        return NextResponse.json({ message: 'Configuração atualizada com sucesso.', setting: data });
    } catch (error) {
        console.error('Erro ao atualizar configuração:', error);
        return NextResponse.json(
            { error: 'Erro interno ao atualizar configuração.' },
            { status: 500 }
        );
    }
}