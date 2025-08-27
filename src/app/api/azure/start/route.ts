import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { AuthHybrid } from '@/lib/auth-hybrid';
import { AzureComputeClient, azureConfig } from '@/lib/azure';
import machineController from '@/functions/database/controllers/MachineController';

// Schema de validação para o corpo da requisição
const StartMachineSchema = z.object({
    name: z.string().min(1, "O nome da máquina é obrigatório."),
});

export async function POST(req: NextRequest) {
    try {
        // 1. Verificar autenticação e permissão
        const user = await AuthHybrid.getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        // 2. Validar o corpo da requisição  
        const body = await req.json();
        const validation = StartMachineSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: 'Dados inválidos', details: validation.error.flatten() }, { status: 400 });
        }
        const { name } = validation.data;

        // 3. Buscar informações da máquina

        const machineInDb = await machineController.find(name);
        if (!machineInDb) {
            return NextResponse.json({ error: 'Máquina não encontrada no banco de dados' }, { status: 404 });
        }

        // 4. Verificar permissões (admin/owner pode iniciar qualquer máquina, usuário apenas suas próprias)
        const isAdmin = user.profile && ['admin', 'owner'].includes(user.profile.admin_level);
        
        if (!isAdmin && machineInDb.owner_id !== user.id) {
            await AuthHybrid.sendSecurityWebhook(req, user, `Tentativa de iniciar máquina "${name}" sem permissão`);
            return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 403 });
        }

        // 5. Iniciar a VM na Azure
        console.log(`Iniciando a VM "${name}"...`);
        const poller = await AzureComputeClient.virtualMachines.beginStart(azureConfig.resourceGroupName, name);
        await poller.pollUntilDone();
        console.log(`VM "${name}" iniciada com sucesso.`);

        return NextResponse.json({ message: "Máquina iniciada com sucesso" }, { status: 200 });

    } catch (err) {
        const error = err as Error;
        console.error(`Erro ao iniciar a máquina virtual:`, error);
        return NextResponse.json({ error: "Erro ao iniciar a máquina virtual", message: error.message }, { status: 500 });
    }
}