import { NextRequest, NextResponse } from 'next/server';
import { AuthHybrid } from '@/lib/auth-hybrid';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
    try {
        // 1. Verificar autenticação e permissão
        const user = await AuthHybrid.getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        if (!user.profile || user.profile.admin_level !== 'owner') {
            await AuthHybrid.sendSecurityWebhook(request, user, 'Tentativa de alterar permissões sem ser owner');
            return NextResponse.json({ 
                error: 'Acesso negado. Apenas o owner pode alterar permissões.' 
            }, { status: 403 });
        }

        // 2. Obter dados do corpo da requisição
        const { userId, level } = await request.json();

        if (!userId || !level) {
            return NextResponse.json({ error: 'Parâmetros userId e level são obrigatórios.' }, { status: 400 });
        }

        if (!['user', 'admin', 'owner'].includes(level)) {
            return NextResponse.json({ error: 'Nível de permissão inválido.' }, { status: 400 });
        }

        const supabase = await createClient();

        // 3. Verificar se o alvo é um owner
        const { data: targetProfile } = await supabase
            .from('profiles')
            .select('admin_level')
            .eq('id', userId)
            .single();

        if (targetProfile?.admin_level === 'owner') {
            return NextResponse.json({ 
                error: 'Não é possível alterar o nível de permissão de um owner.' 
            }, { status: 403 });
        }

        // 4. Atualizar o nível de permissão do usuário alvo
        const { data: updatedProfile, error: updateError } = await supabase
            .from('profiles')
            .update({ 
                admin_level: level as 'user' | 'admin' | 'owner',
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select()
            .single();

        if (updateError) {
            console.error('Error updating profile:', updateError);
            return NextResponse.json({ 
                error: 'Usuário não encontrado.' 
            }, { status: 404 });
        }

        return NextResponse.json({ 
            message: 'Nível de permissão atualizado com sucesso.', 
            profile: updatedProfile 
        });

    } catch (error) {
        console.error('Erro ao definir nível de permissão:', error);
        return NextResponse.json(
            { error: 'Erro interno ao definir nível de permissão.' },
            { status: 500 }
        );
    }
}