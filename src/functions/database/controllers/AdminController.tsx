import { supabase } from '@/lib/supabase'; // Usamos o cliente de serviço para operações de backend

type AdminLevel = 'user' | 'admin' | 'owner';

// Encontrar um perfil de usuário pelo seu ID
const findProfileById = async (userId: string) => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Erro ao buscar perfil:', error);
        throw error;
    }
};

// Listar todos os perfis que são admin ou owner
const findAllAdmins = async () => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, discord_username, admin_level')
            .in('admin_level', ['admin', 'owner']);

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Erro ao listar admins:', error);
        throw error;
    }
};

// Definir o nível de permissão de um usuário
const setAdminLevel = async (userId: string, level: AdminLevel) => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .update({ admin_level: level, updated_at: new Date().toISOString() })
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error(`Erro ao definir nível de admin para ${level}:`, error);
        throw error;
    }
};

const controller = {
    findProfileById,
    findAllAdmins,
    setAdminLevel,
};

export default controller;