import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

interface PlanData {
    id?: string;
    name: string;
    price: number;
    duration_days?: number | null;
    duration_type?: 'days' | 'hours';
    order?: number;
    limited_session?: boolean;
    saves_files?: boolean;
    has_queue?: boolean;
    description?: string | null;
    is_active?: boolean;
    stock_quantity?: number;
    individual_stock?: number;
    provisioning_type?: 'automatico' | 'individual' | 'queue_manual' | 'queue_auto';
    stock_pool_id?: string | null;
    highlight_color?: string | null;
    vm_config?: any;
    session_duration_minutes?: number;
    max_concurrent_sessions?: number;
}

// Criar um novo plano
const create = async (data: Omit<PlanData, 'id'>) => {
    try {
        const supabase = createAdminClient();
        const { data: plan, error } = await supabase
            .from('plans')
            .insert(data)
            .select()
            .single();
        if (error) throw error;
        return plan;
    } catch (error) {
        console.error('Erro ao criar plano:', error);
        throw error;
    }
};

// Listar todos os planos (para admin)
const findAll = async () => {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('plans')
            .select('*')
            .order('order', { ascending: true })
            .order('price', { ascending: true });
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Erro ao listar todos os planos:', error);
        throw error;
    }
};

// Listar apenas planos ativos (para clientes)
const findActive = async () => {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('plans')
            .select('*')
            .eq('is_active', true)
            .order('order', { ascending: true })
            .order('price', { ascending: true });
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Erro ao listar planos ativos:', error);
        throw error;
    }
};

// Listar planos ativos com estoque calculado dinamicamente
const findActiveWithStock = async () => {
    try {
        const supabase = await createClient();
        
        // Buscar planos ativos
        const { data: plans, error: plansError } = await supabase
            .from('plans')
            .select('*')
            .eq('is_active', true)
            .order('order', { ascending: true })
            .order('price', { ascending: true });
        
        if (plansError) throw plansError;
        
        // Calcular estoque para cada plano baseado no provisioning_type
        const plansWithStock = await Promise.all(plans.map(async (plan) => {
            let stock = 0;
            
            switch (plan.provisioning_type) {
                case 'individual':
                    // Estoque individual - usar o campo individual_stock
                    stock = plan.individual_stock || 0;
                    break;
                    
                case 'queue_manual':
                case 'queue_auto':
                    // Estoque baseado no pool - buscar disponibilidade do pool
                    if (plan.stock_pool_id) {
                        const { data: stockPool, error: poolError } = await supabase
                            .from('stock_pools')
                            .select('quantity')
                            .eq('id', plan.stock_pool_id)
                            .single();
                        
                        if (!poolError && stockPool) {
                            stock = stockPool.quantity || 0;
                        } else {
                            // Pool não encontrado ou erro - sem estoque
                            stock = 0;
                        }
                    } else {
                        // Se não há pool definido para fila, verificar VMs disponíveis
                        const { data: availableVMs, error: vmError } = await supabase
                            .from('machines')
                            .select('id')
                            .or('owner_id.is.null,plan_name.eq.Disponível')
                            .eq('host', 'azure');
                        
                        if (!vmError && availableVMs) {
                            stock = availableVMs.length;
                        } else {
                            stock = 0;
                        }
                    }
                    break;
                    
                case 'automatico':
                    // Tipo legado 'automatico' - tratar como individual
                    stock = plan.individual_stock || 0;
                    break;
                    
                default:
                    // Tipo desconhecido - verificar se há estoque individual definido
                    stock = plan.individual_stock || 0;
                    break;
            }
            
            return {
                ...plan,
                stock: stock
            };
        }));
        
        return plansWithStock;
    } catch (error) {
        console.error('Erro ao listar planos ativos com estoque:', error);
        throw error;
    }
};

// Atualizar um plano
const update = async (id: string, updates: Partial<Omit<PlanData, 'id'>>) => {
    try {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('plans')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Erro ao atualizar plano:', error);
        throw error;
    }
};

// Deletar (soft delete) um plano, marcando-o como inativo
const remove = async (id: string) => {
    try {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('plans')
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Erro ao deletar plano:', error);
        throw error;
    }
};

const controller = {
    create,
    findAll,
    findActive,
    findActiveWithStock,
    update,
    remove,
};

export default controller;