import { NextRequest, NextResponse } from 'next/server';
import { AuthHybrid } from '@/lib/auth-hybrid';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
    try {
        // Verificar autenticação e permissão
        const user = await AuthHybrid.getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        if (!user.profile || !['admin', 'owner'].includes(user.profile.admin_level)) {
            await AuthHybrid.sendSecurityWebhook(request, user, 'Tentativa de acesso às estatísticas da fila sem permissão');
            return NextResponse.json({ error: 'Acesso negado - Apenas administradores' }, { status: 403 });
        }

        // Usar Supabase para esta consulta complexa com JOINs
        const supabase = await createClient();

        const { data: queueData, error: queueError } = await supabase
            .from('queue')
            .select(`
                *,
                profiles (
                    discord_username,
                    avatar_url
                )
            `);

        if (queueError) {
            throw queueError;
        }

        const stats: any = {
            alfa: { waiting: 0, active: 0, users: [], activeUsers: [] },
            omega: { waiting: 0, active: 0, users: [], activeUsers: [] },
            beta: { waiting: 0, active: 0, users: [], activeUsers: [] }
        };

        // Buscar dados dos user_plans para cada usuário na fila
        for (const entry of queueData) {
            let planName = 'alfa'; // Default
            
            // Buscar o plano ativo do usuário
            const { data: userPlan } = await supabase
                .from('user_plans')
                .select(`
                    plans ( name )
                `)
                .eq('user_id', entry.user_id)
                .eq('is_active', true)
                .single();

            if (userPlan && userPlan.plans && (userPlan.plans as any).name) {
                planName = (userPlan.plans as any).name.toLowerCase();
            }

            const status = entry.status;

            if (stats[planName]) {
                stats[planName][status]++;
                
                const userData = {
                    userId: entry.user_id,
                    // @ts-ignore
                    userName: entry.profiles?.discord_username,
                    // @ts-ignore
                    userImage: entry.profiles?.avatar_url,
                    position: entry.position,
                    joinedAt: entry.joined_at,
                    activatedAt: entry.activated_at,
                    machineInfo: entry.machine_id
                };

                if (status === 'waiting') {
                    stats[planName].users.push(userData);
                } else if (status === 'active') {
                    stats[planName].activeUsers.push(userData);
                }
            }
        }
        
        // Sort waiting users by position
        Object.keys(stats).forEach(planName => {
            stats[planName].users.sort((a: any, b: any) => a.position - b.position);
        });

        return NextResponse.json({
            success: true,
            stats: stats
        });

    } catch (error) {
        console.error('Erro geral na rota de estatísticas:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
} 