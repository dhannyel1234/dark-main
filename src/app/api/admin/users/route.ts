import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { AuthHybrid } from '@/lib/auth-hybrid';
import usersController from '@/functions/database/controllers/UsersController';

// GET: Listar todos os usuários com paginação
export async function GET(req: NextRequest) {
    try {
        // Verificar autenticação e permissão
        const user = await AuthHybrid.getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        if (!user.profile || !['admin', 'owner'].includes(user.profile.admin_level)) {
            await AuthHybrid.sendSecurityWebhook(req, user, 'Tentativa de acesso não autorizado ao gerenciamento de usuários');
            return NextResponse.json({ 
                error: 'Acesso negado. Apenas admins e owners podem gerenciar usuários.' 
            }, { status: 403 });
        }

        // Extrair parâmetros de paginação e pesquisa
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const search = searchParams.get('search') || '';

        const result = await usersController.findAllPaginated(page, limit, search);
        return NextResponse.json(result, { status: 200 });
    } catch (err) {
        const e = err as Error;
        return NextResponse.json({ error: "Erro ao buscar usuários", message: e.message }, { status: 500 });
    }
}

// POST: Rota para executar ações em usuários (atribuir plano/máquina)
const ActionSchema = z.discriminatedUnion("action", [
    z.object({
        action: z.literal("assign_plan"),
        userId: z.string().uuid(),
        planId: z.string(),
    }),
    z.object({
        action: z.literal("assign_machine"),
        userId: z.string().uuid(),
        machineName: z.string(),
    }),
]);

export async function POST(req: NextRequest) {
    try {
        // Verificar autenticação e permissão
        const user = await AuthHybrid.getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        if (!user.profile || user.profile.admin_level !== 'owner') {
            await AuthHybrid.sendSecurityWebhook(req, user, 'Tentativa de acesso não autorizado ao gerenciamento de usuários (apenas owners)');
            return NextResponse.json({ 
                error: 'Acesso negado. Apenas owners podem executar ações em usuários.' 
            }, { status: 403 });
        }

        const body = await req.json();
        const validation = ActionSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: 'Ação ou dados inválidos', details: validation.error.flatten() }, { status: 400 });
        }

        const actionData = validation.data;

        if (actionData.action === "assign_plan") {
            const result = await usersController.assignPlan(actionData.userId, actionData.planId);
            return NextResponse.json({ message: "Plano atribuído com sucesso.", data: result }, { status: 200 });
        }

        if (actionData.action === "assign_machine") {
            const result = await usersController.assignMachine(actionData.userId, actionData.machineName);
            return NextResponse.json({ message: "Máquina atribuída com sucesso.", data: result }, { status: 200 });
        }

        return NextResponse.json({ error: "Ação não reconhecida." }, { status: 400 });

    } catch (err) {
        const e = err as Error;
        return NextResponse.json({ error: "Erro ao executar ação no usuário", message: e.message }, { status: 500 });
    }
}