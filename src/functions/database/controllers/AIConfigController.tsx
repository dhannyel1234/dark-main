import { supabase } from '@/lib/supabase';

// Define ou atualiza uma configuração (upsert)
const set = async (key: string, value: string) => {
    try {
        const { data, error } = await supabase
            .from('ai_configs')
            .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error(`Erro ao definir a configuração para a chave "${key}":`, error);
        throw error;
    }
};

// Obtém o valor de uma configuração específica
const get = async (key: string) => {
    try {
        const { data, error } = await supabase
            .from('ai_configs')
            .select('value')
            .eq('key', key)
            .single();

        if (error) {
            // Se o erro for "PGRST116", significa que nenhuma linha foi encontrada, o que é esperado.
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data?.value;
    } catch (error) {
        console.error(`Erro ao obter a configuração da chave "${key}":`, error);
        throw error;
    }
};

// Obtém todas as configurações
const getAll = async () => {
    try {
        const { data, error } = await supabase
            .from('ai_configs')
            .select('*');

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Erro ao obter todas as configurações:', error);
        throw error;
    }
};

const controller = {
    set,
    get,
    getAll,
};

export default controller;