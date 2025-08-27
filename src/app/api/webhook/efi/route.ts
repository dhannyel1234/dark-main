import { NextRequest, NextResponse } from 'next/server';
import EfiPay from 'sdk-node-apis-efi';
import path from 'path';
import { createClient } from '@/utils/supabase/server';
import paymentController from '@/functions/database/controllers/PaymentController';
import crypto from 'crypto';

// Função para verificar a assinatura do webhook (semelhante à da OpenPix)
function verifyEfiSignature(payload: string, signature: string, secret: string): boolean {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    const digest = hmac.digest('hex');
    // A Efi pode enviar a assinatura de maneiras diferentes, ajuste se necessário
    // Verifique a documentação da Efi para o formato exato.
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

const certPath = path.join(process.cwd(), process.env.EFI_CERT_PATH!);
const efiOptions = {
  client_id: process.env.EFI_CLIENT_ID!,
  client_secret: process.env.EFI_CLIENT_SECRET!,
  certificate: certPath,
  sandbox: false,
  validateMtls: false,
};

const efipay = new EfiPay(efiOptions);

export async function POST(request: NextRequest) {
    console.log('[Webhook Efi] Notificação recebida.');
    const webhookSecret = process.env.EFI_WEBHOOK_SECRET;
    const signature = request.headers.get('x-webhook-signature'); // Verifique o nome do header na documentação da Efi

    if (!webhookSecret || !signature) {
        console.warn('[Webhook Efi] Segredo do webhook ou assinatura não configurados.');
        return NextResponse.json({ error: 'Configuração de segurança ausente.' }, { status: 500 });
    }

    try {
        const rawBody = await request.text();

        // 1. Verificar a assinatura
        // if (!verifyEfiSignature(rawBody, signature, webhookSecret)) {
        //     console.error('[Webhook Efi] Assinatura do webhook inválida.');
        //     return NextResponse.json({ error: 'Assinatura inválida.' }, { status: 401 });
        // }
        // A validação está comentada pq precisa do header e secret corretos.
        // Descomente e ajuste quando tiver as informações da Efi.

        const body = JSON.parse(rawBody);

        // A Efi envia um array de notificações
        if (!body.pix || !Array.isArray(body.pix)) {
            console.log('[Webhook Efi] Formato de notificação inválido.');
            return NextResponse.json({ message: 'Formato inválido' }, { status: 400 });
        }

        for (const notification of body.pix) {
            const txid = notification.txid;
            console.log(`[Webhook Efi] Processando notificação para txid: ${txid}`);

            // Consultar o status da cobrança na Efi
            const charge = await efipay.pixDetailCharge({ txid });

            if (charge.status === 'CONCLUIDA') {
                // Verificar se o pagamento existe
                const payment = await paymentController.findByPaymentId(txid);
                
                if (!payment) {
                    console.warn(`[Webhook Efi] Pagamento com txid ${txid} não encontrado no banco.`);
                    continue;
                }

                if ((payment as any)?.status === 'paid') {
                    console.log(`[Webhook Efi] Pagamento com txid ${txid} já foi processado. Ignorando.`);
                    continue;
                }

                // Processar o pagamento com transação
                try {
                    const result = await paymentController.processWebhookPayment(txid, {
                        efi_charge: charge,
                        webhook_received_at: new Date().toISOString()
                    });
                    
                    console.log(`[Webhook Efi] Pagamento ${txid} processado e plano criado com sucesso.`);
                } catch (planError) {
                    console.error(`[Webhook Efi] Falha ao processar pagamento ${txid}:`, planError);
                }
            }
        }

        // Responder à Efi que a notificação foi recebida
        return NextResponse.json({ message: 'Notificação recebida' });

    } catch (error) {
        console.error('[Webhook Efi] Erro ao processar webhook:', error);
        return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
    }
}