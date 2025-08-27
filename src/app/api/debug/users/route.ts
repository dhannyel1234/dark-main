import { NextRequest, NextResponse } from 'next/server';
import { AuthHybrid } from '@/lib/auth-hybrid';
import { createAdminClient } from '@/utils/supabase/admin';

export async function GET(req: NextRequest) {
    try {
        console.log('🔍 DEBUG: Testando UsersController.findAll()');
        
        // 1. Verificar usuário autenticado
        const user = await AuthHybrid.getAuthenticatedUser();
        console.log('User:', user?.id, user?.profile?.admin_level);
        
        if (!user) {
            return NextResponse.json({ error: 'Não autenticado' });
        }

        // 2. Testar admin client
        const supabase = createAdminClient();
        
        // 3. Testar cada operação individualmente
        console.log('🔧 Testando listUsers...');
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
        if (authError) {
            console.error('❌ Erro listUsers:', authError);
            return NextResponse.json({ 
                error: 'Erro em listUsers', 
                details: authError.message,
                code: authError.code 
            });
        }
        console.log(`✅ listUsers OK - ${authUsers.users.length} usuários`);

        console.log('👤 Testando profiles...');
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('*');
        if (profilesError) {
            console.error('❌ Erro profiles:', profilesError);
            return NextResponse.json({ 
                error: 'Erro em profiles', 
                details: profilesError.message,
                code: profilesError.code 
            });
        }
        console.log(`✅ profiles OK - ${profiles?.length || 0} profiles`);

        console.log('📋 Testando user_plans...');
        const { data: userPlans, error: plansError } = await supabase
            .from('user_plans')
            .select('user_id')
            .eq('status', 'active');
        if (plansError) {
            console.error('❌ Erro user_plans:', plansError);
            return NextResponse.json({ 
                error: 'Erro em user_plans', 
                details: plansError.message,
                code: plansError.code 
            });
        }
        console.log(`✅ user_plans OK - ${userPlans?.length || 0} planos`);

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                admin_level: user.profile?.admin_level
            },
            counts: {
                authUsers: authUsers.users.length,
                profiles: profiles?.length || 0,
                userPlans: userPlans?.length || 0
            }
        });

    } catch (error) {
        console.error('💥 Erro completo:', error);
        return NextResponse.json({ 
            error: 'Erro interno',
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        });
    }
}