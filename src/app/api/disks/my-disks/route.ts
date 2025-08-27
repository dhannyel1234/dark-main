import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/middleware';
import diskController from '@/functions/database/controllers/DiskController';
import { AuthHybrid } from '@/lib/auth-hybrid';

export async function GET(req: NextRequest) {
    try {
        const user = await AuthHybrid.getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
        }
        
        const userDisks = await diskController.getUserDisks(user.id);
        const activeSessions = await diskController.getUserActiveSessions(user.id);

        return NextResponse.json({
            disks: userDisks,
            activeSessions: activeSessions
        }, { status: 200 });

    } catch (error) {
        console.error('Erro ao buscar discos do usuário:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar seus discos', message: error instanceof Error ? error.message : 'Erro desconhecido' },
            { status: 500 }
        );
    }
}