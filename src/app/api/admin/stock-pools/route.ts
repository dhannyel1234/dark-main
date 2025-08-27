import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { AuthHybrid } from '@/lib/auth-hybrid';
import stockPoolsController from '@/functions/database/controllers/StockPoolsController';

// GET: Listar todos os pools de estoque
export async function GET(req: NextRequest) {
    try {
        // Verificar autenticação e permissão
        const user = await AuthHybrid.getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        if (!user.profile || user.profile.admin_level !== 'owner') {
            await AuthHybrid.sendSecurityWebhook(req, user, 'Tentativa de acesso não autorizado ao gerenciamento de pools de estoque');
            return NextResponse.json({ 
                error: 'Acesso negado. Apenas o proprietário pode gerenciar pools de estoque.' 
            }, { status: 403 });
        }

        const pools = await stockPoolsController.findAll();
        return NextResponse.json(pools, { status: 200 });
    } catch (err) {
        const e = err as Error;
        return NextResponse.json({ error: "Erro ao buscar pools de estoque", message: e.message }, { status: 500 });
    }
}

// POST: Criar um novo pool de estoque
const CreatePoolSchema = z.object({
    name: z.string().min(3, "O nome do pool deve ter pelo menos 3 caracteres."),
    quantity: z.number().int().min(0, "A quantidade deve ser um número positivo."),
});

export async function POST(req: NextRequest) {
    try {
        // Verificar autenticação e permissão
        const user = await AuthHybrid.getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        if (!user.profile || user.profile.admin_level !== 'owner') {
            await AuthHybrid.sendSecurityWebhook(req, user, 'Tentativa de criação de pool de estoque não autorizada');
            return NextResponse.json({ 
                error: 'Acesso negado. Apenas o proprietário pode criar pools de estoque.' 
            }, { status: 403 });
        }

        const body = await req.json();
        const validation = CreatePoolSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: 'Dados inválidos', details: validation.error.flatten() }, { status: 400 });
        }

        const newPool = await stockPoolsController.create(validation.data);
        return NextResponse.json(newPool, { status: 201 });
    } catch (err) {
        const e = err as Error;
        return NextResponse.json({ error: "Erro ao criar pool de estoque", message: e.message }, { status: 500 });
    }
}

// PUT: Atualizar um pool de estoque
const UpdatePoolSchema = z.object({
    id: z.string().uuid("O ID do pool é obrigatório."),
    name: z.string().min(3, "O nome do pool deve ter pelo menos 3 caracteres.").optional(),
    quantity: z.number().int().min(0, "A quantidade deve ser um número positivo.").optional(),
});

export async function PUT(req: NextRequest) {
    try {
        // Verificar autenticação e permissão
        const user = await AuthHybrid.getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        if (!user.profile || user.profile.admin_level !== 'owner') {
            await AuthHybrid.sendSecurityWebhook(req, user, 'Tentativa de atualizar pool de estoque não autorizada');
            return NextResponse.json({ 
                error: 'Acesso negado. Apenas o proprietário pode atualizar pools de estoque.' 
            }, { status: 403 });
        }

        const body = await req.json();
        const validation = UpdatePoolSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: 'Dados inválidos', details: validation.error.flatten() }, { status: 400 });
        }
        
        const { id, ...updates } = validation.data;

        const updatedPool = await stockPoolsController.update(id, updates);
        return NextResponse.json(updatedPool, { status: 200 });
    } catch (err) {
        const e = err as Error;
        return NextResponse.json({ error: "Erro ao atualizar pool de estoque", message: e.message }, { status: 500 });
    }
}

// DELETE: Deletar um pool de estoque
const DeletePoolSchema = z.object({
    id: z.string().uuid("O ID do pool é obrigatório."),
});

export async function DELETE(req: NextRequest) {
    try {
        // Verificar autenticação e permissão
        const user = await AuthHybrid.getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        if (!user.profile || user.profile.admin_level !== 'owner') {
            await AuthHybrid.sendSecurityWebhook(req, user, 'Tentativa de deletar pool de estoque não autorizada');
            return NextResponse.json({ 
                error: 'Acesso negado. Apenas o proprietário pode deletar pools de estoque.' 
            }, { status: 403 });
        }

        const body = await req.json();
        const validation = DeletePoolSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: 'Dados inválidos', details: validation.error.flatten() }, { status: 400 });
        }

        const deletedPool = await stockPoolsController.remove(validation.data.id);
        return NextResponse.json(deletedPool, { status: 200 });
    } catch (err) {
        const e = err as Error;
        return NextResponse.json({ error: "Erro ao deletar pool de estoque", message: e.message }, { status: 500 });
    }
}