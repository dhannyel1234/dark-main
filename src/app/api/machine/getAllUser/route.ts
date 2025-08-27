import { NextRequest, NextResponse } from 'next/server';
import { AuthHybrid } from '@/lib/auth-hybrid';
import machineController from '@/functions/database/controllers/MachineController';
import { AzureComputeClient, AzureNetworkClient, azureConfig } from '@/lib/azure';

// Função para buscar detalhes de uma única VM na Azure
async function getAzureVmDetails(vmName: string) {
    try {
        const { resourceGroupName } = azureConfig;

        const [vmInfo, vmInstanceView] = await Promise.all([
            AzureComputeClient.virtualMachines.get(resourceGroupName, vmName),
            AzureComputeClient.virtualMachines.instanceView(resourceGroupName, vmName)
        ]);

        const powerState = vmInstanceView.statuses?.find(status => status.code?.startsWith('PowerState/'));
        const status = powerState?.code?.replace('PowerState/', '') || 'unknown';

        const networkId = vmInfo.networkProfile?.networkInterfaces?.[0]?.id;
        let publicIp = null;

        console.log(`🔍 Buscando IP para VM ${vmName}:`);
        console.log(`   - Network ID: ${networkId}`);

        if (networkId) {
            const networkName = networkId.split('/').pop();
            console.log(`   - Network Name: ${networkName}`);
            
            if (networkName) {
                try {
                    const networkInterface = await AzureNetworkClient.networkInterfaces.get(resourceGroupName, networkName);
                    const publicIpId = networkInterface.ipConfigurations?.[0]?.publicIPAddress?.id;
                    console.log(`   - Public IP ID: ${publicIpId}`);
                    
                    if (publicIpId) {
                        const publicIpName = publicIpId.split('/').pop();
                        console.log(`   - Public IP Name: ${publicIpName}`);
                        
                        if (publicIpName) {
                            const publicIpAddress = await AzureNetworkClient.publicIPAddresses.get(resourceGroupName, publicIpName);
                            publicIp = publicIpAddress.ipAddress || null;
                            console.log(`   - IP Address Found: ${publicIp}`);
                        }
                    } else {
                        console.log(`   - ⚠️ VM ${vmName} não possui IP público associado`);
                    }
                } catch (networkError) {
                    console.error(`   - ❌ Erro ao buscar network interface para ${vmName}:`, networkError);
                }
            }
        } else {
            console.log(`   - ⚠️ VM ${vmName} não possui network interface configurada`);
        }

        return {
            status,
            publicIp,
            osType: vmInfo.storageProfile?.osDisk?.osType || 'Unknown',
            vmSize: vmInfo.hardwareProfile?.vmSize || 'Unknown',
            azureInfo: vmInfo // Retorna a informação completa da Azure se necessário
        };
    } catch (error) {
        console.error(`❌ Falha ao buscar detalhes da VM "${vmName}" na Azure:`, error);
        // Retorna um estado padrão em caso de erro para não quebrar a lista toda
        return {
            status: 'unknown',
            publicIp: null,
            osType: 'Ver detalhes',
            vmSize: 'Unknown',
            azureInfo: null,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}


export async function GET(request: NextRequest) {
    try {
        // Verificar autenticação
        const user = await AuthHybrid.getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const targetUserId = searchParams.get("user_id");

        if (!targetUserId) {
            return NextResponse.json({ error: 'user_id não fornecido' }, { status: 400 });
        }

        // Verificar permissões (admin/owner pode ver máquinas de qualquer usuário, usuário apenas suas próprias)
        const isAdmin = user.profile && ['admin', 'owner'].includes(user.profile.admin_level);

        if (user.id !== targetUserId && !isAdmin) {
            await AuthHybrid.sendSecurityWebhook(request, user, `Tentativa de acessar máquinas do usuário ${targetUserId} sem permissão`);
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
        }

        // 1. Buscar todas as máquinas do usuário no banco de dados
        console.log(`🔍 Buscando máquinas para usuário: ${targetUserId}`);
        const dbMachines = await machineController.findAllUser(targetUserId);
        console.log(`📊 Máquinas encontradas no banco: ${dbMachines?.length || 0}`);
        
        if (!dbMachines || dbMachines.length === 0) {
            console.log('⚠️ Nenhuma máquina encontrada no banco para este usuário');
            return NextResponse.json([], { status: 200 }); // Retorna array vazio se não houver máquinas no DB
        }

        // 2. Mapear as máquinas do DB e enriquecer com dados da Azure
        console.log(`🔄 Processando ${dbMachines.length} máquinas...`);
        const enrichedMachinesPromises = dbMachines.map(async (dbMachine) => {
            console.log(`🔍 Buscando detalhes Azure para VM: ${dbMachine.name}`);
            const azureDetails = await getAzureVmDetails(dbMachine.name);

            // Se a VM não foi encontrada na Azure, mantemos com dados do banco
            let status = azureDetails.status;
            let publicIp = azureDetails.publicIp;
            
            if (azureDetails.status === 'unknown') {
                // Manter a VM mas com indicação de erro de conectividade
                status = 'unknown';
                publicIp = 'Ver detalhes'; // Mostra mensagem genérica como fallback
                console.log(`⚠️ VM ${dbMachine.name} não encontrada no Azure, usando dados do banco`);
            }
            
            console.log(`✅ VM ${dbMachine.name} processada:`, {
                status: status,
                publicIp: publicIp,
                osType: azureDetails.osType
            });

            // Formata o objeto final para o frontend
            return {
                id: dbMachine.id,
                name: dbMachine.name,
                surname: dbMachine.surname,
                host: dbMachine.host,
                status: status,
                ip: publicIp || 'Ver detalhes',
                osType: azureDetails.osType || 'Ver detalhes',
                vmSize: azureDetails.vmSize || 'Unknown',
                openedInvoice: dbMachine.opened_invoice,
                creating: false,
                plan: {
                    name: dbMachine.plan_name,
                    expiration: dbMachine.plan_expiration_date,
                },
                connect: {
                    user: dbMachine.connect_user,
                    password: dbMachine.connect_password,
                },
                azureInfo: azureDetails.azureInfo,
                dbInfo: dbMachine
            };
        });

        const enrichedMachines = (await Promise.all(enrichedMachinesPromises)).filter(Boolean); // Filtra os nulos
        console.log(`✅ Processamento concluído. Retornando ${enrichedMachines.length} máquinas`);

        return NextResponse.json(enrichedMachines);
    } catch (error) {
        console.error("Erro ao buscar máquinas do usuário:", error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}