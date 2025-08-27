import { NextResponse } from 'next/server';
import { AuthHybrid } from '@/lib/auth-hybrid';
import couponController from '@/functions/database/controllers/CouponController';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        // 1. Verificar autenticação e permissão
        const user = await AuthHybrid.getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        if (!user.profile || !['admin', 'owner'].includes(user.profile.admin_level)) {
            await AuthHybrid.sendSecurityWebhook(request, user, 'Tentativa de acesso não autorizado aos cupons');
            return NextResponse.json({ 
                error: 'Acesso negado. Apenas admins e owners podem listar cupons.' 
            }, { status: 403 });
        }

        // 2. Processar a requisição
        const coupons = await couponController.findAll();
        return NextResponse.json({ coupons });

    } catch (err) {
        console.error("Erro ao buscar cupons:", err);
        return NextResponse.json({ 
            error: "Erro interno ao buscar cupons.",
            details: err instanceof Error ? err.message : String(err)
        }, { status: 500 });
    }
}