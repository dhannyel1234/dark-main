import { NextRequest, NextResponse } from 'next/server';

import { AuthHybrid } from '@/lib/auth-hybrid';
import { AzureComputeClient, azureConfig } from '@/lib/azure';

export async function GET(req: NextRequest) {
    try {
        // 1. Verificar autenticação e permissão
        const user = await AuthHybrid.getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
        }

        if (!user.profile || user.profile.admin_level !== 'owner') {
            await AuthHybrid.sendSecurityWebhook(req, user, 'Tentativa de listar snapshots não autorizada');
            return NextResponse.json({ error: 'Acesso não autorizado. Apenas owners podem listar snapshots.' }, { status: 403 });
        }

        // 2. Buscar todos os snapshots na Azure
        console.log("Buscando todos os snapshots na Azure...");
        const snapshotList = [];
        for await (const snapshot of AzureComputeClient.snapshots.listByResourceGroup(azureConfig.resourceGroupName)) {
            snapshotList.push(snapshot);
        }

        // 3. Mapear para o formato desejado
        const snapshotPaths = snapshotList.map((snapshot) => ({
            id: snapshot.id,
            name: snapshot.name,
            location: snapshot.location,
            timeCreated: snapshot.timeCreated,
        }));

        console.log(`Encontrados ${snapshotPaths.length} snapshots.`);
        return NextResponse.json(snapshotPaths, { status: 200 });

    } catch (err) {
        const error = err as Error;
        console.error('Erro ao buscar snapshots:', error);
        return NextResponse.json({ error: "Erro ao buscar snapshots", message: error.message }, { status: 500 });
    }
}