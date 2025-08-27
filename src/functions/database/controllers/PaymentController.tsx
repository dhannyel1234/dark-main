import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

// Tipagem para os dados de pagamento, alinhada com o schema do Supabase
interface PaymentData {
    id?: number;
    custom_id?: string;
    payment_id?: string;
    email?: string;
    plan_id?: number;
    checked_all?: boolean;
    machine_created?: boolean;
    timeout_id?: string;
    coupon_id?: number;
    discount_percent?: number;
    br_code?: string;
    qr_code_image?: string;
    price?: number;
    user_id: string; // UUID do usuário no Supabase
    user_name: string;
    status?: 'pending' | 'completed' | 'failed';
    expires_at?: string; // ISO 8601 string
    created_at?: string;
    updated_at?: string;
}

// Criar um novo pagamento
const create = async (data: Omit<PaymentData, 'id' | 'created_at' | 'updated_at'>) => {
    try {
        const adminSupabase = createAdminClient(); // Use admin for creating payments
        const { data: payment, error } = await adminSupabase
            .from('payments')
            .insert(data)
            .select()
            .single();

        if (error) throw error;
        console.log('✅ Pagamento salvo:', payment);
        return payment;
    } catch (error) {
        console.error('❌ Erro ao salvar pagamento:', error);
        throw error;
    }
};

// Encontrar um pagamento pelo custom_id
const find = async (customId: string) => {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('payments')
            .select('*')
            .eq('custom_id', customId)
            .single();

        if (error) {
            // O Supabase retorna um erro se nenhum registro for encontrado com .single()
            if (error.code === 'PGRST116') {
                return null; // Retorna nulo para ser consistente com o comportamento do findOne do Mongoose
            }
            throw error;
        }
        return data;
    } catch (error) {
        console.error('❌ Erro ao buscar pagamento:', error);
        throw error;
    }
};

// Deletar um pagamento pelo custom_id
const remove = async (customId: string) => {
    try {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('payments')
            .delete()
            .eq('custom_id', customId)
            .select()
            .single();
            
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('❌ Erro ao remover pagamento:', error);
        throw error;
    }
};

// Atualizar um pagamento pelo custom_id
const update = async (customId: string, updates: Partial<Omit<PaymentData, 'id' | 'created_at'>>) => {
    try {
        console.log('📝 Atualizando pagamento:', { customId, updates });
        const adminSupabase = createAdminClient(); // Use admin for updates
        const { data, error } = await adminSupabase
            .from('payments')
            .update(updates)
            .eq('custom_id', customId)
            .select()
            .single();

        if (error) throw error;
        console.log('✅ Pagamento atualizado:', data);
        return data;
    } catch (error) {
        console.error('❌ Erro ao atualizar pagamento:', error);
        throw error;
    }
};

// Buscar pagamento por payment_id
const findByPaymentId = async (paymentId: string) => {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('payments')
            .select('*')
            .eq('payment_id', paymentId)
            .single();
            
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('❌ Erro ao buscar pagamento por payment_id:', error);
        return null;
    }
};

// Processar webhook de pagamento
const processWebhookPayment = async (paymentId: string, webhookData: any) => {
    try {
        const adminSupabase = createAdminClient(); // Use admin for webhook processing
        
        // 1. Atualizar status do pagamento
        const { data: updatedPayment, error } = await adminSupabase
            .from('payments')
            .update({
                status: 'completed', // Webhook só é chamado para pagamentos bem-sucedidos
                updated_at: new Date().toISOString()
            })
            .eq('payment_id', paymentId)
            .select()
            .single();

        if (error) throw error;

        // 2. Criar assinatura de plano para o usuário
        const userPlanController = await import('./UserPlanController');
        const userPlan = await userPlanController.default.createFromPayment({
            user_id: updatedPayment.user_id,
            plan_id: updatedPayment.plan_id.toString(),
            payment_id: updatedPayment.payment_id,
            payment_value: updatedPayment.price.toString()
        });

        console.log(`✅ User plan criado com sucesso para usuário ${updatedPayment.user_id}`);

        return {
            payment: updatedPayment,
            userPlan: userPlan
        };
    } catch (error) {
        console.error('❌ Erro ao processar webhook:', error);
        throw error;
    }
};

const paymentController = {
    create,
    find,
    remove,
    update,
    findByPaymentId,
    processWebhookPayment
};

export default paymentController;