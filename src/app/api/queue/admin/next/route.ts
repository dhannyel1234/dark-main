import { NextRequest, NextResponse } from 'next/server';
import { AuthHybrid } from '@/lib/auth-hybrid';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
    try {
        // 1. Verificar autenticação e permissão
        const user = await AuthHybrid.getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
        }

        if (!user.profile || !['admin', 'owner'].includes(user.profile.admin_level)) {
            await AuthHybrid.sendSecurityWebhook(request, user, 'Tentativa de acesso não autorizado à ativação de fila');
            return NextResponse.json({ success: false, error: 'Acesso negado.' }, { status: 403 });
        }

        // 2. Validar o corpo da requisição
        let machineInfo;
        try {
            machineInfo = await request.json();
            if (!machineInfo.ip || !machineInfo.user || !machineInfo.password || !machineInfo.name || !machineInfo.connectLink) {
                throw new Error('Dados da máquina incompletos.');
            }
        } catch (error) {
            return NextResponse.json({ success: false, error: 'Corpo da requisição inválido ou incompleto.' }, { status: 400 });
        }

        // 3. Criar cliente Supabase para operações específicas da fila
        const supabase = await createClient();

        // 4. Chamar a função do banco de dados
        const { data, error } = await supabase.rpc('activate_next_user', {
            machine_info_payload: machineInfo
        });

        if (error) {
            throw error;
        }
        
        // A função retorna um array com um objeto, então pegamos o primeiro elemento.
        const result = data[0];

        if (!result.success) {
            return NextResponse.json({ success: false, error: result.message }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: result.message,
            user: {
                id: result.activated_user_id,
                name: result.user_name,
                email: result.user_email,
                plan: result.plan_name,
                machineInfo: machineInfo
            }
        });

    } catch (error: any) {
        console.error('Erro ao chamar a função activate_next_user:', error);
        return NextResponse.json({ 
            success: false, 
            error: 'Erro interno do servidor ao ativar usuário.', 
            details: error.message 
        }, { status: 500 });
    }
}