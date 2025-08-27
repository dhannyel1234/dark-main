import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import queueController from '@/functions/database/controllers/QueueController';

async function verifyAdmin(supabase: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'Não autorizado', status: 401 };
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('admin_level')
        .eq('id', user.id)
        .single();

    if (!profile || (profile.admin_level !== 'admin' && profile.admin_level !== 'owner')) {
        return { error: 'Acesso negado - Apenas administradores', status: 403 };
    }

    return { user, profile, error: null };
}

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const authResult = await verifyAdmin(supabase);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const result = await queueController.getAllQueueMachines();
        if (!result.success) {
            return NextResponse.json({ error: result.message }, { status: 400 });
        }

        return NextResponse.json(result);

    } catch (error) {
        console.error('Erro ao obter máquinas:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const authResult = await verifyAdmin(supabase);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { name, ip, user, password } = await request.json();

        if (!name || !ip || !user || !password) {
            return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
        }

        const result = await queueController.addQueueMachine(name, ip, user, password);
        if (!result.success) {
            return NextResponse.json({ error: result.message }, { status: 400 });
        }

        return NextResponse.json(result);

    } catch (error) {
        console.error('Erro ao adicionar máquina:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient();
        const authResult = await verifyAdmin(supabase);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { ip } = await request.json();

        if (!ip) {
            return NextResponse.json({ error: 'IP não fornecido' }, { status: 400 });
        }

        const result = await queueController.removeQueueMachine(ip);
        if (!result.success) {
            return NextResponse.json({ error: result.message }, { status: 400 });
        }

        return NextResponse.json(result);

    } catch (error) {
        console.error('Erro ao remover máquina:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}