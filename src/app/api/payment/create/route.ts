import { NextRequest, NextResponse } from 'next/server';
import { AuthHybrid } from '@/lib/auth-hybrid';
import { createClient } from '@/utils/supabase/middleware';
import plansController from '@/functions/database/controllers/PlansController';
import paymentController from '@/functions/database/controllers/PaymentController';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
    try {
        // 1. Verificar se o usuário está autenticado
        const user = await AuthHybrid.getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        // 2. Obter dados do corpo da requisição
        const body = await request.json();
        const { planId, finalPrice } = body;

        if (!planId || finalPrice === undefined) {
            return NextResponse.json({ error: 'ID do plano e preço final são obrigatórios.' }, { status: 400 });
        }

        // 3. Buscar dados do plano diretamente do Supabase
        const { supabase } = createClient(request);
        const { data: planData, error: planError } = await supabase
            .from('plans')
            .select('*')
            .eq('id', planId)
            .single();
            
        if (planError || !planData) {
            return NextResponse.json({ error: `Plano com ID '${planId}' não encontrado.` }, { status: 404 });
        }

        // 4. Criar o registro de pagamento inicial
        const payment_id = `${planData.name.toLowerCase()}_${randomUUID()}`;

        const newPayment = await paymentController.create({
            user_id: user.id,
            user_name: user.profile?.username || user.email || 'unknown',
            plan_id: planData.id,
            payment_id: payment_id,
            status: 'pending', // Será definido no confirm
            price: parseFloat(planData.price), // Usar o preço do banco
            custom_id: payment_id,
            expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString() // Expira em 15 minutos
        });

        return NextResponse.json({
            success: true,
            paymentId: newPayment.id,
            customId: payment_id,
            message: 'Registro de pagamento criado. Prossiga para o checkout.'
        });

    } catch (error) {
        console.error('❌ Erro ao iniciar pagamento:', error);
        return NextResponse.json(
            {
                error: 'Erro ao iniciar pagamento',
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}