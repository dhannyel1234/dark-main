import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Rota pública para buscar gateways de pagamento ativos
export async function GET() {
    const supabase = await createClient();

    try {
        const { data: gateways, error } = await supabase
            .from('payment_gateways')
            .select('name, provider, confirmation_type, polling_interval_seconds')
            .eq('is_active', true)
            .order('name');

        if (error) {
            throw error;
        }

        return NextResponse.json(gateways);
    } catch (error) {
        console.error('Erro ao buscar gateways públicos:', error);
        return NextResponse.json(
            { error: 'Não foi possível carregar os métodos de pagamento.' },
            { status: 500 }
        );
    }
}