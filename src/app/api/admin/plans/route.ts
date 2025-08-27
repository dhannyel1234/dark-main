import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createClient } from '@/utils/supabase/middleware';
import adminController from '@/functions/database/controllers/AdminController';
import plansController from '@/functions/database/controllers/PlansController';
import { sendSecurityWebhook } from '@/lib/discord';

// Middleware de verificação de Owner
async function verifyOwner(req: NextRequest) {
    const { supabase } = createClient(req);
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
        return { error: 'Não autenticado', status: 401, user: null };
    }

    const user = session.user;
    const profile = await adminController.findProfileById(user.id);

    if (!profile || profile.admin_level !== 'owner') {
        await sendSecurityWebhook({
            title: "Acesso Não Autorizado ao Gerenciamento de Planos",
            user,
            request: req,
        });
        return { error: 'Acesso não autorizado. Apenas o proprietário pode gerenciar planos.', status: 403, user };
    }

    return { error: null, status: 200, user };
}

// GET: Listar todos os planos (para o painel de admin)
export async function GET(req: NextRequest) {
    const { error, status } = await verifyOwner(req);
    if (error) {
        return NextResponse.json({ error }, { status });
    }

    try {
        const plans = await plansController.findAll();
        return NextResponse.json(plans, { status: 200 });
    } catch (err) {
        const e = err as Error;
        return NextResponse.json({ error: "Erro ao buscar planos", message: e.message }, { status: 500 });
    }
}

// Schema para criação e atualização de planos
const PlanSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."),
    price: z.number().min(0, "O preço deve ser positivo."),
    duration_days: z.number().int().min(1).nullable().optional(),
    duration_type: z.enum(['days', 'hours']).optional(),
    order: z.number().int().min(0).optional(),
    limited_session: z.boolean().optional(),
    saves_files: z.boolean().optional(),
    has_queue: z.boolean().optional(),
    description: z.string().nullable().optional(),
    is_active: z.boolean().optional(),
    individual_stock: z.number().int().min(0).optional(),
    provisioning_type: z.enum(['individual', 'queue_manual', 'queue_auto']),
    stock_pool_id: z.string().uuid().nullable().optional(),
    highlight_color: z.string().nullable().optional(),
    vm_config: z.any().optional(),
    // Configurações para fila automática
    session_duration_minutes: z.number().int().min(5).optional(),
    queue_auto_enabled: z.boolean().optional(),
    spot_warning_minutes: z.number().int().min(1).optional(),
});

// POST: Criar um novo plano
export async function POST(req: NextRequest) {
    const { error, status } = await verifyOwner(req);
    if (error) {
        return NextResponse.json({ error }, { status });
    }

    const body = await req.json();
    const validation = PlanSchema.omit({ id: true }).safeParse(body);

    if (!validation.success) {
        return NextResponse.json({ error: 'Dados inválidos', details: validation.error.flatten() }, { status: 400 });
    }

    try {
        // Converter null para undefined e ajustar tipos para compatibilidade com Supabase
        const planData = {
            ...validation.data,
            price: validation.data.price.toString(), // Controller espera string
            description: validation.data.description ?? undefined,
            duration_days: validation.data.duration_days ?? undefined,
            duration_type: validation.data.duration_type ?? 'days',
            order: validation.data.order ?? 0,
            limited_session: validation.data.limited_session ?? true,
            saves_files: validation.data.saves_files ?? false,
            has_queue: validation.data.has_queue ?? true,
            stock_pool_id: validation.data.stock_pool_id ?? undefined,
            highlight_color: validation.data.highlight_color ?? undefined,
            vm_config: {
                session_duration_minutes: validation.data.session_duration_minutes,
                queue_auto_enabled: validation.data.queue_auto_enabled,
                spot_warning_minutes: validation.data.spot_warning_minutes
            }
        };
        
        const newPlan = await plansController.create(planData as any);
        return NextResponse.json(newPlan, { status: 201 });
    } catch (err) {
        const e = err as Error;
        return NextResponse.json({ error: "Erro ao criar plano", message: e.message }, { status: 500 });
    }
}

