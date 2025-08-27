import { NextRequest, NextResponse } from 'next/server';
import { AzureComputeClient, azureConfig } from '@/lib/azure';

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const name = url.searchParams.get("name");
        
        if (!name) {
            return NextResponse.json({ error: 'Nome da máquina é obrigatório' }, { status: 400 });
        }

        console.log(`🔍 Testando status da VM "${name}"...`);
        
        const vmInstanceView = await AzureComputeClient.virtualMachines.instanceView(azureConfig.resourceGroupName, name);
        
        console.log('📋 PowerState completo:', JSON.stringify(vmInstanceView.statuses, null, 2));
        
        return NextResponse.json({
            name,
            powerState: vmInstanceView.statuses,
            powerStateDetailed: vmInstanceView.statuses?.map((status, index) => ({
                index,
                code: status.code,
                level: status.level,
                displayStatus: status.displayStatus
            }))
        }, { status: 200 });

    } catch (err) {
        const error = err as Error;
        console.error(`❌ Erro ao testar status da VM:`, error);
        return NextResponse.json({ 
            error: "Erro ao testar status da VM", 
            message: error.message 
        }, { status: 500 });
    }
}