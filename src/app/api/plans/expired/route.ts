import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import userPlanController from "@/functions/database/controllers/UserPlanController";

export async function GET() {
  console.log('[API] /plans/expired - Iniciando requisição...', new Date().toISOString());
  
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.log('[API] /plans/expired - Usuário não autenticado');
      return NextResponse.json(
        { error: "Não autorizado - Usuário não autenticado" },
        {
          status: 401,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('admin_level')
        .eq('id', user.id)
        .single();

    if (!profile || (profile.admin_level !== 'admin' && profile.admin_level !== 'owner')) {
      console.log('[API] /plans/expired - Usuário não é admin');
      return NextResponse.json(
        { error: "Não autorizado - Permissão insuficiente" },
        {
          status: 403,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    }

    console.log('[API] /plans/expired - Buscando planos expirados...');
    const expiredPlans = await userPlanController.getExpiredPlans();

    console.log('[API] /plans/expired - Planos encontrados:', {
      quantidade: expiredPlans.length,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(expiredPlans, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error("[API] /plans/expired - Erro:", error);
    return NextResponse.json(
      { error: "Erro ao buscar planos expirados" },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  }
} 