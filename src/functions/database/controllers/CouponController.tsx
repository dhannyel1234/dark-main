import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

type CouponData = {
    code: string;
    discount: number;
    active?: boolean;
    expires_at?: string | null;
    usage_limit?: number | null;
    usage_count?: number;
};

// Criar um novo cupom
const create = async (data: CouponData) => {
    try {
        const supabase = await createClient();
        const { data: result, error } = await supabase
            .from('coupons')
            .insert(data)
            .select()
            .single();

        if (error) throw error;
        return result;
    } catch (error) {
        console.error('Erro ao criar cupom:', error);
        throw error;
    }
};

// Encontrar um cupom por um filtro (ex: { code: 'MEUCUPOM' })
const find = async (filter: Partial<CouponData>) => {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('coupons')
            .select('*')
            .match(filter)
            .maybeSingle(); // Retorna um único resultado ou null

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Erro ao buscar cupom:', error);
        throw error;
    }
};

// Encontrar todos os cupons
const findAll = async () => {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('coupons')
            .select('*');

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Erro ao buscar todos os cupons:', error);
        throw error;
    }
};

// Atualizar um cupom
const update = async (filter: Partial<CouponData>, updates: Partial<CouponData>) => {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('coupons')
            .update(updates)
            .match(filter)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Erro ao atualizar cupom:', error);
        throw error;
    }
};

// Remover um cupom
const remove = async (filter: Partial<CouponData>) => {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('coupons')
            .delete()
            .match(filter);

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Erro ao remover cupom:', error);
        throw error;
    }
};

const couponController = { create, find, findAll, update, remove };
export default couponController;