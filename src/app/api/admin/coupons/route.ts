import { NextRequest, NextResponse } from 'next/server';
import { AuthHybrid } from '@/lib/auth-hybrid';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
    try {
        // 1. Verificar autenticação e permissões
        const user = await AuthHybrid.getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const isOwner = await AuthHybrid.isOwner(user.id);
        if (!isOwner) {
            await AuthHybrid.sendSecurityWebhook(request, user, 'Tentativa de acesso à lista de cupons');
            return NextResponse.json({ error: 'Acesso negado. Apenas owners podem gerenciar cupons.' }, { status: 403 });
        }

        // 2. Buscar todos os cupons
        const supabase = await createClient();
        const { data: allCoupons, error } = await supabase
            .from('coupons')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching coupons:', error);
            return NextResponse.json({ error: 'Erro ao buscar cupons' }, { status: 500 });
        }

        return NextResponse.json(allCoupons);

    } catch (error) {
        console.error("Erro ao buscar cupons:", error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        // 1. Verificar autenticação e permissões
        const user = await AuthHybrid.getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const isOwner = await AuthHybrid.isOwner(user.id);
        if (!isOwner) {
            await AuthHybrid.sendSecurityWebhook(request, user, 'Tentativa de criar cupom');
            return NextResponse.json({ error: 'Acesso negado. Apenas owners podem criar cupons.' }, { status: 403 });
        }

        // 2. Obter dados da requisição
        const body = await request.json();
        const {
            code, discount, active, expires_at, usage_limit
        } = body;

        // 3. Validações básicas
        if (!code || discount === undefined) {
            return NextResponse.json({ 
                error: 'Campos obrigatórios: code, discount' 
            }, { status: 400 });
        }

        const supabase = await createClient();

        // 4. Verificar se o código já existe
        const { data: existingCoupon } = await supabase
            .from('coupons')
            .select('id')
            .eq('code', code)
            .single();

        if (existingCoupon) {
            return NextResponse.json({ 
                error: 'Já existe um cupom com este código' 
            }, { status: 409 });
        }

        // 5. Criar o cupom
        const { data: newCoupon, error } = await supabase
            .from('coupons')
            .insert([{
                code: code.toUpperCase(),
                discount: parseInt(discount),
                active: active !== false,
                expires_at: expires_at ? expires_at : null,
                usage_limit: usage_limit || null,
                usage_count: 0
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating coupon:', error);
            return NextResponse.json({ error: 'Erro ao criar cupom' }, { status: 500 });
        }

        // 6. Log de auditoria
        await AuthHybrid.sendSecurityWebhook(request, user, `Cupom criado: ${code}`);

        return NextResponse.json(newCoupon);

    } catch (error) {
        console.error("Erro ao criar cupom:", error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        // 1. Verificar autenticação e permissões
        const user = await AuthHybrid.getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const isOwner = await AuthHybrid.isOwner(user.id);
        if (!isOwner) {
            await AuthHybrid.sendSecurityWebhook(request, user, 'Tentativa de editar cupom');
            return NextResponse.json({ error: 'Acesso negado. Apenas owners podem editar cupons.' }, { status: 403 });
        }

        // 2. Obter dados da requisição
        const body = await request.json();
        const {
            id, code, discount, active, expires_at, usage_limit
        } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID do cupom é obrigatório' }, { status: 400 });
        }

        const supabase = await createClient();

        // 3. Verificar se o cupom existe
        const { data: existingCoupon } = await supabase
            .from('coupons')
            .select('id, code')
            .eq('id', id)
            .single();

        if (!existingCoupon) {
            return NextResponse.json({ error: 'Cupom não encontrado' }, { status: 404 });
        }

        // 4. Se o código mudou, verificar se o novo código já existe
        if (code && code !== existingCoupon.code) {
            const { data: codeExists } = await supabase
                .from('coupons')
                .select('id')
                .eq('code', code)
                .single();

            if (codeExists) {
                return NextResponse.json({ 
                    error: 'Já existe um cupom com este código' 
                }, { status: 409 });
            }
        }

        // 5. Atualizar o cupom
        const updateData: any = {};
        if (code) updateData.code = code.toUpperCase();
        if (discount !== undefined) updateData.discount = parseInt(discount);
        if (active !== undefined) updateData.active = active;
        if (expires_at !== undefined) updateData.expires_at = expires_at ? expires_at : null;
        if (usage_limit !== undefined) updateData.usage_limit = usage_limit;

        const { data: updatedCoupon, error: updateError } = await supabase
            .from('coupons')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (updateError) {
            console.error('Error updating coupon:', updateError);
            return NextResponse.json({ error: 'Erro ao atualizar cupom' }, { status: 500 });
        }

        // 6. Log de auditoria
        await AuthHybrid.sendSecurityWebhook(request, user, `Cupom atualizado: ${updatedCoupon.code}`);

        return NextResponse.json(updatedCoupon);

    } catch (error) {
        console.error("Erro ao atualizar cupom:", error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        // 1. Verificar autenticação e permissões
        const user = await AuthHybrid.getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const isOwner = await AuthHybrid.isOwner(user.id);
        if (!isOwner) {
            await AuthHybrid.sendSecurityWebhook(request, user, 'Tentativa de excluir cupom');
            return NextResponse.json({ error: 'Acesso negado. Apenas owners podem excluir cupons.' }, { status: 403 });
        }

        // 2. Obter ID do cupom
        const { id } = await request.json();
        if (!id) {
            return NextResponse.json({ error: 'ID do cupom é obrigatório' }, { status: 400 });
        }

        const supabase = await createClient();

        // 3. Verificar se o cupom existe e buscar informações
        const { data: existingCoupon } = await supabase
            .from('coupons')
            .select('id, code, usage_count')
            .eq('id', id)
            .single();

        if (!existingCoupon) {
            return NextResponse.json({ error: 'Cupom não encontrado' }, { status: 404 });
        }

        // 4. Verificar se o cupom já foi usado
        if (existingCoupon.usage_count && existingCoupon.usage_count > 0) {
            return NextResponse.json({ 
                error: 'Não é possível excluir um cupom que já foi utilizado' 
            }, { status: 400 });
        }

        // 5. Excluir o cupom
        const { error: deleteError } = await supabase
            .from('coupons')
            .delete()
            .eq('id', id);

        if (deleteError) {
            console.error('Error deleting coupon:', deleteError);
            return NextResponse.json({ error: 'Erro ao excluir cupom' }, { status: 500 });
        }

        // 6. Log de auditoria
        await AuthHybrid.sendSecurityWebhook(request, user, `Cupom excluído: ${existingCoupon.code}`);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Erro ao excluir cupom:", error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}