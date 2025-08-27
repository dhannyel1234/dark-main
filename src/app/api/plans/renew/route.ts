import { NextRequest, NextResponse } from 'next/server';
import { AuthHybrid } from '@/lib/auth-hybrid';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
    try {
        // 1. Verificar autenticação
        const user = await AuthHybrid.getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        // 2. Obter dados da requisição
        const { planId, renewalDays } = await request.json();
        
        if (!planId) {
            return NextResponse.json({ 
                error: 'ID do plano é obrigatório' 
            }, { status: 400 });
        }

        const supabase = await createClient();

        // 3. Buscar plano atual do usuário
        const { data: userPlanData } = await supabase
            .from('user_plans')
            .select(`
                id, plan_id, expires_at, status,
                plans:plan_id (
                    name, price, duration_days
                )
            `)
            .eq('user_id', user.id)
            .eq('plan_id', planId)
            .order('created_at', { ascending: true })
            .limit(1)
            .single();

        if (!userPlanData) {
            return NextResponse.json({ 
                error: 'Plano não encontrado para este usuário' 
            }, { status: 404 });
        }

        const currentPlan = {
            id: userPlanData.id,
            plan_id: userPlanData.plan_id,
            expires_at: userPlanData.expires_at,
            status: userPlanData.status,
            plan_name: (userPlanData.plans as any)?.name,
            plan_price: (userPlanData.plans as any)?.price,
            plan_duration: (userPlanData.plans as any)?.duration_days
        };


        // 4. Calcular nova data de expiração
        const now = new Date();
        const currentExpiration = new Date(currentPlan.expires_at || new Date());
        
        // Se o plano ainda está ativo, renovar a partir da data atual de expiração
        // Se expirou, renovar a partir de agora
        const renewalBaseDate = currentExpiration > now ? currentExpiration : now;
        
        // Usar duração padrão do plano ou days customizados
        const daysToAdd = renewalDays || currentPlan.plan_duration || 30;
        
        const newExpirationDate = new Date(renewalBaseDate);
        newExpirationDate.setDate(newExpirationDate.getDate() + daysToAdd);

        // 5. Atualizar plano no banco
        const { data: updatedPlan, error: updateError } = await supabase
            .from('user_plans')
            .update({
                expires_at: newExpirationDate.toISOString(),
                status: 'active',
                updated_at: new Date().toISOString()
            })
            .eq('id', currentPlan.id)
            .select()
            .single();

        if (updateError) {
            console.error('Error updating plan:', updateError);
            return NextResponse.json({ error: 'Erro ao renovar plano' }, { status: 500 });
        }

        // 6. Log de auditoria
        await AuthHybrid.sendSecurityWebhook(request, user, 
            `Renovou plano: ${currentPlan.plan_name} por ${daysToAdd} dias`
        );

        // 7. Calcular informações de cobrança
        const renewalPrice = (parseFloat(currentPlan.plan_price || '0') * daysToAdd) / (currentPlan.plan_duration || 30);

        return NextResponse.json({
            success: true,
            message: 'Plano renovado com sucesso',
            renewal: {
                plan_id: currentPlan.plan_id,
                plan_name: currentPlan.plan_name,
                old_expiration: currentPlan.expires_at,
                new_expiration: newExpirationDate,
                days_added: daysToAdd,
                renewal_price: renewalPrice.toFixed(2),
                status: 'active'
            }
        });

    } catch (error: any) {
        console.error('Erro na renovação do plano:', error);
        return NextResponse.json({ 
            error: 'Erro interno do servidor',
            details: error.message 
        }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        // Endpoint para obter informações de renovação
        const user = await AuthHybrid.getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const supabase = await createClient();

        // Buscar planos do usuário próximos ao vencimento
        const { data: userPlansData } = await supabase
            .from('user_plans')
            .select(`
                id, plan_id, expires_at, status,
                plans:plan_id (
                    name, price, duration_days
                )
            `)
            .eq('user_id', user.id);

        const now = new Date();
        const warningThreshold = new Date();
        warningThreshold.setDate(warningThreshold.getDate() + 7); // 7 dias de antecedência

        const plansNeedingRenewal = (userPlansData || [])
            .filter(plan => {
                const expirationDate = new Date(plan.expires_at || new Date());
                return expirationDate <= warningThreshold && plan.status === 'active';
            })
            .map(plan => {
                const expirationDate = new Date(plan.expires_at || new Date());
                const daysUntilExpiration = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                
                return {
                    ...plan,
                    plan_name: (plan.plans as any)?.name,
                    plan_price: (plan.plans as any)?.price,
                    plan_duration: (plan.plans as any)?.duration_days,
                    days_until_expiration: daysUntilExpiration,
                    is_expired: daysUntilExpiration <= 0,
                    renewal_urgency: daysUntilExpiration <= 1 ? 'critical' : 
                                   daysUntilExpiration <= 3 ? 'high' : 'medium'
                };
            });

        return NextResponse.json({
            success: true,
            plans_needing_renewal: plansNeedingRenewal,
            total_plans: (userPlansData || []).length,
            renewal_options: {
                available_durations: [7, 15, 30, 60, 90], // dias
                renewal_discount: 0.10 // 10% desconto para renovações
            }
        });

    } catch (error: any) {
        console.error('Erro ao obter informações de renovação:', error);
        return NextResponse.json({ 
            error: 'Erro interno do servidor',
            details: error.message 
        }, { status: 500 });
    }
}