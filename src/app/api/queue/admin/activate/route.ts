import { NextRequest, NextResponse } from 'next/server';
import { AuthHybrid } from '@/lib/auth-hybrid';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
    try {
        // Verificar autenticação e permissão
        const user = await AuthHybrid.getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        if (!user.profile || !['admin', 'owner'].includes(user.profile.admin_level)) {
            await AuthHybrid.sendSecurityWebhook(request, user, 'Tentativa de ativar usuário na fila sem permissão');
            return NextResponse.json({ error: 'Acesso negado - Apenas administradores' }, { status: 403 });
        }

        // Usar Supabase para operações complexas da fila
        const supabase = await createClient();

        const { planType, ip, user: vmUser, password, name, connectLink } = await request.json();

        if (!planType || !ip || !vmUser || !password || !name) {
             return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
        }

        // 1. Encontrar o próximo usuário na fila para o plano especificado
        const { data: nextUserInQueue, error: findUserError } = await supabase
            .from('queue')
            .select('*, user_plans!inner(plan_id, plans!inner(name))')
            .eq('status', 'waiting')
            // @ts-ignore
            .eq('user_plans.plans.name', planType)
            .order('position', { ascending: true })
            .limit(1)
            .single();

        if (findUserError || !nextUserInQueue) {
            return NextResponse.json({ error: 'Nenhum usuário na fila para este plano' }, { status: 404 });
        }

        // 2. Verificar se o plano do usuário ainda está ativo
        const { data: activePlan, error: planError } = await supabase
            .from('user_plans')
            .select('id, status, expires_at')
            .eq('user_id', nextUserInQueue.user_id)
            .eq('status', 'active')
            .single();

        if (planError || !activePlan || new Date(activePlan.expires_at) < new Date()) {
             await supabase.from('queue').delete().eq('id', nextUserInQueue.id);
             return NextResponse.json({ error: 'O usuário não possui mais um plano ativo. Removido da fila.' }, { status: 400 });
        }

        // 3. Criar a máquina na tabela `queue_machines`
        const { data: newMachine, error: createMachineError } = await supabase
            .from('queue_machines')
            .insert({ name, ip, user: vmUser, password, status: 'occupied', current_user_id: nextUserInQueue.user_id })
            .select()
            .single();

        if (createMachineError) throw createMachineError;

        // 4. Atualizar o status do usuário na fila
        const { error: updateUserError } = await supabase
            .from('queue')
            .update({ status: 'active', activated_at: new Date().toISOString(), machine_id: newMachine.id })
            .eq('id', nextUserInQueue.id);

        if (updateUserError) throw updateUserError;

        return NextResponse.json({ success: true, message: 'Usuário ativado com sucesso' });

    } catch (error) {
        console.error('[API] /queue/admin/activate - Erro geral:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}