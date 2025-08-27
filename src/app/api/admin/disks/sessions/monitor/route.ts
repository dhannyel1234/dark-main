import { NextRequest, NextResponse } from 'next/server';
import { AuthHybrid } from '@/lib/auth-hybrid';
import diskSessionMonitorService from '@/services/DiskSessionMonitorService';

export async function GET(req: NextRequest) {
    try {
        const user = await AuthHybrid.getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
        }
        const isOwner = await AuthHybrid.isOwner(user.id);

        if (!isOwner) {
            console.warn(`Tentativa de acesso não autorizada - Session Monitor: ${user.id}`);
            return NextResponse.json({ error: 'Acesso não autorizado. Apenas owners podem acessar o monitor.' }, { status: 403 });
        }

        const status = diskSessionMonitorService.getStatus();
        return NextResponse.json(status, { status: 200 });

    } catch (error) {
        console.error('Erro ao verificar status do monitor:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor', message: error instanceof Error ? error.message : 'Erro desconhecido' },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await AuthHybrid.getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
        }
        const isOwner = await AuthHybrid.isOwner(user.id);

        if (!isOwner) {
            console.warn(`Tentativa de controle não autorizada - Session Monitor: ${user.id}`);
            return NextResponse.json({ error: 'Acesso não autorizado. Apenas owners podem controlar o monitor.' }, { status: 403 });
        }

        const body = await req.json();
        const { action } = body;

        switch (action) {
            case 'start':
                diskSessionMonitorService.start();
                return NextResponse.json({ message: 'Monitor iniciado', status: diskSessionMonitorService.getStatus() }, { status: 200 });

            case 'stop':
                diskSessionMonitorService.stop();
                return NextResponse.json({ message: 'Monitor parado', status: diskSessionMonitorService.getStatus() }, { status: 200 });

            case 'force-check':
                await diskSessionMonitorService.forceCheck();
                return NextResponse.json({ message: 'Verificação manual executada', status: diskSessionMonitorService.getStatus() }, { status: 200 });

            default:
                return NextResponse.json({ error: 'Ação inválida. Use: start, stop, ou force-check' }, { status: 400 });
        }

    } catch (error) {
        console.error('Erro ao controlar monitor:', error);
        return NextResponse.json(
            { error: 'Erro ao controlar monitor', message: error instanceof Error ? error.message : 'Erro desconhecido' },
            { status: 500 }
        );
    }
}