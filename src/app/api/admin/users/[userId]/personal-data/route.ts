import { NextRequest, NextResponse } from 'next/server';
import { AuthHybrid } from '@/lib/auth-hybrid';
import { createClient } from '@/utils/supabase/server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        // 1. Verificar autenticação e permissões
        const user = await AuthHybrid.getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        if (!user.profile || user.profile.admin_level !== 'owner') {
            return NextResponse.json({ 
                error: 'Acesso negado. Apenas owners podem ver dados pessoais.' 
            }, { status: 403 });
        }

        const { userId } = await params;
        if (!userId) {
            return NextResponse.json({ 
                error: 'ID do usuário é obrigatório' 
            }, { status: 400 });
        }

        const supabase = await createClient();

        // 2. Buscar dados pessoais do usuário
        const { data: userProfile } = await supabase
            .from('profiles')
            .select('id, discord_username, avatar_url, admin_level, updated_at')
            .eq('id', userId)
            .single();

        if (!userProfile) {
            return NextResponse.json({ 
                error: 'Usuário não encontrado' 
            }, { status: 404 });
        }

        // 3. Buscar dados dos pagamentos (dados pessoais do checkout)
        const { data: paymentData } = await supabase
            .from('payments')
            .select(`
                id, created_at, updated_at, price, status, gateway_provider, 
                payment_id, customer_name, customer_document, customer_phone, customer_address
            `)
            .eq('user_id', userId);

        // 4. Compilar dados pessoais únicos dos pagamentos (extrair dos campos diretos)
        const personalDataFromPayments = (paymentData || []).reduce((acc, payment) => {
            // Coletar dados únicos dos campos de pagamento
            if (payment.customer_name && !acc.names.includes(payment.customer_name)) {
                acc.names.push(payment.customer_name);
            }
            if (payment.customer_document && !acc.documents.includes(payment.customer_document)) {
                acc.documents.push(payment.customer_document);
            }
            if (payment.customer_phone && !acc.phones.includes(payment.customer_phone)) {
                acc.phones.push(payment.customer_phone);
            }
            
            // Endereços completos
            if (payment.customer_address) {
                const address = {
                    address_data: payment.customer_address,
                    used_in_payment: payment.id
                };
                acc.addresses.push(address);
            }

            return acc;
        }, {
            names: [] as string[],
            documents: [] as string[],
            phones: [] as string[],
            addresses: [] as any[]
        });

        // 5. Estatísticas de pagamentos
        const paymentStats = {
            total_payments: (paymentData || []).length,
            total_spent: (paymentData || []).reduce((sum, p) => sum + (parseFloat(p.price || '0') || 0), 0),
            successful_payments: (paymentData || []).filter(p => p.status === 'paid').length,
            failed_payments: (paymentData || []).filter(p => p.status === 'cancelled').length,
            pending_payments: (paymentData || []).filter(p => p.status === 'pending').length,
            gateways_used: [...new Set((paymentData || []).map(p => p.gateway_provider).filter(Boolean))],
            first_payment: (paymentData || []).length > 0 ? 
                (paymentData || []).sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime())[0].created_at : null,
            last_payment: (paymentData || []).length > 0 ? 
                (paymentData || []).sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())[0].created_at : null
        };

        // 6. Log de auditoria
        await AuthHybrid.sendSecurityWebhook(request, user, 
            `Visualizou dados pessoais do usuário: ${userProfile.discord_username || userProfile.id}`
        );

        return NextResponse.json({
            success: true,
            user_profile: userProfile,
            personal_data: personalDataFromPayments,
            payment_stats: paymentStats,
            recent_payments: (paymentData || []).slice(0, 10), // 10 mais recentes
            privacy_notice: 'Dados pessoais visualizados apenas para fins administrativos. Uso restrito conforme LGPD.'
        });

    } catch (error: any) {
        console.error('Erro ao buscar dados pessoais:', error);
        return NextResponse.json({ 
            error: 'Erro interno do servidor',
            details: error.message 
        }, { status: 500 });
    }
}