// PUT: Atualizar um plano existente
export async function PUT(req: NextRequest) {
    const { error, status } = await verifyOwner(req);
    if (error) {
        return NextResponse.json({ error }, { status });
    }

    const body = await req.json();
    
    // Schema para atualizações - aceitar ID como string ou número e converter para string
    const UpdatePlanSchema = z.object({
        id: z.union([z.string(), z.number()]).transform(val => String(val)),
        is_active: z.boolean().optional(),
        name: z.string().optional(),
        price: z.number().optional(),
        duration_days: z.number().nullable().optional(),
        duration_type: z.enum(['days', 'hours']).optional(),
        order: z.number().int().min(0).optional(),
        limited_session: z.boolean().optional(),
        saves_files: z.boolean().optional(),
        has_queue: z.boolean().optional(),
        description: z.string().nullable().optional(),
        individual_stock: z.number().optional(),
        provisioning_type: z.enum(['individual', 'queue_manual', 'queue_auto']).optional(),
        stock_pool_id: z.string().nullable().optional(),
        highlight_color: z.string().nullable().optional(),
        vm_config: z.any().optional(),
        session_duration_minutes: z.number().optional(),
        queue_auto_enabled: z.boolean().optional(),
        spot_warning_minutes: z.number().optional(),
    });
    
    const validation = UpdatePlanSchema.safeParse(body);
    
    if (!validation.success) {
        return NextResponse.json({ error: 'Dados inválidos', details: validation.error.flatten() }, { status: 400 });
    }
    
    const { id, ...rawUpdates } = validation.data;
    
    // Converter null para undefined e ajustar tipos para compatibilidade
    const updates: any = {
        price: rawUpdates.price?.toString(),
        description: rawUpdates.description ?? undefined,
        duration_days: rawUpdates.duration_days ?? undefined,
        duration_type: rawUpdates.duration_type ?? undefined,
        order: rawUpdates.order ?? undefined,
        limited_session: rawUpdates.limited_session ?? undefined,
        saves_files: rawUpdates.saves_files ?? undefined,
        has_queue: rawUpdates.has_queue ?? undefined,
        stock_pool_id: rawUpdates.stock_pool_id ?? undefined,
        highlight_color: rawUpdates.highlight_color ?? undefined,
    };

    // Adicionar outros campos se fornecidos (exceto os campos do vm_config)
    if (rawUpdates.is_active !== undefined) updates.is_active = rawUpdates.is_active;
    if (rawUpdates.name !== undefined) updates.name = rawUpdates.name;
    if (rawUpdates.individual_stock !== undefined) updates.individual_stock = rawUpdates.individual_stock;
    if (rawUpdates.provisioning_type !== undefined) updates.provisioning_type = rawUpdates.provisioning_type;

    // Construir vm_config se algum dos campos de configuração foi fornecido
    if (rawUpdates.session_duration_minutes !== undefined || 
        rawUpdates.queue_auto_enabled !== undefined || 
        rawUpdates.spot_warning_minutes !== undefined || 
        rawUpdates.vm_config !== undefined) {
        
        // Primeiro, buscar o vm_config atual se existir
        try {
            const { supabase } = createClient(req);
            const { data: currentPlan } = await supabase
                .from('plans')
                .select('vm_config')
                .eq('id', id)
                .single();

            const currentVmConfig = currentPlan?.vm_config || {};
            
            updates.vm_config = {
                ...currentVmConfig,
                ...(rawUpdates.vm_config || {}),
                ...(rawUpdates.session_duration_minutes !== undefined && { session_duration_minutes: rawUpdates.session_duration_minutes }),
                ...(rawUpdates.queue_auto_enabled !== undefined && { queue_auto_enabled: rawUpdates.queue_auto_enabled }),
                ...(rawUpdates.spot_warning_minutes !== undefined && { spot_warning_minutes: rawUpdates.spot_warning_minutes }),
            };
        } catch (error) {
            console.error('Erro ao buscar vm_config atual:', error);
            // Fallback: criar novo vm_config
            updates.vm_config = {
                ...(rawUpdates.vm_config || {}),
                ...(rawUpdates.session_duration_minutes !== undefined && { session_duration_minutes: rawUpdates.session_duration_minutes }),
                ...(rawUpdates.queue_auto_enabled !== undefined && { queue_auto_enabled: rawUpdates.queue_auto_enabled }),
                ...(rawUpdates.spot_warning_minutes !== undefined && { spot_warning_minutes: rawUpdates.spot_warning_minutes }),
            };
        }
    }

    try {
        const updatedPlan = await plansController.update(id, updates as any);
        return NextResponse.json(updatedPlan, { status: 200 });
    } catch (err) {
        const e = err as Error;
        return NextResponse.json({ error: "Erro ao atualizar plano", message: e.message }, { status: 500 });
    }
}

// DELETE: Desativar um plano (soft delete)
const DeletePlanSchema = z.object({
    id: z.string().uuid("O ID do plano é obrigatório."),
});

export async function DELETE(req: NextRequest) {
    const { error, status } = await verifyOwner(req);
    if (error) {
        return NextResponse.json({ error }, { status });
    }

    const body = await req.json();
    const validation = DeletePlanSchema.safeParse(body);

    if (!validation.success) {
        return NextResponse.json({ error: 'Dados inválidos', details: validation.error.flatten() }, { status: 400 });
    }

    try {
        const deletedPlan = await plansController.remove(validation.data.id);
        return NextResponse.json(deletedPlan, { status: 200 });
    } catch (err) {
        const e = err as Error;
        return NextResponse.json({ error: "Erro ao desativar plano", message: e.message }, { status: 500 });
    }
}