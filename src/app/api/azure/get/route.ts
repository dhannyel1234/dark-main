import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { VirtualMachine, VirtualMachineInstanceView } from '@azure/arm-compute';
import { NetworkInterface, PublicIPAddress } from '@azure/arm-network';

import { AuthHybrid } from '@/lib/auth-hybrid';
import { AzureComputeClient, AzureNetworkClient, azureConfig } from '@/lib/azure';
import machineController from '@/functions/database/controllers/MachineController';

// Schema de validação para os parâmetros da URL
const GetMachineSchema = z.object({
    name: z.string().min(1, "O nome da máquina é obrigatório."),
});

export async function GET(req: NextRequest) {
    try {
        // 1. Verificar autenticação
        const user = await AuthHybrid.getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        // 2. Validar os parâmetros da URL
        const url = new URL(req.url);
        const validation = GetMachineSchema.safeParse({
            name: url.searchParams.get("name")
        });

        if (!validation.success) {
            return NextResponse.json({ error: 'Dados inválidos', details: validation.error.flatten() }, { status: 400 });
        }
        const { name } = validation.data;

        // 3. Verificar permissões
        const isAdmin = user.profile && ['admin', 'owner'].includes(user.profile.admin_level);

        const machineInDb = await machineController.find(name);
        if (!machineInDb) {
            return NextResponse.json({ error: 'Máquina não encontrada no banco de dados' }, { status: 404 });
        }

        if (!isAdmin && machineInDb.owner_id !== user.id) {
            await AuthHybrid.sendSecurityWebhook(req, user, `Tentativa de acessar dados da máquina Azure "${name}" sem permissão`);
            return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 403 });
        }

        // 4. Buscar dados da VM na Azure
        console.log(`Buscando informações da VM "${name}" na Azure...`);
        const { resourceGroupName } = azureConfig;

        const [vmInfo, vmInstanceView] = await Promise.all([
            AzureComputeClient.virtualMachines.get(resourceGroupName, name),
            AzureComputeClient.virtualMachines.instanceView(resourceGroupName, name)
        ]);

        const powerState = vmInstanceView.statuses;

        // 4. Buscar dados de rede
        const networkId = vmInfo.networkProfile?.networkInterfaces?.[0]?.id;
        if (!networkId) {
            throw new Error("ID da interface de rede não encontrado para a VM.");
        }

        const networkName = networkId.split('/').pop();
        if (!networkName) {
            throw new Error("Nome da interface de rede não pôde ser extraído do ID.");
        }

        const networkInterface = await AzureNetworkClient.networkInterfaces.get(resourceGroupName, networkName);

        const publicIpId = networkInterface.ipConfigurations?.[0]?.publicIPAddress?.id;
        if (!publicIpId) {
            // Nem toda VM terá um IP público, então isso não é necessariamente um erro fatal.
            console.warn(`A VM "${name}" não possui um IP público associado.`);
            const responsePayload = {
                dbInfo: machineInDb,
                vmInfo,
                powerState,
                publicIp: null,
                network: networkInterface
            };
            return NextResponse.json(responsePayload, { status: 200 });
        }

        const publicIpName = publicIpId.split('/').pop();
        if (!publicIpName) {
            throw new Error("Nome do IP público não pôde ser extraído do ID.");
        }

        const publicIpAddress = await AzureNetworkClient.publicIPAddresses.get(resourceGroupName, publicIpName);

        // 5. Combinar e retornar os dados
        const responsePayload = {
            dbInfo: machineInDb,
            vmInfo,
            powerState,
            publicIp: publicIpAddress.ipAddress || null,
            network: networkInterface
        };

        return NextResponse.json(responsePayload, { status: 200 });

    } catch (err) {
        const error = err as Error;
        console.error(`Erro ao buscar a máquina virtual:`, error);
        return NextResponse.json({ error: "Erro ao buscar a máquina virtual", message: error.message }, { status: 500 });
    }
}