import { NextRequest, NextResponse } from 'next/server';
import { AuthHybrid } from '@/lib/auth-hybrid';
import machineController from '@/functions/database/controllers/MachineController';

export async function POST(req: NextRequest) {
    try {
        // Verificar autenticação
        const user = await AuthHybrid.getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
        }

        const { name, days, plan, invoice, ...otherUpdates } = await req.json();
        if (!name) {
            return NextResponse.json({ message: "Nome da máquina não fornecido" }, { status: 400 });
        }

        const machine = await machineController.find(name);
        if (!machine) {
            return NextResponse.json({ message: "Máquina não encontrada" }, { status: 404 });
        }

        // Verificar permissões (admin/owner pode atualizar qualquer máquina, usuário apenas suas próprias)  
        const isAdmin = user.profile && ['admin', 'owner'].includes(user.profile.admin_level);

        if (!isAdmin && machine.owner_id !== user.id) {
            await AuthHybrid.sendSecurityWebhook(req, user, `Tentativa de atualizar máquina "${name}" sem permissão`);
            return NextResponse.json({ error: "Acesso não autorizado" }, { status: 403 });
        }

        // Processar campos especiais e construir objeto de update
        const updates: any = { ...otherUpdates };

        // Converter 'days' para 'plan_expiration_date'
        if (days !== undefined) {
            const now = new Date();
            const expirationDate = new Date(now);
            expirationDate.setDate(now.getDate() + parseInt(days));
            updates.plan_expiration_date = expirationDate.toISOString();
        }

        // Converter 'plan' para 'plan_name'
        if (plan !== undefined) {
            updates.plan_name = plan;
        }

        // Tratar campo 'invoice' como 'opened_invoice'
        if (invoice !== undefined) {
            updates.opened_invoice = invoice;
        }

        const updatedMachine = await machineController.update(name, updates);
        return NextResponse.json(updatedMachine, { status: 200 });

    } catch (err) {
        return NextResponse.json({ message: "Erro ao atualizar máquina", error: err }, { status: 500 });
    };
};