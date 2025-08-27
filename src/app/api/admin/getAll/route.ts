import { NextRequest, NextResponse } from 'next/server';
import { AuthHybrid } from '@/lib/auth-hybrid';
import { AzureComputeClient, azureConfig } from '@/lib/azure';
import machineController from '@/functions/database/controllers/MachineController';

export async function GET(request: NextRequest) {
    try {
        // 1. Verificar autenticação e permissões usando hybrid auth
        const user = await AuthHybrid.getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const isOwner = await AuthHybrid.isOwner(user.id);
        if (!isOwner) {
            await AuthHybrid.sendSecurityWebhook(request, user, 'Tentativa de acesso à lista de todas as máquinas');
            return NextResponse.json({ error: 'Acesso negado. Apenas owners podem visualizar todas as máquinas.' }, { status: 403 });
        }

        // 2. Listar todas as VMs do grupo de recursos na Azure
        const { resourceGroupName } = azureConfig;
        const vmList = [];
        for await (const vm of AzureComputeClient.virtualMachines.list(resourceGroupName)) {
            vmList.push(vm);
        }

        // 3. Buscar todos os registros de máquinas do nosso banco de dados
        const dbMachines = await machineController.findAll();
        const dbMachinesMap = new Map(dbMachines.map(m => [m.name, m]));

        // 4. Combinar os dados da Azure com os do banco de dados
        const combinedData = vmList.map(azureVm => {
            const dbInfo = dbMachinesMap.get(azureVm.name!) || null;
            return {
                azureInfo: azureVm,
                dbInfo: dbInfo,
            };
        });

        return NextResponse.json(combinedData);

    } catch (error) {
        console.error("Erro ao buscar todas as máquinas:", error);
        return NextResponse.json({ error: 'Erro interno do servidor ao buscar máquinas.' }, { status: 500 });
    }
}