import { NextRequest, NextResponse } from 'next/server';
import plansController from '@/functions/database/controllers/PlansController';

// Forçar renderização dinâmica
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const activePlans = await plansController.findActiveWithStock();
        return NextResponse.json(activePlans, { status: 200 });
    } catch (err) {
        const e = err as Error;
        console.error("Erro ao buscar planos ativos:", e);
        return NextResponse.json({ error: "Erro ao buscar planos", message: e.message }, { status: 500 });
    }
}