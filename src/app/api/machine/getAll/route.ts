import { NextRequest, NextResponse } from 'next/server';
import { AuthHybrid } from '@/lib/auth-hybrid';
import machineController from '@/functions/database/controllers/MachineController';

export async function GET(req: NextRequest) {
    try {
        // Verificar autenticação e permissão
        const user = await AuthHybrid.getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
        }

        if (!user.profile || !['admin', 'owner'].includes(user.profile.admin_level)) {
            await AuthHybrid.sendSecurityWebhook(req, user, 'Tentativa de acesso não autorizado à lista de máquinas');
            return NextResponse.json({ 
                error: "Acesso negado. Apenas administradores podem listar todas as máquinas." 
            }, { status: 403 });
        }
        
        const dbAllMachines = await machineController.findAll();
        return NextResponse.json(dbAllMachines, { status: 200 });
    } catch (err) {
        console.error('Erro ao buscar máquinas:', err);
        return NextResponse.json({ 
            message: "Erro ao buscar máquinas", 
            error: (err as Error).message 
        }, { status: 500 });
    }
};