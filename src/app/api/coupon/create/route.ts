import { NextRequest, NextResponse } from 'next/server';
import { AuthHybrid } from '@/lib/auth-hybrid';
import couponController from '@/functions/database/controllers/CouponController';

export async function POST(req: NextRequest) {
    try {
        // 1. Verificar autenticação e permissão
        const user = await AuthHybrid.getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        if (!user.profile || !['admin', 'owner'].includes(user.profile.admin_level)) {
            await AuthHybrid.sendSecurityWebhook(req, user, 'Tentativa de criar cupom sem permissão');
            return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
        }

        // 2. Processar a requisição
        const { code, discount, active, expiresAt, usageLimit } = await req.json();

        if (!code || discount === undefined) {
            return NextResponse.json({ error: 'Código e desconto são obrigatórios.' }, { status: 400 });
        }

        // Verificar se o cupom já existe
        const existingCoupon = await couponController.find({ code: code.toUpperCase() });
        if (existingCoupon) {
            return NextResponse.json({ error: 'Este código de cupom já existe.' }, { status: 409 });
        }

        const couponData = {
            code: code.toUpperCase(),
            discount,
            active,
            expires_at: expiresAt,
            usage_limit: usageLimit,
        };

        const newCoupon = await couponController.create(couponData);

        return NextResponse.json({ message: 'Cupom criado com sucesso', coupon: newCoupon }, { status: 201 });

    } catch (err) {
        console.error("Erro ao criar cupom:", err);
        return NextResponse.json({ error: "Erro interno ao criar cupom." }, { status: 500 });
    }
}