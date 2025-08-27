import { NextRequest, NextResponse } from 'next/server';
import { AuthHybrid } from '@/lib/auth-hybrid';
import machineController from '@/functions/database/controllers/MachineController';
import { AzureComputeClient, azureConfig } from '@/lib/azure';

export async function POST(request: NextRequest) {
    try {
        // 1. Verificar autenticação e permissões usando hybrid auth
        const user = await AuthHybrid.getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const isOwner = await AuthHybrid.isOwner(user.id);
        if (!isOwner) {
            await AuthHybrid.sendSecurityWebhook(request, user, 'Tentativa de registrar VM no banco de dados');
            return NextResponse.json({ error: 'Acesso negado. Apenas owners podem registrar VMs.' }, { status: 403 });
        }

        // 2. Obter dados da requisição
        const { vmName } = await request.json();

        if (!vmName) {
            return NextResponse.json({ 
                error: 'Nome da VM é obrigatório' 
            }, { status: 400 });
        }

        // 3. Verificar se a VM existe no Azure
        const { resourceGroupName } = azureConfig;
        try {
            const azureVm = await AzureComputeClient.virtualMachines.get(resourceGroupName, vmName);
            if (!azureVm) {
                return NextResponse.json({ 
                    error: `VM '${vmName}' não encontrada no Azure` 
                }, { status: 404 });
            }
        } catch (azureError) {
            console.error('Erro ao verificar VM no Azure:', azureError);
            return NextResponse.json({ 
                error: `VM '${vmName}' não encontrada no Azure` 
            }, { status: 404 });
        }

        // 4. Verificar se a VM já está registrada
        const existingMachine = await machineController.find(vmName);
        if (existingMachine) {
            return NextResponse.json({ 
                error: `VM '${vmName}' já está registrada no banco de dados` 
            }, { status: 409 });
        }

        // 5. Criar registro no banco de dados como "disponível"
        const machineData = {
            name: vmName,
            surname: vmName, // Usar o mesmo nome
            host: 'azure' as const, // Sempre Azure para VMs registradas
            owner_id: null, // Nenhum owner inicial - disponível
            plan_name: 'Disponível', // Status indicativo
            plan_expiration_date: null, // Sem expiração até ser atribuída
            connect_user: process.env.AZURE_MACHINE_USERNAME || 'nxs',
            connect_password: process.env.AZURE_MACHINE_PASSWORD || 'darkcloud.store',
            opened_invoice: false
        };

        const createdMachine = await machineController.create(machineData);

        // 6. Log de auditoria
        await AuthHybrid.sendSecurityWebhook(request, user, `VM registrada: ${vmName} - status: disponível`);

        return NextResponse.json({
            success: true,
            message: `VM '${vmName}' registrada com sucesso como disponível`,
            machine: createdMachine
        });

    } catch (error) {
        console.error("Erro ao registrar VM:", error);
        return NextResponse.json({ 
            error: 'Erro interno do servidor ao registrar VM' 
        }, { status: 500 });
    }
}