import { NextRequest, NextResponse } from 'next/server';
import { AuthHybrid } from '@/lib/auth-hybrid';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
    try {
        // 1. Verificar autenticação
        const user = await AuthHybrid.getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        // 2. Criar cliente Supabase para operações específicas da fila
        const supabase = await createClient();

        // 3. Remover o usuário da fila (apenas se estiver 'waiting')
        const { error: deleteError, count } = await supabase
            .from('queue')
            .delete({ count: 'exact' })
            .eq('user_id', user.id)
            .eq('status', 'waiting');

        if (deleteError) {
            throw deleteError;
        }

        if (count === 0) {
            return NextResponse.json({ error: 'Usuário não encontrado na fila ou já está ativo.' }, { status: 404 });
        }

        // 4. Chamar a função para reordenar a fila
        const { error: rpcError } = await supabase.rpc('reorder_queue');

        if (rpcError) {
            // Se a reordenação falhar, idealmente deveríamos ter uma estratégia de compensação,
            // mas por enquanto, vamos apenas logar o erro. A fila pode ficar com "buracos".
            console.error('Erro crítico ao reordenar a fila:', rpcError);
            // Mesmo com o erro na reordenação, a saída do usuário foi um sucesso.
            return NextResponse.json({ 
                success: true, 
                message: 'Saiu da fila com sucesso, mas a reordenação falhou.' 
            });
        }

        return NextResponse.json({ 
            success: true, 
            message: 'Saiu da fila e a fila foi reordenada com sucesso.' 
        });

    } catch (error: any) {
        console.error('Erro ao sair da fila:', error);
        return NextResponse.json({ error: 'Erro interno do servidor.', details: error.message }, { status: 500 });
    }
}