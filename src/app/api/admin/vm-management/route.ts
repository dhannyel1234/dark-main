import { NextRequest, NextResponse } from 'next/server';
import { AuthHybrid } from '@/lib/auth-hybrid';
import { AzureComputeClient, azureConfig } from '@/lib/azure';
import machineController from '@/functions/database/controllers/MachineController';

interface VMData {
    id: string;
    name: string;
    azure_vm_name: string;
    azure_status: string;
    system_status: 'available' | 'occupied_queue' | 'rented' | 'reserved' | 'maintenance';
    is_registered: boolean;
    owner_id: string | null;
    reserved_by: string | null;
    reserved_reason: string | null;
    owner_discord: string | null;
    owner_email: string | null;
    owner_discord_id: string | null;
    created_at: string;
    updated_at: string;
}

interface VMStats {
    total: number;
    registered: number;
    available: number;
    rented: number;
    occupied_queue: number;
    reserved: number;
    maintenance: number;
    utilization_rate: number;
}

export async function GET(request: NextRequest) {
    try {
        // 1. Verificar autenticação e permissões
        const user = await AuthHybrid.getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const isAdmin = await AuthHybrid.isAdmin(user.id);
        if (!isAdmin) {
            await AuthHybrid.sendSecurityWebhook(request, user, 'Tentativa de acesso ao gerenciamento de VMs');
            return NextResponse.json({ error: 'Acesso negado. Apenas admins podem acessar.' }, { status: 403 });
        }

        // 2. Buscar VMs do Azure
        const { resourceGroupName } = azureConfig;
        const azureVMs = [];
        
        console.log(`🔍 Buscando VMs do Resource Group: ${resourceGroupName}`);
        
        try {
            for await (const vm of AzureComputeClient.virtualMachines.list(resourceGroupName)) {
                try {
                    // Buscar status detalhado da VM
                    const vmInstanceView = await AzureComputeClient.virtualMachines.instanceView(resourceGroupName, vm.name!);
                    const powerState = vmInstanceView.statuses?.find(status => status.code?.startsWith('PowerState/'))?.displayStatus || 'Unknown';
                    
                    azureVMs.push({
                        name: vm.name!,
                        id: vm.id!,
                        location: vm.location,
                        status: powerState,
                        vmSize: vm.hardwareProfile?.vmSize
                    });
                    
                    console.log(`✅ VM encontrada: ${vm.name} - Status: ${powerState}`);
                } catch (vmError) {
                    console.error(`❌ Erro ao buscar detalhes da VM ${vm.name}:`, vmError);
                    // Adicionar VM mesmo sem status detalhado
                    azureVMs.push({
                        name: vm.name!,
                        id: vm.id!,
                        location: vm.location,
                        status: 'Error getting status',
                        vmSize: vm.hardwareProfile?.vmSize
                    });
                }
            }
            
            console.log(`📊 Total de VMs encontradas no Azure: ${azureVMs.length}`);
        } catch (azureListError) {
            console.error('❌ Erro ao listar VMs do Azure:', azureListError);
            // Em caso de erro do Azure, continuamos apenas com dados do banco
            console.log('⚠️ Continuando apenas com dados do banco de dados...');
            
            // Retorna um erro mais específico se não conseguir conectar no Azure
            if (azureVMs.length === 0) {
                return NextResponse.json({
                    error: 'Erro de conectividade com Azure',
                    details: azureListError instanceof Error ? azureListError.message : String(azureListError),
                    fallback: 'Tentando continuar apenas com dados do banco...'
                }, { status: 503 });
            }
        }

        // 3. Buscar dados do banco de dados com informações de usuários
        console.log('🔍 Buscando máquinas no banco de dados...');
        const dbMachines = await machineController.findAll();
        const dbMachinesMap = new Map(dbMachines.map(m => [m.name, m]));
        console.log(`📊 Total de máquinas no banco: ${dbMachines.length}`);

        // 4. Buscar dados dos usuários (perfis) se houver owner_id
        const userIds = [...new Set(dbMachines.map(m => m.owner_id).filter(Boolean))];
        const userProfiles = new Map();
        
        if (userIds.length > 0) {
            const { createAdminClient } = await import('@/utils/supabase/admin');
            const supabase = createAdminClient();
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('id, discord_username, discord_global_name, email')
                .in('id', userIds);
            
            if (!profilesError && profiles) {
                profiles.forEach(profile => {
                    userProfiles.set(profile.id, profile);
                });
            }
        }

        // 5. Combinar dados e criar estrutura para o frontend
        const vms: VMData[] = [];
        const processedDbMachines = new Set<string>();

        // Primeiro, processar VMs do Azure
        azureVMs.forEach(azureVM => {
            const dbData = dbMachinesMap.get(azureVM.name);
            const userProfile = dbData?.owner_id ? userProfiles.get(dbData.owner_id) : null;
            
            // Determinar status do sistema baseado nos dados do DB
            let systemStatus: VMData['system_status'] = 'maintenance';
            
            if (dbData) {
                processedDbMachines.add(dbData.name);
                // Se há dados no DB, a VM está registrada
                if (!dbData.owner_id || dbData.plan_name === 'Disponível') {
                    systemStatus = 'available';
                } else {
                    const now = new Date();
                    const expiration = dbData.plan_expiration_date ? new Date(dbData.plan_expiration_date) : null;
                    
                    if (expiration && expiration > now) {
                        systemStatus = 'rented';
                    } else {
                        systemStatus = 'available';
                    }
                }
            }

            vms.push({
                id: dbData?.id || azureVM.id,
                name: dbData?.surname || azureVM.name,
                azure_vm_name: azureVM.name,
                azure_status: azureVM.status,
                system_status: systemStatus,
                is_registered: !!dbData,
                owner_id: dbData?.owner_id || null,
                reserved_by: null, // Implementar se necessário
                reserved_reason: null, // Implementar se necessário
                owner_discord: userProfile?.discord_username || userProfile?.discord_global_name || null,
                owner_email: userProfile?.email || null,
                owner_discord_id: dbData?.owner_id || null,
                created_at: dbData?.created_at || new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
        });

        // Depois, processar máquinas que estão apenas no banco (não encontradas no Azure)
        dbMachines.forEach(dbMachine => {
            if (!processedDbMachines.has(dbMachine.name)) {
                const userProfile = dbMachine.owner_id ? userProfiles.get(dbMachine.owner_id) : null;
                
                // Determinar status do sistema
                let systemStatus: VMData['system_status'] = 'maintenance'; // Padrão para máquinas não encontradas no Azure
                
                if (!dbMachine.owner_id || dbMachine.plan_name === 'Disponível') {
                    systemStatus = 'available';
                } else {
                    const now = new Date();
                    const expiration = dbMachine.plan_expiration_date ? new Date(dbMachine.plan_expiration_date) : null;
                    
                    if (expiration && expiration > now) {
                        systemStatus = 'rented';
                    } else {
                        systemStatus = 'available';
                    }
                }

                vms.push({
                    id: dbMachine.id,
                    name: dbMachine.surname,
                    azure_vm_name: dbMachine.name,
                    azure_status: 'Not found in Azure',
                    system_status: systemStatus,
                    is_registered: true,
                    owner_id: dbMachine.owner_id,
                    reserved_by: null,
                    reserved_reason: null,
                    owner_discord: userProfile?.discord_username || userProfile?.discord_global_name || null,
                    owner_email: userProfile?.email || null,
                    owner_discord_id: dbMachine.owner_id,
                    created_at: dbMachine.created_at || new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });
            }
        });

        console.log(`📊 Total de VMs processadas: ${vms.length}`);

        // 6. Calcular estatísticas
        const stats: VMStats = {
            total: vms.length,
            registered: vms.filter(vm => vm.is_registered).length,
            available: vms.filter(vm => vm.system_status === 'available').length,
            rented: vms.filter(vm => vm.system_status === 'rented').length,
            occupied_queue: vms.filter(vm => vm.system_status === 'occupied_queue').length,
            reserved: vms.filter(vm => vm.system_status === 'reserved').length,
            maintenance: vms.filter(vm => vm.system_status === 'maintenance').length,
            utilization_rate: vms.length > 0 ? (vms.filter(vm => vm.system_status !== 'available').length / vms.length) * 100 : 0
        };

        return NextResponse.json({
            vms,
            stats
        });

    } catch (error) {
        console.error('Erro ao buscar dados de VMs:', error);
        return NextResponse.json({ 
            error: 'Erro interno do servidor',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        // 1. Verificar autenticação e permissões
        const user = await AuthHybrid.getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const isOwner = await AuthHybrid.isOwner(user.id);
        if (!isOwner) {
            await AuthHybrid.sendSecurityWebhook(request, user, 'Tentativa de ação em gerenciamento de VMs');
            return NextResponse.json({ error: 'Acesso negado. Apenas owners podem executar ações.' }, { status: 403 });
        }

        // 2. Obter dados da requisição
        const { action, vmId, azureVmName, reason, userId, planName, days } = await request.json();

        if (!action) {
            return NextResponse.json({ error: 'Ação é obrigatória' }, { status: 400 });
        }

        // 3. Executar ação baseada no tipo
        let message = '';
        
        switch (action) {
            case 'register':
                if (!azureVmName) {
                    return NextResponse.json({ error: 'Nome da VM do Azure é obrigatório' }, { status: 400 });
                }
                
                // Verificar se a VM existe no Azure
                const { resourceGroupName } = azureConfig;
                try {
                    await AzureComputeClient.virtualMachines.get(resourceGroupName, azureVmName);
                } catch (azureError) {
                    return NextResponse.json({ 
                        error: `VM '${azureVmName}' não encontrada no Azure` 
                    }, { status: 404 });
                }

                // Verificar se já está registrada
                const existingMachine = await machineController.find(azureVmName);
                if (existingMachine) {
                    return NextResponse.json({ 
                        error: `VM '${azureVmName}' já está registrada` 
                    }, { status: 409 });
                }

                // Registrar VM básica (sem usuário específico)
                await machineController.create({
                    name: azureVmName,
                    surname: azureVmName, // Usar o nome da VM como apelido inicial
                    host: 'azure' as const,
                    owner_id: null, // Sem dono inicial
                    plan_name: 'Disponível', // Status indicativo
                    plan_expiration_date: null, // Sem expiração até ser atribuída
                    connect_user: process.env.AZURE_MACHINE_USERNAME || 'admin',
                    connect_password: process.env.AZURE_MACHINE_PASSWORD || 'password',
                    opened_invoice: false
                });

                message = `VM '${azureVmName}' registrada com sucesso no sistema`;
                break;

            case 'unregister':
                if (!vmId) {
                    return NextResponse.json({ error: 'ID da VM é obrigatório' }, { status: 400 });
                }

                const vmToUnregister = await machineController.find(vmId);
                if (!vmToUnregister) {
                    return NextResponse.json({ error: 'VM não encontrada no sistema' }, { status: 404 });
                }

                await machineController.remove(vmToUnregister.name);
                message = `VM removida do registro do sistema`;
                break;

            case 'rent':
                if (!vmId || !userId || !planName || !days) {
                    return NextResponse.json({ 
                        error: 'VM ID, usuário, plano e dias são obrigatórios para alugar VM' 
                    }, { status: 400 });
                }

                // Buscar VM no sistema
                const vmToRent = await machineController.findById(vmId);
                if (!vmToRent) {
                    return NextResponse.json({ error: 'VM não encontrada no sistema' }, { status: 404 });
                }

                // Verificar se VM está disponível
                if (vmToRent.owner_id) {
                    return NextResponse.json({ error: 'VM já está ocupada por outro usuário' }, { status: 409 });
                }

                // Calcular data de expiração
                const expirationDate = new Date();
                expirationDate.setDate(expirationDate.getDate() + parseInt(days));

                // Atualizar VM com novo usuário
                await machineController.update(vmToRent.name, {
                    owner_id: userId,
                    plan_name: planName,
                    plan_expiration_date: expirationDate.toISOString()
                });

                message = `VM alugada com sucesso para usuário ${userId}`;
                break;

            case 'unrent':
                if (!vmId) {
                    return NextResponse.json({ error: 'VM ID é obrigatório para desalugar' }, { status: 400 });
                }

                const vmToUnrent = await machineController.findById(vmId);
                if (!vmToUnrent) {
                    return NextResponse.json({ error: 'VM não encontrada no sistema' }, { status: 404 });
                }

                // Tornar VM disponível novamente
                await machineController.update(vmToUnrent.name, {
                    owner_id: null,
                    plan_name: 'Disponível',
                    plan_expiration_date: null
                });

                message = `VM liberada e está disponível novamente`;
                break;

            case 'reserve':
            case 'unreserve':
                // Essas ações requerem implementação adicional de campo de status na tabela machines
                // Por enquanto, retornamos uma mensagem informativa
                message = `Ação '${action}' será implementada em versão futura`;
                break;

            default:
                return NextResponse.json({ error: 'Ação não reconhecida' }, { status: 400 });
        }

        // Log de auditoria
        await AuthHybrid.sendSecurityWebhook(request, user, `Ação VM executada: ${action}${vmId ? ` - VM: ${vmId}` : ''}${azureVmName ? ` - Azure VM: ${azureVmName}` : ''}`);

        return NextResponse.json({
            success: true,
            message
        });

    } catch (error) {
        console.error('Erro ao executar ação de VM:', error);
        return NextResponse.json({ 
            error: 'Erro interno do servidor',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}