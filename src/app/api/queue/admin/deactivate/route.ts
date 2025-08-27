import { NextRequest, NextResponse } from 'next/server';
import { AuthHybrid } from '@/lib/auth-hybrid';
import queueController from '@/functions/database/controllers/QueueController';

export async function POST(request: NextRequest) {
    try {
        // Verificar autenticação e permissão
        const user = await AuthHybrid.getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        if (!user.profile || !['admin', 'owner'].includes(user.profile.admin_level)) {
            await AuthHybrid.sendSecurityWebhook(request, user, 'Tentativa de desativar usuário na fila sem permissão');
            return NextResponse.json({ error: 'Acesso negado - Apenas administradores' }, { status: 403 });
        }

        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: 'ID do usuário não fornecido' }, { status: 400 });
        }

        const result = await queueController.completeUserSession(userId);
        if (!result.success) {
            return NextResponse.json({ error: result.message }, { status: 400 });
        }

        return NextResponse.json({ 
            success: true, 
            message: 'Sessão finalizada com sucesso'
        });

    } catch (error) {
        console.error('Erro ao finalizar sessão:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
} 