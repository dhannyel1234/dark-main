import { NextRequest, NextResponse } from 'next/server';
import { AuthHybrid } from '@/lib/auth-hybrid';
import machineController from '@/functions/database/controllers/MachineController';

export async function GET(req: NextRequest) {
    try {
        // Verificar autenticação
        const user = await AuthHybrid.getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
        }

        const url = new URL(req.url);
        const name = url.searchParams.get("name");
        if (!name) {
            return NextResponse.json({ message: "Nome da máquina não encontrado nos parâmetros" }, { status: 400 });
        }

        const machine = await machineController.find(name);
        if (!machine) {
            return NextResponse.json({ message: "Máquina não encontrada" }, { status: 404 });
        }

        // Verificar permissões (admin/owner pode ver qualquer máquina, usuário apenas suas próprias)
        const isAdmin = user.profile && ['admin', 'owner'].includes(user.profile.admin_level);

        if (!isAdmin && machine.owner_id !== user.id) {
            await AuthHybrid.sendSecurityWebhook(req, user, `Tentativa de acessar dados da máquina "${name}" sem permissão`);
            return NextResponse.json({ error: "Acesso não autorizado" }, { status: 403 });
        }

        return NextResponse.json(machine, { status: 200 });
    } catch (err) {
        return NextResponse.json({ message: "Erro ao buscar máquina", error: err }, { status: 500 });
    };
};