import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// controllers
import invoiceController from '@/functions/database/controllers/InvoiceController';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('admin_level')
            .eq('id', user.id)
            .single();

        if (profile?.admin_level !== 'owner' && profile?.admin_level !== 'admin') {
            return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
        }
        
        const { name } = await req.json();
        if (!name) {
            return NextResponse.json(
                {
                    message: "Name not found in json",
                    support: "@sb4z7"
                },
                { status: 400 }
            );
        };

        const dbInvoice = await invoiceController.remove(name);
        return NextResponse.json(dbInvoice, { status: 200 });
    } catch (err) {
        return NextResponse.json(
            {
                message: "Error when removing invoice",
                support: '@sb4z7'
            },
            { status: 500 }
        );
    };
};