import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import userPlanController from "@/functions/database/controllers/UserPlanController";

// Forçar renderização dinâmica
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Não autorizado - Usuário não autenticado" },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('admin_level')
      .eq('id', user.id)
      .single();

    if (profile?.admin_level !== 'admin' && profile?.admin_level !== 'owner') {
      return NextResponse.json(
        { error: "Não autorizado - Permissão insuficiente" },
        { status: 403 }
      );
    }

    const cancelledPlans = await userPlanController.getCancelledPlans();

    return NextResponse.json(cancelledPlans);
  } catch (error) {
    console.error("Erro ao buscar planos cancelados:", error);
    return NextResponse.json(
      { error: "Erro ao buscar planos cancelados" },
      { status: 500 }
    );
  }
} 