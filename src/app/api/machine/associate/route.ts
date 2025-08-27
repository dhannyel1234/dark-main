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

        // Verificar se é admin
        const isAdmin = await AuthHybrid.isAdmin(user.id);
        if (!isAdmin) {
            await AuthHybrid.sendSecurityWebhook(req, user, 'Tentativa de associar máquina sem permissão de admin');
            return NextResponse.json({ error: "Acesso negado. Apenas admins." }, { status: 403 });
        }

        const { name, surname, host, userId, days, plan } = await req.json();

        // Validar campos obrigatórios
        if (!name || !userId || !days || !plan) {
            return NextResponse.json({ 
                message: "Campos obrigatórios: name, userId (Discord ID), days, plan" 
            }, { status: 400 });
        }

        // Buscar usuário pelo Discord ID
        const { createAdminClient } = await import('@/utils/supabase/admin');
        const adminSupabase = createAdminClient();
        
        let targetUser = null;
        let supabaseUserId = null;

        // Primeiro tentar buscar diretamente pelo ID (se for Supabase UUID)
        try {
            const { data: directUser, error: directError } = await adminSupabase.auth.admin.getUserById(userId);
            if (!directError && directUser.user) {
                targetUser = directUser.user;
                supabaseUserId = directUser.user.id;
                console.log(`✅ Usuário encontrado diretamente pelo ID: ${userId}`);
            }
        } catch (directSearchError) {
            console.log(`❌ Busca direta por ID falhou: ${directSearchError}`);
        }

        // Se não encontrou diretamente, buscar nos metadados do Discord
        if (!targetUser) {
            console.log(`🔍 Buscando usuário pelo Discord ID nos metadados: ${userId}`);
            
            // Buscar em múltiplas páginas para garantir que encontre o usuário
            let allUsers: any[] = [];
            let page = 1;
            let hasMorePages = true;

            while (hasMorePages && page <= 10) { // Limite de 10 páginas por segurança
                const { data: pageData, error: pageError } = await adminSupabase.auth.admin.listUsers({
                    page,
                    perPage: 1000
                });

                if (pageError) {
                    console.error(`Erro na página ${page}:`, pageError);
                    break;
                }

                if (pageData?.users?.length > 0) {
                    allUsers = allUsers.concat(pageData.users);
                    hasMorePages = pageData.users.length === 1000; // Se retornou 1000, pode haver mais
                    page++;
                } else {
                    hasMorePages = false;
                }
            }

            console.log(`📊 Total de usuários carregados: ${allUsers.length}`);

            // Encontrar usuário pelo Discord ID
            targetUser = allUsers.find(user => 
                user.user_metadata?.provider_id === userId || 
                user.user_metadata?.sub === userId ||
                user.id === userId
            );

            if (targetUser) {
                supabaseUserId = targetUser.id;
                console.log(`✅ Usuário encontrado nos metadados: ${targetUser.email}`);
            }
        }

        if (!targetUser) {
            console.error(`❌ Usuário ${userId} não encontrado após busca completa`);
            return NextResponse.json({ 
                message: `Usuário com ID ${userId} não encontrado no sistema` 
            }, { status: 404 });
        }

        // Verificar se a máquina existe e está disponível
        const existingMachine = await machineController.find(name);
        if (!existingMachine) {
            return NextResponse.json({ 
                message: "Máquina não encontrada no sistema. Primeiro registre a VM no sistema." 
            }, { status: 404 });
        }

        // Verificar se a máquina já está associada a outro usuário
        if (existingMachine.owner_id && existingMachine.owner_id !== supabaseUserId && existingMachine.plan_expiration_date && new Date(existingMachine.plan_expiration_date) > new Date()) {
            return NextResponse.json({ 
                message: "Máquina já está associada a outro usuário com plano ativo" 
            }, { status: 409 });
        }

        // Calcular data de expiração
        const now = new Date();
        const expirationDate = new Date(now);
        expirationDate.setDate(now.getDate() + parseInt(days));

        // Dados para associar a máquina ao usuário
        const updateData: any = {
            owner_id: supabaseUserId,
            plan_expiration_date: expirationDate.toISOString(),
            plan_name: plan,
            opened_invoice: false
        };

        // Atualizar campos opcionais se fornecidos
        if (surname) updateData.surname = surname;

        // Associar máquina ao usuário (update)
        const updatedMachine = await machineController.update(name, updateData);

        return NextResponse.json({
            success: true,
            machine: updatedMachine,
            message: `Máquina ${name} associada com sucesso ao usuário ${targetUser.user_metadata?.preferred_username || targetUser.email} (Discord ID: ${userId})`
        }, { status: 200 });

    } catch (error) {
        console.error('Erro ao associar máquina:', error);
        return NextResponse.json({ 
            message: "Erro ao associar máquina", 
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}