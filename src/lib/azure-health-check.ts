import { AzureComputeClient, AzureNetworkClient, azureConfig } from '@/lib/azure';

/**
 * Utilitário para verificar a saúde da conexão com Azure
 */
export class AzureHealthCheck {

    /**
     * Verifica se as credenciais da Azure estão funcionando
     */
    static async checkCredentials(): Promise<{ success: boolean; message: string; error?: any }> {
        try {
            // Tenta listar VMs para verificar autenticação (mais simples que resource groups)
            const vms = await AzureComputeClient.virtualMachines.list(azureConfig.resourceGroupName);
            
            // Tenta consumir o primeiro item do iterator para verificar se funciona
            const firstVm = await vms.next();
            
            return {
                success: true,
                message: 'Credenciais Azure funcionando corretamente'
            };
        } catch (error: any) {
            console.error('Azure credentials check failed:', error);
            return {
                success: false,
                message: 'Falha na autenticação Azure: ' + (error.message || 'Unknown error'),
                error
            };
        }
    }

    /**
     * Verifica se consegue acessar o resource group configurado
     */
    static async checkResourceGroup(): Promise<{ success: boolean; message: string; error?: any }> {
        try {
            // Tenta listar VMs no resource group
            const vms = await AzureComputeClient.virtualMachines.list(azureConfig.resourceGroupName);
            const vmList = [];
            
            for await (const vm of vms) {
                vmList.push({
                    name: vm.name,
                    status: vm.provisioningState,
                    location: vm.location
                });
            }

            return {
                success: true,
                message: `Resource group '${azureConfig.resourceGroupName}' acessível. ${vmList.length} VMs encontradas.`
            };
        } catch (error: any) {
            console.error('Azure resource group check failed:', error);
            return {
                success: false,
                message: `Falha ao acessar resource group '${azureConfig.resourceGroupName}': ` + (error.message || 'Unknown error'),
                error
            };
        }
    }

    /**
     * Verifica se consegue acessar os serviços de rede
     */
    static async checkNetworkAccess(): Promise<{ success: boolean; message: string; error?: any }> {
        try {
            // Tenta listar network interfaces
            const networkInterfaces = await AzureNetworkClient.networkInterfaces.list(azureConfig.resourceGroupName);
            const interfaceList = [];
            
            for await (const netInterface of networkInterfaces) {
                interfaceList.push({
                    name: netInterface.name,
                    provisioningState: netInterface.provisioningState
                });
            }

            return {
                success: true,
                message: `Serviços de rede acessíveis. ${interfaceList.length} network interfaces encontradas.`
            };
        } catch (error: any) {
            console.error('Azure network check failed:', error);
            return {
                success: false,
                message: 'Falha ao acessar serviços de rede Azure: ' + (error.message || 'Unknown error'),
                error
            };
        }
    }

    /**
     * Executa todos os testes de saúde da Azure
     */
    static async runFullHealthCheck(): Promise<{
        overall: boolean;
        credentials: { success: boolean; message: string };
        resourceGroup: { success: boolean; message: string };
        network: { success: boolean; message: string };
    }> {
        console.log('🔍 Iniciando verificação completa da Azure...');

        const credentials = await this.checkCredentials();
        const resourceGroup = await this.checkResourceGroup();
        const network = await this.checkNetworkAccess();

        const overall = credentials.success && resourceGroup.success && network.success;

        console.log('✅ Credenciais:', credentials.success ? 'OK' : 'FALHA');
        console.log('✅ Resource Group:', resourceGroup.success ? 'OK' : 'FALHA');
        console.log('✅ Rede:', network.success ? 'OK' : 'FALHA');
        console.log('🎯 Status Geral:', overall ? 'SAUDÁVEL' : 'COM PROBLEMAS');

        return {
            overall,
            credentials,
            resourceGroup,
            network
        };
    }

    /**
     * Verifica se uma VM específica existe e está acessível
     */
    static async checkSpecificVM(vmName: string): Promise<{ success: boolean; message: string; vmInfo?: any }> {
        try {
            const vm = await AzureComputeClient.virtualMachines.get(azureConfig.resourceGroupName, vmName);
            const instanceView = await AzureComputeClient.virtualMachines.instanceView(azureConfig.resourceGroupName, vmName);

            const powerState = instanceView.statuses?.find(status => status.code?.startsWith('PowerState/'));
            const status = powerState?.code?.replace('PowerState/', '') || 'unknown';

            return {
                success: true,
                message: `VM '${vmName}' encontrada com status: ${status}`,
                vmInfo: {
                    name: vm.name,
                    status,
                    location: vm.location,
                    vmSize: vm.hardwareProfile?.vmSize,
                    provisioningState: vm.provisioningState
                }
            };
        } catch (error: any) {
            return {
                success: false,
                message: `VM '${vmName}' não encontrada ou inacessível: ` + (error.message || 'Unknown error')
            };
        }
    }
}