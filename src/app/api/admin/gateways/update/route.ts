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
        return NextResponse.json({ error: 'Acesso negado. Apenas o owner pode atualizar os gateways.' }, { status: 403 });
    }

    // 2. Obter dados do corpo da requisição
    const { provider, is_active, confirmation_type, polling_interval_seconds } = await request.json();

    if (!provider) {
        return NextResponse.json({ error: 'Parâmetro provider (string) é obrigatório.' }, { status: 400 });
    }

    // Monta o objeto de atualização apenas com os campos fornecidos
    const updatePayload: { [key: string]: any } = { updated_at: new Date().toISOString() };
    if (is_active !== undefined) {
        updatePayload.is_active = is_active;
    }
    if (confirmation_type) {
        updatePayload.confirmation_type = confirmation_type;
    }
    if (polling_interval_seconds !== undefined) {
        updatePayload.polling_interval_seconds = polling_interval_seconds;
    }

    // 3. Atualizar o gateway de pagamento
    try {
        const { data, error } = await supabase
            .from('payment_gateways')
            .update(updatePayload)
            .eq('provider', provider)
            .select()
            .single();

        if (error) {
            throw error;
        }

        if (!data) {
            return NextResponse.json({ error: `Gateway com provedor '${provider}' não encontrado.` }, { status: 404 });
        }

        return NextResponse.json({ message: 'Gateway atualizado com sucesso.', gateway: data });
    } catch (error) {
        console.error('Erro ao atualizar gateway de pagamento:', error);
        return NextResponse.json(
            { error: 'Erro interno ao atualizar gateway de pagamento.' },
            { status: 500 }
        );
    }
}