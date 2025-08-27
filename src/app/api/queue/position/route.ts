import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        // 1. Buscar o registro do usuário na fila
        const { data: queueEntry, error: queueError } = await supabase
            .from('queue')
            .select(`
                *,
                machine:queue_machines(*)
            `)
            .eq('user_id', user.id)
            .single();

        if (queueError || !queueEntry) {
            // Se não estiver na fila, busca o plano ativo para verificar se ele deveria estar
            const { data: activePlan, error: planError } = await supabase
                .from('user_plans')
                .select('*')
                .eq('user_id', user.id)
                .eq('status', 'active')
                .single();

            if (planError || !activePlan) {
                return NextResponse.json({ success: true, inQueue: false, message: 'Nenhum plano ativo ou entrada na fila.' });
            }
            
            // Se ele tem um plano ativo mas não está na fila, pode ser um erro ou estado transitório
            // Por agora, vamos apenas informar que ele não está na fila.
            return NextResponse.json({ success: true, inQueue: false, message: 'Plano ativo encontrado, mas não está na fila.' });
        }

        // 2. Calcular a posição na fila se estiver esperando
        let position = 0;
        if (queueEntry.status === 'waiting') {
            const { count, error: positionError } = await supabase
                .from('queue')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'waiting')
                .lt('joined_at', queueEntry.joined_at);
            
            if (positionError) {
                throw new Error('Erro ao calcular a posição na fila.');
            }
            position = (count ?? 0) + 1;
        }

        // 3. Buscar o plano de usuário associado com informações do plano
        const { data: userPlan, error: planError } = await supabase
            .from('user_plans')
            .select(`
                *,
                plans:plan_id (
                    id,
                    name,
                    duration_days,
                    provisioning_type
                )
            `)
            .eq('user_id', user.id)
            .eq('status', 'active')
            .single();

        if (planError) {
            console.error('Erro ao buscar plano do usuário:', planError);
            // Mesmo com erro no plano, retorna os dados da fila que já temos
        }

        return NextResponse.json({
            success: true,
            inQueue: true,
            position: position,
            status: queueEntry.status,
            plan: userPlan ? {
                type: userPlan.plans?.name?.toLowerCase() || 'unknown',
                name: userPlan.plans?.name || 'Plano desconhecido',
                endTime: userPlan.expires_at,
                duration: userPlan.expires_at ? new Date(userPlan.expires_at).getTime() - new Date(userPlan.activated_at).getTime() : null,
                alfaTimeLeftMs: userPlan.alfa_time_left_ms || 0
            } : null,
            machineInfo: queueEntry.status === 'active' && queueEntry.machine ? {
                ip: queueEntry.machine.ip,
                user: queueEntry.machine.user,
                password: queueEntry.machine.password
            } : null
        });

    } catch (error) {
        console.error('Erro ao obter posição na fila:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}