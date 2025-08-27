import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from('ai_configs') // Usando a tabela de configurações existente
            .select('value')
            .eq('key', 'payments_enabled')
            .single();

        if (error) {
            // Se a chave não existir, assumimos que os pagamentos estão habilitados por padrão
            if (error.code === 'PGRST116') {
                return NextResponse.json({ enabled: true });
            }
            throw error;
        }

        // O valor é armazenado como texto ('true' ou 'false')
        const isEnabled = data?.value === 'true';

        return NextResponse.json({ enabled: isEnabled });
    } catch (error) {
        console.error('Erro ao buscar status de pagamento:', error);
        // Em caso de erro, é mais seguro assumir que os pagamentos estão desabilitados
        return NextResponse.json(
            { enabled: false, error: 'Erro interno ao buscar status de pagamento.' },
            { status: 500 }
        );
    }
}