import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user: adminUser } } = await supabase.auth.getUser();

    if (!adminUser) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('admin_level')
        .eq('id', adminUser.id)
        .single();

    if (profile?.admin_level !== 'owner') {
        return NextResponse.json({ error: 'Acesso negado. Apenas o proprietário pode reativar planos.' }, { status: 403 });
    }

    const { userId, planType, hours, days } = await request.json();
    
    if (!userId || !planType) {
      return NextResponse.json({ error: "ID do usuário e tipo do plano são obrigatórios" }, { status: 400 });
    }

    // 1. Encontrar o ID do plano mestre
    const { data: planMaster, error: planMasterError } = await supabase
        .from('plans')
        .select('id')
        .eq('name', planType)
        .single();

    if (planMasterError || !planMaster) {
        return NextResponse.json({ error: `Plano mestre do tipo '${planType}' não encontrado.`}, { status: 404 });
    }

    // 2. Encontrar o plano do usuário que está expirado ou cancelado
    const { data: userPlan, error: userPlanError } = await supabase
        .from('user_plans')
        .select('*')
        .eq('user_id', userId)
        .eq('plan_id', planMaster.id)
        .in('status', ['expired', 'cancelled'])
        .limit(1)
        .single();

    if (userPlanError || !userPlan) {
        return NextResponse.json({ error: "Nenhum plano expirado ou cancelado encontrado para este usuário e tipo de plano." }, { status: 404 });
    }

    // 3. Calcular nova data de expiração
    const now = new Date();
    let newExpiresAt: Date | null = null;
    let newAlfaTimeLeftMs: number | null = userPlan.alfa_time_left_ms;

    if (planType.toLowerCase() === 'alfa') {
        if (!hours || hours <= 0) {
            return NextResponse.json({ error: "Quantidade de horas é obrigatória para plano Alfa" }, { status: 400 });
        }
        // Adiciona horas ao tempo restante
        newAlfaTimeLeftMs = (newAlfaTimeLeftMs || 0) + (hours * 60 * 60 * 1000);
    } else {
        if (!days || days <= 0) {
            return NextResponse.json({ error: "Quantidade de dias é obrigatória para outros planos" }, { status: 400 });
        }
        // Define nova data de expiração a partir de agora
        newExpiresAt = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
    }

    // 4. Atualizar o plano do usuário
    const { data: updatedPlan, error: updateError } = await supabase
        .from('user_plans')
        .update({
            status: 'active',
            expires_at: newExpiresAt?.toISOString(),
            alfa_time_left_ms: newAlfaTimeLeftMs,
            updated_at: new Date().toISOString()
        })
        .eq('id', userPlan.id)
        .select()
        .single();

    if (updateError) {
        throw updateError;
    }

    return NextResponse.json({ success: true, plan: updatedPlan });
  } catch (error) {
    console.error("Erro ao reativar plano:", error);
    return NextResponse.json({ error: "Erro ao reativar plano" }, { status: 500 });
  }
}