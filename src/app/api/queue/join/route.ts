import { NextRequest, NextResponse } from 'next/server';
import { AuthHybrid } from '@/lib/auth-hybrid';
import queueController from '@/functions/database/controllers/QueueController';

export async function POST(request: NextRequest) {
    try {
        // 1. Verificar autenticação usando hybrid auth
        const user = await AuthHybrid.getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { planType } = await request.json();
        if (!planType) {
            return NextResponse.json({ error: 'Tipo de plano não especificado' }, { status: 400 });
        }

        // 2. Usar o controller para entrar na fila
        const queueEntry = await queueController.joinQueue(user.id, planType);

        if (!queueEntry) {
            return NextResponse.json({ 
                error: 'Sistema de fila não disponível no momento' 
            }, { status: 503 });
        }
        
        return NextResponse.json({ 
            success: true, 
            message: 'Entrou na fila com sucesso!', 
            position: (queueEntry as any)?.position || 0,
            queueId: (queueEntry as any)?.id || 'disabled'
        });

    } catch (error: any) {
        console.error('Erro ao entrar na fila:', error);
        
        if (error.message === 'Usuário não possui plano ativo') {
            return NextResponse.json({ error: 'Você não possui um plano ativo.', needsPlan: true }, { status: 403 });
        }
        
        if (error.message === 'Usuário já está na fila') {
            return NextResponse.json({ error: 'Você já está na fila.' }, { status: 409 });
        }

        return NextResponse.json({ error: 'Erro interno do servidor.', details: error.message }, { status: 500 });
    }
}