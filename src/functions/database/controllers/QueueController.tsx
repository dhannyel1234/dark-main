import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import userPlanController from './UserPlanController';

export class QueueController {
    private static instance: QueueController;

    private constructor() {}

    public static getInstance(): QueueController {
        if (!QueueController.instance) {
            QueueController.instance = new QueueController();
        }
        return QueueController.instance;
    }

    // Entrar na fila
    async joinQueue(userId: string, planId: number) {
        const supabase = await createClient();
        const { data: existingUser, error: existingUserError } = await supabase
            .from('queue')
            .select('id')
            .eq('user_id', userId)
            .in('status', ['waiting', 'active'])
            .single();

        if (existingUser) {
            return { success: false, message: 'Usuário já está na fila' };
        }
        if (existingUserError && existingUserError.code !== 'PGRST116') throw existingUserError;

        const { count, error: countError } = await (await createClient())
            .from('queue')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'waiting');
        if (countError) throw countError;
        const position = (count ?? 0) + 1;

        const { data: queueEntry, error: insertError } = await (await createClient())
            .from('queue')
            .insert({
                user_id: userId,
                position: position,
                status: 'waiting',
                joined_at: new Date().toISOString()
            })
            .select()
            .single();

        if (insertError) {
            console.error('Erro ao entrar na fila:', insertError);
            return { success: false, message: 'Erro ao entrar na fila' };
        }

        await userPlanController.markAsInQueue(planId.toString());

        return { success: true, message: 'Entrou na fila com sucesso', data: queueEntry };
    }

    // Ativar usuário da fila (para admin)
    async activateUser(userId: string, machineId: number) {
        const { data: queueEntry, error: updateError } = await (await createClient())
            .from('queue')
            .update({
                status: 'active',
                activated_at: new Date().toISOString(),
                machine_id: machineId
            })
            .eq('user_id', userId)
            .eq('status', 'waiting')
            .select()
            .single();

        if (updateError || !queueEntry) {
            return { success: false, message: 'Usuário não encontrado na fila ou erro ao ativar.' };
        }

        await (await createClient())
            .from('queue_machines')
            .update({ status: 'in_use', current_user_id: userId })
            .eq('id', machineId);

        await this.updateQueuePositions();

        return { success: true, message: 'Usuário ativado com sucesso', data: queueEntry };
    }

    // Finalizar sessão do usuário
    async completeUserSession(userId: string) {
        const { data: queueEntry, error } = await (await createClient())
            .from('queue')
            .delete()
            .eq('user_id', userId)
            .select('machine_id, user_id')
            .single();

        if (error || !queueEntry) {
            return { success: false, message: 'Usuário não encontrado na fila ativa.' };
        }

        if (queueEntry.machine_id) {
            await (await createClient())
                .from('queue_machines')
                .update({ status: 'available', current_user_id: null })
                .eq('id', queueEntry.machine_id);
        }

        const { data: userPlan } = await (await createClient()).from('user_plans').select('id').eq('user_id', userId).eq('is_in_queue', true).single();
        if (userPlan) {
            await userPlanController.markAsOutOfQueue(userPlan.id);
        }

        await this.updateQueuePositions();

        return { success: true, message: 'Sessão finalizada com sucesso' };
    }

    // Obter estatísticas da fila
    async getQueueStats() {
        const { count: waitingCount, error: waitingError } = await (await createClient())
            .from('queue')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'waiting');

        if (waitingError) {
            console.error('Erro ao contar usuários em espera:', waitingError);
            return { success: false, message: 'Erro ao obter estatísticas' };
        }

        const { data: activeUsers, error: activeError } = await (await createClient())
            .from('queue')
            .select(`
                *,
                user:profiles(discord_username, avatar_url),
                machine:queue_machines(name)
            `)
            .eq('status', 'active');

        if (activeError) {
            console.error('Erro ao buscar usuários ativos:', activeError);
            return { success: false, message: 'Erro ao obter estatísticas' };
        }

        return {
            success: true,
            waiting: waitingCount ?? 0,
            active: activeUsers
        };
    }

    // Atualizar posições na fila
    async updateQueuePositions() {
        const { data: waitingUsers, error } = await (await createClient())
            .from('queue')
            .select('id, joined_at')
            .eq('status', 'waiting')
            .order('joined_at', { ascending: true });

        if (error) {
            console.error('Erro ao buscar usuários para atualizar posições:', error);
            return;
        }

        const supabaseForUpdates = await createClient();
        const updates = waitingUsers.map((user, index) =>
            supabaseForUpdates
                .from('queue')
                .update({ position: index + 1 })
                .eq('id', user.id)
        );

        await Promise.all(updates);
    }

    // Funções de gerenciamento de máquinas da fila
    async addQueueMachine(name: string, ip: string, user: string, password: string) {
        const { data, error } = await (await createClient())
            .from('queue_machines')
            .insert({ name, ip, user, password, status: 'available' });
        if (error) return { success: false, message: error.message };
        return { success: true, data };
    }

    async removeQueueMachine(machineId: number) {
        const { data, error } = await (await createClient())
            .from('queue_machines')
            .delete()
            .eq('id', machineId);
        if (error) return { success: false, message: error.message };
        return { success: true, data };
    }

    async getAllQueueMachines() {
        const { data, error } = await (await createClient())
            .from('queue_machines')
            .select('*');
        if (error) return { success: false, message: error.message };
        return { success: true, data };
    }
}

const queueController = QueueController.getInstance();
export default queueController;