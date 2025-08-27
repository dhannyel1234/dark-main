import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import EfiPay from 'sdk-node-apis-efi';
import path from 'path';
import userPlanController from '@/functions/database/controllers/UserPlanController';

// Configuração Efi
const certPath = path.join(process.cwd(), process.env.EFI_CERT_PATH!);
const efiOptions = {
  client_id: process.env.EFI_CLIENT_ID!,
  client_secret: process.env.EFI_CLIENT_SECRET!,
  certificate: certPath,
  sandbox: false,
  validateMtls: false,
};
const efipay = new EfiPay(efiOptions);

// Função para verificar o status na Efi
async function checkEfiStatus(txid: string) {
    const charge = await efipay.pixDetailCharge({ txid });
    return charge.status; // ex: 'CONCLUIDA'
}

// Função para verificar o status na OpenPix
async function checkOpenPixStatus(correlationID: string) {
    const appID = process.env.OPENPIX_APP_ID;
    const response = await fetch(`https://api.openpix.com.br/api/v1/charge/${correlationID}`, {
        headers: { 'Authorization': appID! },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Erro ao buscar status na OpenPix');
    return data.charge.status; // ex: 'COMPLETED'
}


export async function GET(request: NextRequest) {
    const supabase = await createClient();
    const paymentId = request.nextUrl.searchParams.get('paymentId');

    if (!paymentId) {
        return NextResponse.json({ error: 'paymentId é obrigatório' }, { status: 400 });
    }

    try {
        // 1. Buscar o pagamento no nosso banco
        const { data: payment, error: findError } = await supabase
            .from('payments')
            .select('*')
            .eq('id', paymentId)
            .single();

        if (findError || !payment) {
            return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 });
        }

        // Se já está pago, apenas retorna
        if (payment.status === 'paid') {
            return NextResponse.json({ status: 'paid' });
        }

        // 2. Chamar o gateway correto para verificar o status
        let gatewayStatus;
        if (payment.gateway_provider === 'efi') {
            gatewayStatus = await checkEfiStatus(payment.payment_id); // payment_id é o txid
        } else if (payment.gateway_provider === 'openpix') {
            gatewayStatus = await checkOpenPixStatus(payment.custom_id); // custom_id é o correlationID
        } else {
            throw new Error('Gateway de pagamento não suportado para polling.');
        }

        // 3. Se o pagamento foi concluído, processar
        if (gatewayStatus === 'CONCLUIDA' || gatewayStatus === 'COMPLETED') {
            // Atualizar o status do pagamento para 'paid'
            const { data: updatedPayment, error: updateError } = await supabase
                .from('payments')
                .update({ status: 'paid', updated_at: new Date().toISOString() })
                .eq('id', payment.id)
                .select()
                .single();

            if (updateError) throw updateError;

            // Criar o plano para o usuário
            await userPlanController.createFromPayment(updatedPayment);

            return NextResponse.json({ status: 'paid' });
        }

        // 4. Se não, retornar o status pendente
        return NextResponse.json({ status: 'pending' });

    } catch (error) {
        console.error(`[Polling] Erro ao verificar status do pagamento ${paymentId}:`, error);
        return NextResponse.json(
            { error: 'Erro interno ao verificar status do pagamento.' },
            { status: 500 }
        );
    }
}