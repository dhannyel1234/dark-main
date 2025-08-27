import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

// Tipagem para os dados da máquina, alinhada com o schema do Supabase
interface MachineData {
    id?: string;
    created_at?: string;
    name: string;
    surname: string;
    host: 'azure' | 'amazon' | 'google';
    plan_expiration_date: string | null; // ISO 8601 string ou null para disponível
    plan_name: string;
    connect_user: string;
    connect_password: string;
    owner_id: string | null; // UUID do usuário no Supabase ou null para disponível
    opened_invoice: boolean;
}

// Criar ou atualizar uma máquina (upsert)
const create = async (data: Omit<MachineData, 'id' | 'created_at'>) => {
    try {
        const supabase = createAdminClient();
        const { data: machine, error } = await supabase
            .from('machines')
            .insert(data)
            .select()
            .single();

        if (error) throw error;
        return machine;
    } catch (error) {
        console.error('Erro ao criar máquina:', error);
        throw error;
    }
};

// Deletar uma máquina pelo seu nome
const remove = async (name: string) => {
    try {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('machines')
            .delete()
            .eq('name', name)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Erro ao deletar máquina:', error);
        throw error;
    }
};

// Atualizar uma máquina pelo seu nome
const update = async (name: string, updates: Partial<Omit<MachineData, 'id' | 'created_at'>>) => {
    try {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('machines')
            .update(updates)
            .eq('name', name)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Erro ao atualizar máquina:', error);
        throw error;
    }
};

// Encontrar uma máquina pelo seu nome
const find = async (name: string) => {
    try {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('machines')
            .select('*')
            .eq('name', name)
            .maybeSingle();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Erro ao encontrar máquina:', error);
        throw error;
    }
};

// Encontrar todas as máquinas de um usuário específico
const findAllUser = async (ownerId: string) => {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('machines')
            .select('*')
            .eq('owner_id', ownerId);

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Erro ao encontrar máquinas do usuário:', error);
        throw error;
    }
};

// Encontrar todas as máquinas (geralmente para admins)
const findAll = async () => {
    try {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('machines')
            .select('*');

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Erro ao encontrar todas as máquinas:', error);
        throw error;
    }
};

// Buscar uma máquina pelo ID
const findById = async (id: string) => {
    try {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('machines')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Erro ao buscar máquina por ID:', error);
        throw error;
    }
};

const controller = {
    create,
    remove,
    update,
    find,
    findById,
    findAllUser,
    findAll
};

export default controller;