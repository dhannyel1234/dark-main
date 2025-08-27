import { NextRequest, NextResponse } from 'next/server';
import { AuthHybrid } from '@/lib/auth-hybrid';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

export async function POST(request: NextRequest) {
    try {
        // Verificar autenticação e permissões
        const user = await AuthHybrid.getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const isAdmin = await AuthHybrid.isAdmin(user.id);
        if (!isAdmin) {
            return NextResponse.json({ error: 'Acesso negado. Apenas admins.' }, { status: 403 });
        }

        const { userIds } = await request.json();

        if (!Array.isArray(userIds) || userIds.length === 0) {
            return NextResponse.json({ userNames: {} });
        }

        console.log(`🔍 Buscando nomes para usuarios: ${userIds.join(', ')}`);

        const userNames: Record<string, string> = {};

        // 1. Primeiro, buscar na tabela profiles
        const supabase = await createClient();
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, discord_username, discord_global_name, full_name, email')
            .in('id', userIds);

        if (profiles) {
            profiles.forEach(profile => {
                const displayName = profile.discord_global_name || 
                                  profile.discord_username || 
                                  profile.full_name || 
                                  profile.email?.split('@')[0] || 
                                  profile.id;
                userNames[profile.id] = displayName;
                console.log(`👤 Profile ${profile.id}: ${displayName}`);
            });
        }

        // 2. Para IDs não encontrados, tentar buscar no auth (apenas owner)
        const missingIds = userIds.filter(id => !userNames[id]);
        if (missingIds.length > 0 && user.profile?.admin_level === 'owner') {
            const adminSupabase = createAdminClient();
            
            for (const userId of missingIds) {
                try {
                    const { data: { user: authUser }, error } = await adminSupabase.auth.admin.getUserById(userId);
                    if (authUser && !error) {
                        const displayName = authUser.user_metadata?.full_name ||
                                          authUser.user_metadata?.user_name ||
                                          authUser.user_metadata?.name ||
                                          authUser.email?.split('@')[0] ||
                                          `User-${userId.substring(0, 8)}`;
                        userNames[userId] = displayName;
                        console.log(`👤 Auth ${userId}: ${displayName}`);
                    }
                } catch (authError) {
                    console.error(`Erro ao buscar auth user ${userId}:`, authError);
                    userNames[userId] = `User-${userId.substring(0, 8)}`;
                }
            }
        }

        // 3. Para qualquer ID ainda não encontrado, usar fallback
        userIds.forEach(userId => {
            if (!userNames[userId]) {
                userNames[userId] = `User-${userId.substring(0, 8)}`;
            }
        });

        console.log(`✅ Nomes encontrados:`, userNames);

        return NextResponse.json({ userNames });

    } catch (error) {
        console.error('Erro ao buscar nomes de usuários:', error);
        return NextResponse.json({ 
            error: 'Erro interno do servidor',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}