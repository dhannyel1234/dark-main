import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import paymentController from '@/functions/database/controllers/PaymentController';

// Função para verificar a assinatura do webhook OpenPix
function verifyOpenPixSignature(payload: string, signature: string): boolean {
  const webhookSecret = process.env.OPENPIX_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    console.warn('[Webhook OpenPix] OPENPIX_WEBHOOK_SECRET não configurado');
    return false;
  }

  const hmac = crypto.createHmac('sha256', webhookSecret);
  hmac.update(payload);
  const digest = hmac.digest('hex');
  
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

export async function POST(request: NextRequest) {
  console.log('[Webhook OpenPix] Notificação recebida.');
  
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-webhook-signature') || request.headers.get('x-openpix-signature');

    // Verificar assinatura se configurada
    if (process.env.OPENPIX_WEBHOOK_SECRET && signature) {
      if (!verifyOpenPixSignature(rawBody, signature)) {
        console.error('[Webhook OpenPix] Assinatura inválida.');
        return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 });
      }
    }

    const body = JSON.parse(rawBody);
    
    // Log do payload para debug
    console.log('[Webhook OpenPix] Payload recebido:', JSON.stringify(body, null, 2));

    // Estrutura esperada do webhook OpenPix
    if (!body.event || !body.charge) {
      console.warn('[Webhook OpenPix] Formato de payload inválido');
      return NextResponse.json({ error: 'Formato inválido' }, { status: 400 });
    }

    const { event, charge } = body;

    // Processar apenas eventos de pagamento confirmado
    if (event === 'OPENPIX:CHARGE_COMPLETED' || event === 'OPENPIX:TRANSACTION_RECEIVED') {
      const correlationID = charge.correlationID;
      
      if (!correlationID) {
        console.warn('[Webhook OpenPix] correlationID não encontrado');
        return NextResponse.json({ error: 'correlationID obrigatório' }, { status: 400 });
      }

      console.log(`[Webhook OpenPix] Processando pagamento: ${correlationID}`);

      // Buscar o pagamento pelo correlationID (que é nosso payment_id)
      const payment = await paymentController.findByPaymentId(correlationID);
      
      if (!payment) {
        console.warn(`[Webhook OpenPix] Pagamento ${correlationID} não encontrado no banco.`);
        return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 });
      }

      if ((payment as any)?.status === 'paid') {
        console.log(`[Webhook OpenPix] Pagamento ${correlationID} já foi processado.`);
        return NextResponse.json({ message: 'Pagamento já processado' }, { status: 200 });
      }

      // Processar o pagamento
      try {
        const result = await paymentController.processWebhookPayment(correlationID, {
          openpix_event: event,
          openpix_charge: charge,
          webhook_received_at: new Date().toISOString(),
          transaction_value: charge.value,
          payer_info: charge.customer || {}
        });

        console.log(`[Webhook OpenPix] Pagamento ${correlationID} processado com sucesso.`);
        console.log(`[Webhook OpenPix] Plano criado para usuário: ${(result.userPlan as any)?.user_id || 'unknown'}`);

        return NextResponse.json({ 
          message: 'Pagamento processado com sucesso',
          paymentId: (result.payment as any)?.id || 'disabled',
          userPlanId: (result.userPlan as any)?.id || 'disabled'
        });

      } catch (error: any) {
        console.error(`[Webhook OpenPix] Erro ao processar pagamento ${correlationID}:`, error);
        return NextResponse.json({ 
          error: 'Erro ao processar pagamento',
          details: error.message 
        }, { status: 500 });
      }
    }

    // Para outros tipos de evento, apenas log
    console.log(`[Webhook OpenPix] Evento ${event} recebido mas não processado`);
    return NextResponse.json({ message: 'Evento recebido' }, { status: 200 });

  } catch (error: any) {
    console.error('[Webhook OpenPix] Erro ao processar webhook:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 });
  }
}

// Endpoint para teste de conectividade
export async function GET() {
  return NextResponse.json({ 
    message: 'Webhook OpenPix ativo',
    timestamp: new Date().toISOString()
  });
}