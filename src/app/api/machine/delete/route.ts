import { NextRequest, NextResponse } from 'next/server';
import { AuthHybrid } from '@/lib/auth-hybrid';
import machineController from '@/functions/database/controllers/MachineController';

export async function POST(req: NextRequest) {
    try {
        // Verificar autenticação e permissão
        const user = await AuthHybrid.getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        if (!user.profile || !['admin', 'owner'].includes(user.profile.admin_level)) {
            await AuthHybrid.sendSecurityWebhook(req, user, 'Tentativa de deletar máquina sem permissão');
            return NextResponse.json({ error: 'Acesso negado. Apenas admins e owners podem deletar máquinas.' }, { status: 403 });
        }

        const { name } = await req.json();
        if (!name) {
            return NextResponse.json(
                {
                    error: "Required parameters are missing",
                    support: "@sb4z7"
                },
                { status: 400 }
            );
        };

        const dbMachine = await machineController.remove(name);
        return NextResponse.json(dbMachine, { status: 200 });
    } catch (err) {
        console.log("Error when removing database machine:", err);
        return NextResponse.json(
            {
                message: "Error when removing machine",
                support: '@sb4z7'
            },
            { status: 500 }
        );
    };
};