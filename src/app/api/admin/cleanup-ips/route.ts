import { NextRequest, NextResponse } from 'next/server';
import { NetworkManagementClient } from '@azure/arm-network';
import { ComputeManagementClient } from '@azure/arm-compute';
import { ClientSecretCredential } from '@azure/identity';
import { AuthHybrid } from '@/lib/auth-hybrid';

export async function POST(req: NextRequest) {
    try {
        // Verificar autenticação e permissão
        const user = await AuthHybrid.getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        if (!user.profile || user.profile.admin_level !== 'owner') {
            await AuthHybrid.sendSecurityWebhook(req, user, 'Tentativa de limpeza de IPs sem permissão');
            return NextResponse.json({ error: 'Acesso não autorizado. Apenas owners podem limpar IPs.' }, { status: 403 });
        }

        // Configuração do Azure
        const tenantId = process.env.AZURE_TENANT_ID;
        const clientId = process.env.AZURE_CLIENT_ID;
        const clientSecret = process.env.AZURE_CLIENT_SECRET;
        const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID;
        const resourceGroupName = process.env.AZURE_RESOURCE_GROUP_NAME;

        if (!tenantId || !clientId || !clientSecret || !subscriptionId || !resourceGroupName) {
            return NextResponse.json({ error: 'Configuração Azure não encontrada' }, { status: 500 });
        }

        const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
        const networkClient = new NetworkManagementClient(credential, subscriptionId);
        const computeClient = new ComputeManagementClient(credential, subscriptionId);

        // 1. Listar todos os recursos
        const publicIPs = [];
        for await (const ip of networkClient.publicIPAddresses.list(resourceGroupName)) {
            publicIPs.push(ip);
        }

        const nics = [];
        for await (const nic of networkClient.networkInterfaces.list(resourceGroupName)) {
            nics.push(nic);
        }

        const vms = [];
        for await (const vm of computeClient.virtualMachines.list(resourceGroupName)) {
            vms.push(vm);
        }

        // 2. Identificar recursos órfãos
        const orphanIPs = [];
        const orphanNICs = [];
        const validIPs = [];

        // IPs completamente órfãos (sem ipConfiguration)
        for (const ip of publicIPs) {
            if (!ip.ipConfiguration) {
                orphanIPs.push({
                    name: ip.name,
                    ipAddress: ip.ipAddress || 'sem endereço',
                    type: 'ip-orphan'
                });
            }
        }

        // NICs órfãs (sem VM associada)
        for (const nic of nics) {
            if (!nic.virtualMachine) {
                orphanNICs.push(nic);
                
                // IPs associados a NICs órfãs
                if (nic.ipConfigurations) {
                    for (const ipConfig of nic.ipConfigurations) {
                        if (ipConfig.publicIPAddress?.id) {
                            const ipName = ipConfig.publicIPAddress.id.split('/').pop();
                            const publicIP = publicIPs.find(ip => ip.name === ipName);
                            if (publicIP) {
                                orphanIPs.push({
                                    name: publicIP.name,
                                    ipAddress: publicIP.ipAddress || 'sem endereço',
                                    type: 'nic-orphan',
                                    nicName: nic.name
                                });
                            }
                        }
                    }
                }
            } else {
                // Verificar se a VM associada ainda existe
                const vmExists = vms.some(vm => vm.id === nic.virtualMachine);
                if (!vmExists) {
                    orphanNICs.push(nic);
                    
                    // IPs de NICs com VMs deletadas
                    if (nic.ipConfigurations) {
                        for (const ipConfig of nic.ipConfigurations) {
                            if (ipConfig.publicIPAddress?.id) {
                                const ipName = ipConfig.publicIPAddress.id.split('/').pop();
                                const publicIP = publicIPs.find(ip => ip.name === ipName);
                                if (publicIP) {
                                    orphanIPs.push({
                                        name: publicIP.name,
                                        ipAddress: publicIP.ipAddress || 'sem endereço',
                                        type: 'dead-vm',
                                        nicName: nic.name
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }

        // Remover duplicatas de IPs órfãos
        const uniqueOrphanIPs = Array.from(
            new Map(orphanIPs.map(ip => [ip.name, ip])).values()
        );

        if (uniqueOrphanIPs.length === 0 && orphanNICs.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'Nenhum recurso órfão encontrado',
                summary: {
                    totalIPs: publicIPs.length,
                    totalNICs: nics.length,
                    totalVMs: vms.length,
                    orphanIPs: 0,
                    orphanNICs: 0,
                    deletedIPs: 0,
                    deletedNICs: 0
                }
            });
        }

        // 3. Deletar recursos órfãos
        let deletedIPCount = 0;
        let deletedNICCount = 0;
        let errorCount = 0;
        const deletedResources = [];
        const errors = [];

        // Primeiro deletar NICs órfãs (isso desassocia os IPs automaticamente)
        for (const nic of orphanNICs) {
            try {
                if (!nic.name) continue;
                await networkClient.networkInterfaces.beginDeleteAndWait(resourceGroupName, nic.name);
                deletedResources.push({
                    type: 'NIC',
                    name: nic.name
                });
                deletedNICCount++;
            } catch (error: any) {
                errors.push({
                    resource: `NIC: ${nic.name}`,
                    error: error.message
                });
                errorCount++;
            }
        }

        // Depois deletar IPs órfãos restantes
        for (const ip of uniqueOrphanIPs) {
            try {
                if (!ip.name) continue;
                await networkClient.publicIPAddresses.beginDeleteAndWait(resourceGroupName, ip.name);
                deletedResources.push({
                    type: 'IP',
                    name: ip.name,
                    address: ip.ipAddress,
                    reason: ip.type
                });
                deletedIPCount++;
            } catch (error: any) {
                errors.push({
                    resource: `IP: ${ip.name}`,
                    error: error.message
                });
                errorCount++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Limpeza concluída! ${deletedIPCount} IPs e ${deletedNICCount} NICs órfãs foram removidos.`,
            summary: {
                totalIPs: publicIPs.length,
                totalNICs: nics.length,
                totalVMs: vms.length,
                orphanIPs: uniqueOrphanIPs.length,
                orphanNICs: orphanNICs.length,
                deletedIPs: deletedIPCount,
                deletedNICs: deletedNICCount,
                errors: errorCount
            },
            deletedResources,
            errors: errorCount > 0 ? errors : undefined
        });

    } catch (error: any) {
        console.error('Erro na limpeza de IPs:', error);
        return NextResponse.json({ 
            error: 'Erro interno na limpeza de IPs', 
            message: error.message 
        }, { status: 500 });
    }
}