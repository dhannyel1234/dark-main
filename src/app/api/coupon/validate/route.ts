import { NextRequest, NextResponse } from 'next/server';
import { AuthHybrid } from '@/lib/auth-hybrid';
import couponController from '@/functions/database/controllers/CouponController';

export async function POST(req: NextRequest) {
    try {
        // 1. Verificar autenticação
        const user = await AuthHybrid.getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        // 2. Processar a requisição
        const { code } = await req.json();
        if (!code) {
            return NextResponse.json({ error: 'Código do cupom não fornecido.' }, { status: 400 });
        }

        const coupon = await couponController.find({ code: code.toUpperCase() });

        if (!coupon) {
            return NextResponse.json({ valid: false, message: 'Cupom inválido ou inexistente.' }, { status: 404 });
        }

        if (!coupon.active) {
            return NextResponse.json({ valid: false, message: 'Este cupom não está mais ativo.' }, { status: 400 });
        }

        if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
            return NextResponse.json({ valid: false, message: 'Este cupom expirou.' }, { status: 400 });
        }

        if (coupon.usage_limit !== null && coupon.usage_count >= coupon.usage_limit) {
            return NextResponse.json({ valid: false, message: 'Este cupom atingiu o limite de uso.' }, { status: 400 });
        }

        return NextResponse.json({
            valid: true,
            discount: coupon.discount,
            message: 'Cupom aplicado com sucesso!'
        });

    } catch (err) {
        console.error("Erro ao validar cupom:", err);
        return NextResponse.json({ error: "Erro interno ao validar cupom." }, { status: 500 });
    }
}