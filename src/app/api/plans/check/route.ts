import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import userPlanController from "@/functions/database/controllers/UserPlanController";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const planType = searchParams.get("planType");

    if (!userId || !planType) {
      return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });
    }
    
    const hasActivePlan = await userPlanController.hasActivePlan(userId, planType);
    
    return NextResponse.json({ hasActivePlan });
  } catch (error) {
    console.error("Erro ao verificar plano ativo:", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Erro interno do servidor"
    }, { status: 500 });
  }
}