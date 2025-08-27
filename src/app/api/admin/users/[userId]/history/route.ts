import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest, context: any) {
    const supabase = await createClient();
    const targetUserId = context.params.userId;

    // 1. Verificar se o requisitante está autenticado e é owner
    const { data: { user: requester } } = await supabase.auth.getUser();
    if (!requester) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('admin_level')
        .eq('id', requester.id)
        .single();

    if (profile?.admin_level !== 'owner') {
        return NextResponse.json({ error: 'Acesso negado. Apenas o owner pode ver o histórico.' }, { status: 403 });
    }

    // 2. Buscar o histórico de pagamentos do usuário alvo
    try {
        const { data: paymentHistory, error } = await supabase
            .from('payments')
            .select(`
                id,
                created_at,
                price,
                status,
                user_name,
                email,
                plans ( name )
            `)
            .eq('user_id', targetUserId)
            .eq('status', 'paid') // Apenas pagamentos concluídos
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        return NextResponse.json(paymentHistory);
    } catch (error) {
        console.error(`Erro ao buscar histórico do usuário ${targetUserId}:`, error);
        return NextResponse.json(
            { error: 'Erro interno ao buscar histórico de pagamentos.' },
            { status: 500 }
        );
    }
}