import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ComputeManagementClient, VirtualMachine } from '@azure/arm-compute';
import { createClient } from '@/utils/supabase/server';
import { AuthHybrid } from '@/lib/auth-hybrid';
import { AzureComputeClient, AzureNetworkClient, azureConfig } from '@/lib/azure';
import machineController from '@/functions/database/controllers/MachineController';
import { ClientSecretCredential } from '@azure/identity';
import { NetworkInterface, NetworkManagementClient, PublicIPAddress } from '@azure/arm-network';

const WebhookCreateSchema = z.object({
  userId: z.string().uuid(),
  planId: z.number().int(),
  planName: z.string(),
});

const OwnerCreateSchema = z.object({
  userId: z.string().uuid(),
  name: z.string().optional(),
  planId: z.union([z.number().int(), z.string().transform(Number)]).refine(val => !isNaN(val) && val > 0, {
    message: 'planId deve ser um número inteiro positivo',
  }).optional(),
  planName: z.string().optional(),
  vmSize: z.string().optional(),
  snapshotId: z.string().optional(),
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

    const body = await req.json();
    const { vmSize, userId, snapshotId } = body;

    const rawName: string = body.name;
    const name: string = rawName
        .replace(/\./g, '-')
        .replace(/_/g, '-')
        .replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');

    if (!name || !vmSize || !userId) {
        return NextResponse.json(
            {
                error: "Required parameters are missing",
                support: "@dump.ts"
            },
            { status: 400 }
        );
    };

    // Get current timestamp
    const timestamp = new Date().getTime();

    // Define resource names with sanitized name
    const resourceNames = {
        nicName: `${name}-nic-${timestamp}`,
        ipName: `${name}-ip-${timestamp}`,
        diskName: `${name}-disk-${timestamp}`,
        subnetName: 'dark' // Usando subnet default da VNet existente
    };

    // Get Azure credentials from environment variables
    const azureTenantId = process.env.AZURE_TENANT_ID as string;
    const azureClientId = process.env.AZURE_CLIENT_ID as string;
    const azureClientSecret = process.env.AZURE_CLIENT_SECRET as string;
    const azureVnetName = process.env.AZURE_VNET_NAME as string;
    const azureVnetResourceGroup = process.env.AZURE_VNET_RESOURCE_GROUP as string;
    const azureSubnetName = process.env.AZURE_SUBNET_NAME as string;
    const azureNsgName = process.env.AZURE_NSG as string;
    const azureLocation = process.env.AZURE_LOCATION as string;
    const azureAvailabilityZone = process.env.AZURE_AVAILABILITY_ZONE as string;
    

    const credential = new ClientSecretCredential(azureTenantId, azureClientId, azureClientSecret);
    const subscriptionId: string = process.env.AZURE_SUBSCRIPTION_ID as string;
    const resourceGroupName: string = process.env.AZURE_RESOURCE_GROUP_NAME as string;
    const token = await credential.getToken("https://management.azure.com/.default");

    const computeClient = new ComputeManagementClient(credential, subscriptionId);
    const networkClient = new NetworkManagementClient(credential, subscriptionId);

    // IDs dos recursos existentes
    const existingVnetId = `/subscriptions/${subscriptionId}/resourceGroups/${azureVnetResourceGroup}/providers/Microsoft.Network/virtualNetworks/${azureVnetName}`;
    const existingNsgId = `/subscriptions/${subscriptionId}/resourceGroups/${azureVnetResourceGroup}/providers/Microsoft.Network/networkSecurityGroups/${azureNsgName}`;

    // Obter informações da VNet existente
    const vnet = await networkClient.virtualNetworks.get(
        azureVnetResourceGroup, // Usando o resource group específico da VNet
        azureVnetName
    );

    // Obter a subnet default da VNet
    const subnet = vnet.subnets?.find(s => s.name === azureSubnetName);
    if (!subnet?.id) {
        return NextResponse.json(
            {
                error: "Subnet 'default' not found in existing VNet",
                support: '@dump.ts'
            },
            { status: 500 }
        );
    };

    // Create public IP
    const publicIPParameters: PublicIPAddress = {
        location: azureLocation,
        sku: {
            name: 'Standard',
            tier: 'Regional'
        },
        publicIPAllocationMethod: 'Static',
        publicIPAddressVersion: 'IPv4',
        zones: azureAvailabilityZone ? [azureAvailabilityZone] : undefined,
        dnsSettings: {
            domainNameLabel: `${name.toLowerCase()}-${timestamp}`
        }
    };
    const publicIP = await networkClient.publicIPAddresses.beginCreateOrUpdateAndWait(
        resourceGroupName,
        resourceNames.ipName,
        publicIPParameters
    );

    // Create network interface
    const nicParameters: NetworkInterface = {
        location: azureLocation,
        enableAcceleratedNetworking: false,
        enableIPForwarding: false,
        ipConfigurations: [{
            name: `${resourceNames.nicName}-ipconfig`,
            primary: true,
            privateIPAddressVersion: 'IPv4',
            privateIPAllocationMethod: 'Dynamic',
            publicIPAddress: publicIP,
            subnet: { id: subnet.id }
        }],
        networkSecurityGroup: {
            id: existingNsgId
        },
        tags: {
            displayName: resourceNames.nicName
        }
    };
    const networkInterface = await networkClient.networkInterfaces.beginCreateOrUpdateAndWait(
        resourceGroupName,
        resourceNames.nicName,
        nicParameters
    );

    // Create disk from snapshot
    const diskParams = {
        location: azureLocation,
        zones: azureAvailabilityZone ? [azureAvailabilityZone] : undefined,
        creationData: {
            createOption: 'Copy',
            sourceResourceId: snapshotId ? snapshotId : process.env.AZURE_MACHINE_SNAPSHOT_ID_WIN11 as string
        },
        sku: { name: 'Standard_LRS' }
    };
    const disk = await computeClient.disks.beginCreateOrUpdateAndWait(
        resourceGroupName,
        resourceNames.diskName,
        diskParams
    );

    // Create VM using the created disk
    const machineParameters: VirtualMachine = {
        location: azureLocation,
        zones: azureAvailabilityZone ? [azureAvailabilityZone] : undefined,
        hardwareProfile: {
            vmSize: vmSize
        },
        priority: 'Spot',
        evictionPolicy: 'Deallocate',
        billingProfile: {
            maxPrice: -1
        },
        networkProfile: {
            networkInterfaces: [
                { id: networkInterface.id }
            ]
        },
        storageProfile: {
            osDisk: {
                osType: 'Windows',
                createOption: 'Attach',
                managedDisk: { id: disk.id }
            }
        },
        securityProfile: {
            securityType: 'TrustedLaunch',
            uefiSettings: {
                secureBootEnabled: true,
                vTpmEnabled: true
            }
        }
    };
    const machine = await computeClient.virtualMachines.beginCreateOrUpdateAndWait(
        resourceGroupName,
        name,
        machineParameters
    );

    // Create shutdown schedule
    // Create shutdown schedule
    const shutdownParams = {
        properties: {
            status: "Enabled",
            taskType: "ComputeVmShutdownTask",
            dailyRecurrence: {
                time: "0500" // 05h AM
            },
            timeZoneId: "E. South America Standard Time", // Brazil Time
            notificationSettings: {
                status: "Disabled"
            },
            targetResourceId: machine.id
        },
        location: azureLocation
    };
    await fetch(`https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/microsoft.devtestlab/schedules/shutdown-computevm-${name}?api-version=2018-09-15`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token.token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(shutdownParams)
    }
    );

    return NextResponse.json({ message: 'Máquina criada com sucesso', machine }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro ao criar VM', message: err.message }, { status: 500 });
  }
}
