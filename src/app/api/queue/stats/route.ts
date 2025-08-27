import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import queueController from '@/functions/database/controllers/QueueController';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        // Obter estatísticas da fila
        const result = await queueController.getQueueStats();
        if (!result.success) {
            return NextResponse.json({ error: result.message }, { status: 400 });
        }

        return NextResponse.json(result);

    } catch (error) {
        console.error('Erro ao obter estatísticas da fila:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
} 