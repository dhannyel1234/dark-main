import { NextRequest, NextResponse } from 'next/server';
import { AuthHybrid } from '@/lib/auth-hybrid';
import { AzureHealthCheck } from '@/lib/azure-health-check';

export async function GET(request: NextRequest) {
    try {
        // Verificar autenticação e permissão de owner
        const user = await AuthHybrid.getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        if (!user.profile || user.profile.admin_level !== 'owner') {
            await AuthHybrid.sendSecurityWebhook(request, user, 'Tentativa de acessar teste de saúde Azure sem permissão');
            return NextResponse.json({ error: 'Acesso negado. Apenas owners podem executar testes Azure.' }, { status: 403 });
        }

        // Executar verificação completa da Azure
        const healthCheck = await AzureHealthCheck.runFullHealthCheck();

        return NextResponse.json({
            timestamp: new Date().toISOString(),
            azure_health: healthCheck,
            recommendations: healthCheck.overall ? 
                ['Azure está funcionando corretamente'] :
                [
                    !healthCheck.credentials.success ? 'Verificar credenciais Azure (AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, etc.)' : null,
                    !healthCheck.resourceGroup.success ? 'Verificar se o resource group existe e tem permissões' : null,
                    !healthCheck.network.success ? 'Verificar permissões de rede na Azure' : null
                ].filter(Boolean)
        });

    } catch (error: any) {
        console.error('Erro no teste de saúde Azure:', error);
        return NextResponse.json({ 
            error: 'Erro interno no teste Azure',
            message: error.message,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        // Verificar autenticação e permissão de owner
        const user = await AuthHybrid.getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        if (!user.profile || user.profile.admin_level !== 'owner') {
            await AuthHybrid.sendSecurityWebhook(request, user, 'Tentativa de testar VM específica sem permissão');
            return NextResponse.json({ error: 'Acesso negado. Apenas owners podem testar VMs específicas.' }, { status: 403 });
        }

        const { vmName } = await request.json();
        
        if (!vmName) {
            return NextResponse.json({ error: 'Nome da VM não fornecido' }, { status: 400 });
        }

        // Testar VM específica
        const vmCheck = await AzureHealthCheck.checkSpecificVM(vmName);

        return NextResponse.json({
            timestamp: new Date().toISOString(),
            vm_name: vmName,
            vm_check: vmCheck
        });

    } catch (error: any) {
        console.error('Erro no teste de VM específica:', error);
        return NextResponse.json({ 
            error: 'Erro interno no teste de VM',
            message: error.message,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}