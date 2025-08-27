import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/middleware';
import diskController from '@/functions/database/controllers/DiskController';
import userPlanController from '@/functions/database/controllers/UserPlanController';
import plansController from '@/functions/database/controllers/PlansController';
import { AuthHybrid } from '@/lib/auth-hybrid';

export async function POST(req: NextRequest) {
    try {
        const user = await AuthHybrid.getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
        }
        const body = await req.json();
        const { user_disk_id, plan_id } = body;

        if (!user_disk_id || !plan_id) {
            return NextResponse.json({ error: 'user_disk_id e plan_id são obrigatórios' }, { status: 400 });
        }

        // Verificar se o disco pertence ao usuário
        const userDisk = await diskController.getUserDiskById(user_disk_id);
        if (!userDisk || userDisk.user_id !== user.id) {
            return NextResponse.json({ error: 'Disco não encontrado ou não pertence ao usuário' }, { status: 404 });
        }

        // Verificar se o disco está disponível
        if (userDisk.status !== 'available') {
            return NextResponse.json({ error: 'Disco não está disponível para uso' }, { status: 400 });
        }

        // Verificar se o usuário tem um plano ativo
        const activePlans = await userPlanController.getUserActivePlans(user.id);
        const planActive = activePlans.find(p => p.plan_id === plan_id);
        
        if (!planActive) {
            return NextResponse.json({ error: 'Você não possui este plano ativo' }, { status: 403 });
        }

        // Buscar dados do plano diretamente
        const { supabase } = createClient(req);
        const { data: planData, error: planError } = await supabase
            .from('plans')
            .select('*')
            .eq('id', plan_id)
            .single();
            
        if (planError || !planData) {
            return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 });
        }

        // Verificar se já tem sessões ativas demais
        const activeSessions = await diskController.getUserActiveSessions(user.id);
        if (activeSessions.length >= (planData.max_concurrent_sessions || 1)) {
            return NextResponse.json({ 
                error: `Você já atingiu o limite de ${planData.max_concurrent_sessions || 1} sessão(ões) simultânea(s)` 
            }, { status: 400 });
        }

        // Encontrar uma VM disponível
        const availableVMs = await diskController.getAvailableDiskVMs();
        if (availableVMs.length === 0) {
            return NextResponse.json({ error: 'Nenhuma VM disponível no momento' }, { status: 503 });
        }

        const selectedVM = availableVMs[0]; // Pega a primeira VM com menos usuários

        // Criar sessão
        const session = await diskController.createDiskSession({
            user_id: user.id,
            user_disk_id: user_disk_id,
            vm_id: selectedVM.id,
            plan_id: plan_id,
            session_duration_minutes: planData.session_duration_minutes || 60
        });

        // Buscar dados completos da sessão
        const fullSession = await diskController.getDiskSessionById(session.id);

        return NextResponse.json({
            session: fullSession,
            vm: selectedVM,
            message: 'Sessão iniciada com sucesso!'
        }, { status: 201 });

    } catch (error) {
        console.error('Erro ao iniciar sessão:', error);
        return NextResponse.json(
            { error: 'Erro ao iniciar sessão', message: error instanceof Error ? error.message : 'Erro desconhecido' },
            { status: 500 }
        );
    }
}

export async function PUT(req: NextRequest) {
    try {
        const user = await AuthHybrid.getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
        }
        const body = await req.json();
        const { session_id, action } = body;

        if (!session_id || !action) {
            return NextResponse.json({ error: 'session_id e action são obrigatórios' }, { status: 400 });
        }

        // Verificar se a sessão pertence ao usuário
        const session = await diskController.getDiskSessionById(session_id);
        if (!session || session.user_id !== user.id) {
            return NextResponse.json({ error: 'Sessão não encontrada ou não pertence ao usuário' }, { status: 404 });
        }

        let result;

        switch (action) {
            case 'end':
                result = await diskController.endDiskSession(session_id, 'Finalizado pelo usuário');
                break;
            case 'activity':
                await diskController.updateSessionActivity(session_id);
                result = { success: true, message: 'Atividade atualizada' };
                break;
            default:
                return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
        }

        return NextResponse.json(result, { status: 200 });

    } catch (error) {
        console.error('Erro ao atualizar sessão:', error);
        return NextResponse.json(
            { error: 'Erro ao atualizar sessão', message: error instanceof Error ? error.message : 'Erro desconhecido' },
            { status: 500 }
        );
    }
}

export async function GET(req: NextRequest) {
    try {
        const user = await AuthHybrid.getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
        }
        
        const { searchParams } = new URL(req.url);
        const sessionId = searchParams.get('id');

        if (sessionId) {
            const session = await diskController.getDiskSessionById(sessionId);
            if (!session || session.user_id !== user.id) {
                return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 });
            }
            return NextResponse.json(session, { status: 200 });
        } else {
            const activeSessions = await diskController.getUserActiveSessions(user.id);
            return NextResponse.json(activeSessions, { status: 200 });
        }

    } catch (error) {
        console.error('Erro ao buscar sessões:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar sessões', message: error instanceof Error ? error.message : 'Erro desconhecido' },
            { status: 500 }
        );
    }
}