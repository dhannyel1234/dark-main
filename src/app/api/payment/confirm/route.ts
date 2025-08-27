import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { criarCobrancaPix as criarCobrancaEfi } from '@/services/EfiPaymentService';
// Supondo que exista um serviço para OpenPix também
// import { criarCobrancaPix as criarCobrancaOpenPix } from '@/services/OpenPixPaymentService';

export async function POST(request: NextRequest) {
    const supabase = await createClient();

    try {
        // 1. Verificar se o usuário está autenticado
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        // 2. Obter dados do corpo da requisição
        const body = await request.json();
        const {
            paymentId,
            customerName,
            customerDocument,
            customerBirthDate,
            customerPhone,
            customerAddress,
            termsAccepted,
            selectedGateway
        } = body;

        if (!paymentId || !customerName || !customerDocument || !termsAccepted || !selectedGateway) {
            return NextResponse.json({ error: 'Dados do cliente e ID do pagamento são obrigatórios.' }, { status: 400 });
        }

        if (!termsAccepted) {
            return NextResponse.json({ error: 'É necessário aceitar os termos de serviço.' }, { status: 400 });
        }

        // 3. Buscar o pagamento pendente e verificar se não expirou
        const { data: payment, error: paymentError } = await supabase
            .from('payments')
            .select('*, plans(name)')
            .eq('id', paymentId)
            .eq('user_id', user.id)
            .single();

        if (paymentError || !payment) {
            return NextResponse.json({ error: 'Pagamento não encontrado ou não autorizado.' }, { status: 404 });
        }

        if (new Date(payment.expires_at) < new Date()) {
            await supabase.from('payments').update({ status: 'expired' }).eq('id', paymentId);
            return NextResponse.json({ error: 'Este checkout expirou. Por favor, inicie um novo.' }, { status: 410 });
        }

        // 4. Buscar gateways ativos
        const { data: activeGateways, error: gatewaysError } = await supabase
            .from('payment_gateways')
            .select('provider')
            .eq('is_active', true);

        if (gatewaysError || !activeGateways || activeGateways.length === 0) {
            return NextResponse.json({ error: 'Nenhum método de pagamento está disponível no momento.' }, { status: 503 });
        }

        // 5. Lógica de seleção de gateway (usa o que o cliente escolheu)
        const selectedProvider = selectedGateway;
        let cobranca;

        // Valida se o gateway escolhido está realmente ativo
        if (!activeGateways.some(g => g.provider === selectedProvider)) {
            return NextResponse.json({ error: 'O gateway de pagamento selecionado não está ativo.' }, { status: 400 });
        }

        const descricao = `Assinatura DarkCloud - Plano ${payment.plans.name}`;

        // 6. Chamar o serviço do gateway selecionado
        if (selectedProvider === 'efi') {
            // Limpa o documento para conter apenas números
            const cleanDocument = customerDocument.replace(/\D/g, '');

            cobranca = await criarCobrancaEfi({
                valor: payment.price,
                descricao,
                cpf: cleanDocument.length === 11 ? cleanDocument : undefined,
                cnpj: cleanDocument.length === 14 ? cleanDocument : undefined,
                nome: customerName,
            });
        } else if (selectedProvider === 'openpix') {
            // cobranca = await criarCobrancaOpenPix({ ... });
            // Descomente e implemente quando o serviço OpenPix estiver pronto
            return NextResponse.json({ error: 'Gateway OpenPix não implementado.' }, { status: 501 });
        } else {
            return NextResponse.json({ error: 'Gateway de pagamento não suportado.' }, { status: 501 });
        }

        // 7. Atualizar o registro de pagamento com os dados finais
        const { data: updatedPayment, error: updateError } = await supabase
            .from('payments')
            .update({
                customer_name: customerName,
                customer_document: customerDocument,
                customer_birth_date: customerBirthDate,
                customer_phone: customerPhone,
                customer_address: customerAddress,
                terms_accepted: termsAccepted,
                gateway_provider: selectedProvider,
                payment_id: cobranca.txid,
                br_code: cobranca.brCode,
                qr_code_image: cobranca.qrCodeImage,
                status: 'pending_payment' // Aguardando o usuário pagar o PIX
            })
            .eq('id', paymentId)
            .select()
            .single();
        
        if (updateError) {
            throw updateError;
        }

        return NextResponse.json({ success: true, cobranca });

    } catch (error) {
        console.error('❌ Erro ao confirmar pagamento:', error);
        return NextResponse.json(
            {
                error: 'Erro ao confirmar pagamento',
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}