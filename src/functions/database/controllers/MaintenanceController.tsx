import { createClient } from '@/utils/supabase/server';

// Obter status de manutenção
const getStatus = async () => {
    const supabase = await createClient();
    
    let { data: maintenance, error } = await supabase
        .from('maintenance')
        .select('*')
        .eq('id', 1)
        .single();

    if (error && error.code === 'PGRST116') { // "PGRST116": "The result contains 0 rows"
        // Se não existir, cria o registro padrão
        const { data: newMaintenance, error: insertError } = await supabase
            .from('maintenance')
            .insert({ id: 1, active: 0, message: 'Estamos realizando melhorias em nossos sistemas.' })
            .select()
            .single();
        
        if (insertError) {
            throw insertError;
        }
        maintenance = newMaintenance;
    } else if (error) {
        throw error;
    }
    
    return maintenance;
};

// Atualizar status de manutenção
const updateStatus = async (status: number, message?: string) => {
    const supabase = await createClient();

    const updates: { active: number; message?: string } = { active: status };
    if (message) {
        updates.message = message;
    }

    const { data: maintenance, error } = await supabase
        .from('maintenance')
        .update(updates)
        .eq('id', 1)
        .select()
        .single();

    if (error) {
        // Se o registro não existir, crie-o
        if (error.code === 'PGRST116') {
            const { data: newMaintenance, error: insertError } = await supabase
                .from('maintenance')
                .insert({ id: 1, ...updates })
                .select()
                .single();

            if (insertError) throw insertError;
            return newMaintenance;
        }
        throw error;
    }
    
    return maintenance;
};

const controller = {
    getStatus,
    updateStatus
};

export default controller;