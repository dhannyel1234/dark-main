import { supabase } from '@/lib/supabase';

interface StockPoolData {
    id?: string;
    name: string;
    quantity: number;
}

// Criar um novo pool de estoque
const create = async (data: Omit<StockPoolData, 'id'>) => {
    try {
        const { data: pool, error } = await supabase
            .from('stock_pools')
            .insert(data)
            .select()
            .single();
        if (error) throw error;
        return pool;
    } catch (error) {
        console.error('Erro ao criar pool de estoque:', error);
        throw error;
    }
};

// Listar todos os pools de estoque
const findAll = async () => {
    try {
        const { data, error } = await supabase
            .from('stock_pools')
            .select('*');
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Erro ao listar pools de estoque:', error);
        throw error;
    }
};

// Atualizar um pool de estoque
const update = async (id: string, updates: Partial<Omit<StockPoolData, 'id'>>) => {
    try {
        const { data, error } = await supabase
            .from('stock_pools')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Erro ao atualizar pool de estoque:', error);
        throw error;
    }
};

// Deletar um pool de estoque
const remove = async (id: string) => {
    try {
        // Antes de deletar, desassociar todos os planos que usam este pool
        const { error: updateError } = await supabase
            .from('plans')
            .update({ stock_pool_id: null })
            .eq('stock_pool_id', id);

        if (updateError) {
            console.error('Erro ao desassociar planos do pool de estoque:', updateError);
            // Decidir se deve continuar ou lançar o erro. Por segurança, vamos parar.
            throw new Error(`Falha ao desassociar planos: ${updateError.message}`);
        }

        const { data, error } = await supabase
            .from('stock_pools')
            .delete()
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Erro ao deletar pool de estoque:', error);
        throw error;
    }
};


const controller = {
    create,
    findAll,
    update,
    remove,
};

export default controller;