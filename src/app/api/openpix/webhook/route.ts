import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import userPlanController from '@/functions/database/controllers/UserPlanController';
import crypto from 'crypto';

// Função para verificar a assinatura do webhook
function verifySignature(payload: string, signature: string, secret: string): boolean {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    const digest = hmac.digest('hex');
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

export async function POST(request: NextRequest) {
    const webhookSecret = process.env.OPENPIX_WEBHOOK_SECRET;
    const signature = request.headers.get('x-webhook-signature');

    if (!webhookSecret || !signature) {
        console.warn('[Webhook OpenPix] Segredo do webhook ou assinatura não configurados.');
        return NextResponse.json({ error: 'Configuração de segurança ausente.' }, { status: 500 });
    }

    try {
        const rawBody = await request.text();

        // 1. Verificar a assinatura
        if (!verifySignature(rawBody, signature, webhookSecret)) {
            console.error('[Webhook OpenPix] Assinatura do webhook inválida.');
            return NextResponse.json({ error: 'Assinatura inválida.' }, { status: 401 });
        }

        const payload = JSON.parse(rawBody);
        console.log('[Webhook OpenPix] Notificação recebida e validada.');

        // 2. Processar o evento de pagamento
        if (payload.event === 'PAYMENT_RECEIVED' && payload.charge) {
            const correlationID = payload.charge.correlationID;
            
            const supabase = await createClient();

            // 3. Encontrar o pagamento no banco de dados
            const { data: existingPayment, error: findError } = await supabase
                .from('payments')
                .select('id, status')
                .eq('custom_id', correlationID)
                .single();

            if (findError || !existingPayment) {
                console.warn(`[Webhook OpenPix] Pagamento com correlationID ${correlationID} não encontrado.`);
                return NextResponse.json({ message: 'Pagamento não encontrado' });
            }

            if (existingPayment.status === 'paid') {
                console.log(`[Webhook OpenPix] Pagamento ${correlationID} já foi processado. Ignorando.`);
                return NextResponse.json({ message: 'Pagamento já processado' });
            }

            // 4. Atualizar o status e criar o plano
            const { data: updatedPayment, error: updateError } = await supabase
                .from('payments')
                .update({ status: 'paid', updated_at: new Date().toISOString(), payment_id: payload.charge.txID })
                .eq('custom_id', correlationID)
                .select()
                .single();

            if (updateError) {
                console.error(`[Webhook OpenPix] Erro ao atualizar o pagamento ${correlationID}:`, updateError);
                throw updateError;
            }

            await userPlanController.createFromPayment(updatedPayment);
            
            console.log(`[Webhook OpenPix] Pagamento ${correlationID} processado e plano criado com sucesso.`);
        }

        return NextResponse.json({ message: 'Notificação recebida com sucesso.' });

    } catch (error) {
        console.error('[Webhook OpenPix] Erro fatal ao processar webhook:', error);
        return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
    }
}