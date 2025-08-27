import { NextResponse } from "next/server";
import userPlanController from "@/functions/database/controllers/UserPlanController";

export async function POST(request: Request) {
  try {
    const { userId, reason } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: "ID do usuário é obrigatório" },
        { status: 400 }
      );
    }

    try {
      await userPlanController.deactivatePlan(userId, reason || "Desativado pelo administrador");
      return NextResponse.json({ success: true });
    } catch (error) {
      // Se o erro vier do controller, retornar a mensagem específica
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Erro ao desativar plano" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Erro ao processar requisição:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
} 