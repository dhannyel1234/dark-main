import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import userPlanController from '@/functions/database/controllers/UserPlanController';

// Forçar renderização dinâmica
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const userId = user.id;

    // Buscar planos ativos do usuário usando o controller atualizado
    const userActivePlans = await userPlanController.getUserActivePlans(userId);

    const activePlans = userActivePlans.map(userPlan => ({
      type: userPlan.plans?.name?.toLowerCase() || 'unknown',
      name: userPlan.plans?.name || 'Plano desconhecido',
      id: userPlan.plan_id,
      expires_at: userPlan.expires_at,
      status: userPlan.status
    }));

    console.log('DEBUG /api/user/plans userId:', userId, 'activePlans:', activePlans);

    return NextResponse.json({
      success: true,
      plans: activePlans
    });

  } catch (error) {
    console.error('Erro ao buscar planos:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
} 