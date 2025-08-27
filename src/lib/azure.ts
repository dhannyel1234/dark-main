import { ClientSecretCredential } from '@azure/identity';
import { ComputeManagementClient } from '@azure/arm-compute';
import { NetworkManagementClient } from '@azure/arm-network';

// --- Validação de Variáveis de Ambiente ---
const requiredEnvVars = [
    'AZURE_TENANT_ID',
    'AZURE_CLIENT_ID',
    'AZURE_CLIENT_SECRET',
    'AZURE_SUBSCRIPTION_ID',
    'AZURE_RESOURCE_GROUP_NAME'
];

const optionalEnvVars = [
    'AZURE_MACHINE_SNAPSHOT_ID_WIN11'
];

// Validação crítica apenas para variáveis essenciais
for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
        throw new Error(`Erro Crítico: A variável de ambiente da Azure "${varName}" não está definida.`);
    }
}

// Aviso para variáveis opcionais (mas importantes para funcionamento completo)
for (const varName of optionalEnvVars) {
    if (!process.env[varName]) {
        console.warn(`⚠️ Aviso: A variável de ambiente da Azure "${varName}" não está definida. Funcionalidade limitada.`);
    }
}

// --- Configuração e Credenciais ---
const tenantId = process.env.AZURE_TENANT_ID!;
const clientId = process.env.AZURE_CLIENT_ID!;
const clientSecret = process.env.AZURE_CLIENT_SECRET!;
const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID!;
const resourceGroupName = process.env.AZURE_RESOURCE_GROUP_NAME!;

const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);

// --- Clientes da Azure (Singletons) ---
const computeClient = new ComputeManagementClient(credential, subscriptionId);
const networkClient = new NetworkManagementClient(credential, subscriptionId);

// --- Exportações ---
// Debug: Vamos ver quais valores estão sendo lidos
console.log('🔍 Debug - Variáveis de ambiente Azure:', {
    AZURE_VNET_RESOURCE_GROUP: process.env.AZURE_VNET_RESOURCE_GROUP,
    AZURE_VNET_NAME: process.env.AZURE_VNET_NAME,
    AZURE_SUBNET_NAME: process.env.AZURE_SUBNET_NAME,
    resourceGroupName: resourceGroupName
});

export const azureConfig = {
    subscriptionId,
    resourceGroupName,
    defaultSnapshotId: process.env.AZURE_MACHINE_SNAPSHOT_ID_WIN11 || '',
    vnetResourceGroup: process.env.AZURE_VNET_RESOURCE_GROUP || resourceGroupName,
    vnetName: process.env.AZURE_VNET_NAME || 'Dark',
    subnetName: process.env.AZURE_SUBNET_NAME || 'dark',
    defaultLocation: 'brazilsouth'
};

export const AzureComputeClient = computeClient;
export const AzureNetworkClient = networkClient;

/**
 * Retorna um token de acesso para a API de gerenciamento da Azure.
 * Útil para chamadas fetch manuais.
 */
export async function getAzureManagementToken(): Promise<string> {
    const token = await credential.getToken("https://management.azure.com/.default");
    if (!token) {
        throw new Error("Não foi possível obter o token de acesso da Azure.");
    }
    return token.token;
}