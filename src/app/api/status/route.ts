import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
    try {
        const supabase = await createClient();
        
        // Tenta fazer uma operação simples para verificar se está realmente conectado
        const { data, error } = await supabase
            .from('maintenance')
            .select('id')
            .limit(1);
        
        if (error) {
            throw error;
        }
        
        return NextResponse.json({
            status: "success",
            message: "Conexão com o Supabase estabelecida com sucesso",
        });
    } catch (error: any) {
        console.error("Erro ao verificar status do Supabase:", error);
        
        return NextResponse.json({
            status: "error",
            message: "Erro ao conectar com o Supabase",
            error: error.message
        }, { status: 500 });
    }
}