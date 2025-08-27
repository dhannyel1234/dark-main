import { NextRequest, NextResponse } from 'next/server';
import { AuthHybrid } from '@/lib/auth-hybrid';
import { createAdminClient } from '@/utils/supabase/admin';

export async function POST(request: NextRequest) {
    try {
        // 1. Verificar autenticação e permissões
        const user = await AuthHybrid.getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const isOwner = await AuthHybrid.isOwner(user.id);
        if (!isOwner) {
            await AuthHybrid.sendSecurityWebhook(request, user, 'Tentativa de atribuir plano não autorizada');
            return NextResponse.json({ error: 'Acesso negado. Apenas owners podem atribuir planos.' }, { status: 403 });
        }

        // 2. Obter dados da requisição
        const { userId, planName, days } = await request.json();

        if (!userId || !planName || !days) {
            return NextResponse.json({ 
                error: 'userId, planName e days são obrigatórios' 
            }, { status: 400 });
        }

        // 3. Buscar o plano pelo nome para obter o ID
        const supabase = createAdminClient();
        const { data: plan, error: planError } = await supabase
            .from('plans')
            .select('id')
            .eq('name', planName)
            .single();

        if (planError || !plan) {
            return NextResponse.json({ 
                error: 'Plano não encontrado' 
            }, { status: 404 });
        }

        // 4. Calcular datas
        const activationDate = new Date();
        const expirationDate = new Date();
        expirationDate.setDate(activationDate.getDate() + parseInt(days));

        // 5. Criar registro de plano do usuário
        const { data, error } = await supabase
            .from('user_plans')
            .insert({
                user_id: userId,
                plan_id: plan.id,
                status: 'active',
                activated_at: activationDate.toISOString(),
                expires_at: expirationDate.toISOString(),
                charge_id: `admin-${Date.now()}`, // ID único para atribuições manuais do admin
                payment_value: '0.00' // Valor 0 para atribuições gratuitas do admin
            })
            .select()
            .single();

        if (error) {
            console.error('Erro ao criar user_plan:', error);
            return NextResponse.json({ 
                error: 'Erro ao atribuir plano',
                details: error.message 
            }, { status: 500 });
        }

        // 5. Log de auditoria
        await AuthHybrid.sendSecurityWebhook(request, user, 
            `Plano atribuído: ${planName} para usuário ${userId} por ${days} dias`
        );

        return NextResponse.json({
            success: true,
            message: `Plano '${planName}' atribuído com sucesso por ${days} dias`,
            user_plan: data
        });

    } catch (error: any) {
        console.error('Erro ao atribuir plano:', error);
        return NextResponse.json({ 
            error: 'Erro interno do servidor',
            details: error.message 
        }, { status: 500 });
    }
}