import { NextRequest, NextResponse } from 'next/server';
import { AuthHybrid } from '@/lib/auth-hybrid';
import { createAdminClient } from '@/utils/supabase/admin';

export async function GET(request: NextRequest) {
    try {
        // 1. Verificar autenticação
        const user = await AuthHybrid.getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        // 2. Verificar se usuário tem plano ativo
        const supabase = createAdminClient();
        const { data: userPlans, error } = await supabase
            .from('user_plans')
            .select('id, status, expires_at')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .gt('expires_at', new Date().toISOString());

        if (error) {
            console.error('Erro ao verificar plano do usuário:', error);
            return NextResponse.json({ 
                error: 'Erro ao verificar plano',
                details: error.message 
            }, { status: 500 });
        }

        const hasActivePlan = userPlans && userPlans.length > 0;

        return NextResponse.json({
            success: true,
            has_active_plan: hasActivePlan,
            active_plans_count: userPlans?.length || 0
        });

    } catch (error: any) {
        console.error('Erro ao verificar status do plano:', error);
        return NextResponse.json({ 
            error: 'Erro interno do servidor',
            details: error.message 
        }, { status: 500 });
    }
}