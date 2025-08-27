import { NextRequest, NextResponse } from 'next/server';

import { AuthHybrid } from '@/lib/auth-hybrid';
import { AzureComputeClient, azureConfig } from '@/lib/azure';
import machineController from '@/functions/database/controllers/MachineController';

export async function GET(req: NextRequest) {
    try {
        // 1. Verificar autenticação e permissão
        const user = await AuthHybrid.getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        if (!user.profile || user.profile.admin_level !== 'owner') {
            await AuthHybrid.sendSecurityWebhook(req, user, 'Tentativa de acesso não autorizado às VMs Azure');
            return NextResponse.json({ 
                error: 'Acesso negado. Apenas owners podem listar VMs Azure.' 
            }, { status: 403 });
        }

        // 2. Buscar todas as máquinas no banco de dados e na Azure em paralelo
        console.log("Buscando todas as máquinas na Azure e no banco de dados...");

        const [azureVms, dbMachines] = await Promise.all([
            AzureComputeClient.virtualMachines.list(azureConfig.resourceGroupName),
            machineController.findAll()
        ]);

        // Criar um mapa para acesso rápido aos dados do banco
        const dbMachinesMap = new Map(dbMachines.map(m => [m.name, m]));

        // 3. Combinar os dados
        const combinedDetails = [];
        for await (const vm of azureVms) {
            if (vm.name) {
                const dbInfo = dbMachinesMap.get(vm.name);
                combinedDetails.push({
                    azureInfo: vm,
                    dbInfo: dbInfo || null, // Inclui a VM mesmo que não esteja no nosso DB
                });
            }
        }

        console.log(`Encontradas ${combinedDetails.length} máquinas.`);
        return NextResponse.json(combinedDetails, { status: 200 });

    } catch (err) {
        const error = err as Error;
        console.error('Erro ao buscar todas as máquinas:', error);
        return NextResponse.json({ error: "Erro ao buscar todas as máquinas", message: error.message }, { status: 500 });
    }
}