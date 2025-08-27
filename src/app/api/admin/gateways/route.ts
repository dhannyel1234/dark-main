import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
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
        return NextResponse.json({ error: 'Acesso negado. Apenas o owner pode ver os gateways.' }, { status: 403 });
    }

    // 2. Buscar todos os gateways de pagamento
    try {
        const { data: gateways, error } = await supabase
            .from('payment_gateways')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            throw error;
        }

        return NextResponse.json(gateways);
    } catch (error) {
        console.error('Erro ao buscar gateways de pagamento:', error);
        return NextResponse.json(
            { error: 'Erro interno ao buscar gateways de pagamento.' },
            { status: 500 }
        );
    }
}