import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { AuthHybrid } from '@/lib/auth-hybrid';
import { AzureComputeClient, azureConfig } from '@/lib/azure';
import machineController from '@/functions/database/controllers/MachineController';

// Schema de validação para o corpo da requisição
const DeleteMachineSchema = z.object({
    name: z.string().min(1, "O nome da máquina é obrigatório."),
});

export async function POST(req: NextRequest) {
    try {
        // 1. Verificar autenticação e permissão
        const user = await AuthHybrid.getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        if (!user.profile || user.profile.admin_level !== 'owner') {
            await AuthHybrid.sendSecurityWebhook(req, user, 'Tentativa de excluir máquina Azure sem permissão');
            return NextResponse.json({ error: 'Acesso não autorizado. Apenas owners podem excluir máquinas.' }, { status: 403 });
        }

        // 2. Validar o corpo da requisição
        const body = await req.json();
        const validation = DeleteMachineSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: 'Dados inválidos', details: validation.error.flatten() }, { status: 400 });
        }
        const { name } = validation.data;

        // 3. Deletar a VM na Azure
        console.log(`Iniciando exclusão da VM "${name}"...`);
        await AzureComputeClient.virtualMachines.beginDeleteAndWait(azureConfig.resourceGroupName, name);
        console.log(`VM "${name}" excluída com sucesso da Azure.`);

        // 4. Deletar o registro da VM no banco de dados Supabase
        // Este passo é importante para manter a consistência.
        await machineController.remove(name);
        console.log(`Registro da VM "${name}" removido do banco de dados.`);

        return NextResponse.json({ message: "Máquina virtual excluída com sucesso" }, { status: 200 });

    } catch (err) {
        const error = err as Error;
        console.error(`Erro ao excluir a máquina virtual:`, error);

        return NextResponse.json({ error: "Erro ao excluir a máquina virtual", message: error.message }, { status: 500 });
    }
}