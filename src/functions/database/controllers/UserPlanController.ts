import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

class UserPlanController {
    private async getSupabase() { return await createClient(); }
    private getAdminSupabase() { return createAdminClient(); }

    async createFromPayment(payment: {
        user_id: string;
        plan_id: string;
        payment_id: string;
        payment_value: string;
    }) {
        try {
            // Get plan details to calculate expiration and handle stock
            const supabase = await this.getSupabase();
            const { data: plan } = await supabase
                .from('plans')
                .select('duration_days, provisioning_type, individual_stock, stock_pool_id')
                .eq('id', parseInt(payment.plan_id))
                .single();

            if (!plan) {
                throw new Error(`Plan ${payment.plan_id} not found`);
            }

            // Calculate expiration date
            const activationDate = new Date();
            const expirationDate = new Date();
            expirationDate.setDate(activationDate.getDate() + (plan.duration_days || 30));

            // Handle stock decrease based on provisioning type
            const adminSupabase = this.getAdminSupabase();
            
            switch (plan.provisioning_type) {
                case 'individual':
                case 'automatico': // Legacy type
                    // Decrease individual stock
                    if (plan.individual_stock > 0) {
                        const { error: stockError } = await adminSupabase
                            .from('plans')
                            .update({ 
                                individual_stock: plan.individual_stock - 1,
                                updated_at: new Date().toISOString()
                            })
                            .eq('id', parseInt(payment.plan_id));
                        
                        if (stockError) {
                            console.error('Error decreasing individual stock:', stockError);
                            throw new Error('Failed to update stock');
                        }
                        
                        console.log(`✅ Individual stock decreased for plan ${payment.plan_id}: ${plan.individual_stock} -> ${plan.individual_stock - 1}`);
                    } else {
                        console.warn(`⚠️ Plan ${payment.plan_id} has no individual stock available`);
                    }
                    break;
                    
                case 'queue_manual':
                case 'queue_auto':
                    // Decrease stock pool quantity if plan uses a pool
                    if (plan.stock_pool_id) {
                        const { data: stockPool, error: poolFetchError } = await adminSupabase
                            .from('stock_pools')
                            .select('quantity')
                            .eq('id', plan.stock_pool_id)
                            .single();
                        
                        if (poolFetchError || !stockPool) {
                            console.error('Error fetching stock pool:', poolFetchError);
                            throw new Error('Stock pool not found');
                        }
                        
                        if (stockPool.quantity > 0) {
                            const { error: poolUpdateError } = await adminSupabase
                                .from('stock_pools')
                                .update({ quantity: stockPool.quantity - 1 })
                                .eq('id', plan.stock_pool_id);
                            
                            if (poolUpdateError) {
                                console.error('Error decreasing pool stock:', poolUpdateError);
                                throw new Error('Failed to update pool stock');
                            }
                            
                            console.log(`✅ Pool stock decreased for plan ${payment.plan_id}: ${stockPool.quantity} -> ${stockPool.quantity - 1}`);
                        } else {
                            console.warn(`⚠️ Stock pool ${plan.stock_pool_id} has no quantity available`);
                        }
                    }
                    break;
                    
                default:
                    console.warn(`⚠️ Unknown provisioning type: ${plan.provisioning_type}`);
                    break;
            }

            // Create user plan using admin client (bypass RLS)
            const { data: userPlan, error } = await adminSupabase
                .from('user_plans')
                .insert([{
                    user_id: payment.user_id,
                    plan_id: parseInt(payment.plan_id),
                    status: 'active',
                    activated_at: activationDate.toISOString(),
                    expires_at: expirationDate.toISOString(),
                    charge_id: payment.payment_id,
                    payment_value: payment.payment_value
                }])
                .select()
                .single();

            if (error) {
                throw error;
            }

            console.log(`✅ User plan created successfully for user ${payment.user_id}, plan ${payment.plan_id}`);
            return userPlan;
        } catch (error) {
            console.error('Error creating user plan from payment:', error);
            throw error;
        }
    }

    async getUserActivePlans(userId: string) {
        const supabase = await this.getSupabase();
        const { data: userPlans, error } = await supabase
            .from('user_plans')
            .select(`
                *,
                plans:plan_id (
                    id,
                    name,
                    price,
                    duration_days,
                    description,
                    provisioning_type
                )
            `)
            .eq('user_id', userId)
            .eq('status', 'active')
            .gte('expires_at', new Date().toISOString());

        if (error) {
            console.error('Error fetching user active plans:', error);
            return [];
        }

        return userPlans || [];
    }

    async getUserExpiredPlans(userId: string) {
        const supabase = await this.getSupabase();
        const { data: userPlans, error } = await supabase
            .from('user_plans')
            .select(`
                *,
                plans:plan_id (
                    id,
                    name,
                    price,
                    duration_days,
                    description,
                    provisioning_type
                )
            `)
            .eq('user_id', userId)
            .eq('status', 'expired');

        if (error) {
            console.error('Error fetching user expired plans:', error);
            return [];
        }

        return userPlans || [];
    }

    async getAllUserPlans(userId: string) {
        const supabase = await this.getSupabase();
        const { data: userPlans, error } = await supabase
            .from('user_plans')
            .select(`
                *,
                plans:plan_id (
                    id,
                    name,
                    price,
                    duration_days,
                    description,
                    provisioning_type
                )
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching all user plans:', error);
            return [];
        }

        return userPlans || [];
    }

    async expirePlan(userPlanId: string, reason?: string) {
        const supabase = this.getAdminSupabase(); // Use admin for updates
        const { data: userPlan, error } = await supabase
            .from('user_plans')
            .update({
                status: 'expired',
                cancel_date: new Date().toISOString(),
                cancel_reason: reason || 'Expired'
            })
            .eq('id', parseInt(userPlanId))
            .select()
            .single();

        if (error) {
            console.error('Error expiring user plan:', error);
            return null;
        }

        return userPlan;
    }

    async renewPlan(userPlanId: string, newExpirationDate: Date) {
        const supabase = this.getAdminSupabase(); // Use admin for updates
        const { data: userPlan, error } = await supabase
            .from('user_plans')
            .update({
                expires_at: newExpirationDate.toISOString(),
                status: 'active',
                cancel_date: null,
                cancel_reason: null
            })
            .eq('id', parseInt(userPlanId))
            .select()
            .single();

        if (error) {
            console.error('Error renewing user plan:', error);
            return null;
        }

        return userPlan;
    }

    async checkExpiredPlans() {
        const now = new Date().toISOString();
        
        const supabase = this.getAdminSupabase(); // Use admin for bulk updates
        const { data: expiredPlans, error } = await supabase
            .from('user_plans')
            .update({ status: 'expired' })
            .eq('status', 'active')
            .lt('expires_at', now)
            .select();

        if (error) {
            console.error('Error checking expired plans:', error);
            return [];
        }

        return expiredPlans || [];
    }

    async getCancelledPlans() {
        const supabase = await this.getSupabase();
        const { data: cancelledPlans, error } = await supabase
            .from('user_plans')
            .select(`
                *,
                plans:plan_id (
                    id,
                    name,
                    price,
                    duration_days,
                    description,
                    provisioning_type
                )
            `)
            .eq('status', 'cancelled')
            .order('cancel_date', { ascending: false });

        if (error) {
            console.error('Error fetching cancelled plans:', error);
            return [];
        }

        return cancelledPlans || [];
    }

    async hasActivePlan(userId: string, planType?: string) {
        const supabase = await this.getSupabase();
        
        let query = supabase
            .from('user_plans')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'active')
            .gte('expires_at', new Date().toISOString());

        if (planType) {
            // Se planType for especificado, filtrar por tipo de plano
            query = query.eq('plan_type', planType);
        }

        const { data: activePlans, error } = await query;

        if (error) {
            console.error('Error checking active plans:', error);
            return false;
        }

        return (activePlans || []).length > 0;
    }

    async deactivatePlan(userId: string, reason?: string) {
        const supabase = this.getAdminSupabase(); // Use admin for updates
        
        const { data: deactivatedPlans, error } = await supabase
            .from('user_plans')
            .update({
                status: 'cancelled',
                cancel_date: new Date().toISOString(),
                cancel_reason: reason || 'Desativado pelo administrador'
            })
            .eq('user_id', userId)
            .eq('status', 'active')
            .select();

        if (error) {
            console.error('Error deactivating plans:', error);
            throw error;
        }

        return deactivatedPlans || [];
    }

    // Compatibility methods - removed duplicate

    async getExpiredPlans(userId?: string) {
        if (userId) {
            return await this.getUserExpiredPlans(userId);
        }
        
        // Buscar todos os planos expirados do sistema (para admin)
        const supabase = await this.getSupabase();
        const { data: expiredPlans, error } = await supabase
            .from('user_plans')
            .select(`
                *,
                plans:plan_id (
                    id,
                    name,
                    price,
                    duration_days,
                    description,
                    provisioning_type
                ),
                profiles:user_id (
                    id,
                    discord_username
                )
            `)
            .eq('status', 'expired')
            .order('expires_at', { ascending: false });

        if (error) {
            console.error('Error fetching all expired plans:', error);
            return [];
        }

        return expiredPlans || [];
    }

    async getActivePlans(userId?: string) {
        if (userId) {
            return await this.getUserActivePlans(userId);
        }
        
        // Buscar todos os planos ativos do sistema (para admin)
        const supabase = await this.getSupabase();
        const { data: activePlans, error } = await supabase
            .from('user_plans')
            .select(`
                *,
                plans:plan_id (
                    id,
                    name,
                    price,
                    duration_days,
                    description,
                    provisioning_type
                ),
                profiles:user_id (
                    id,
                    discord_username
                )
            `)
            .eq('status', 'active')
            .gte('expires_at', new Date().toISOString())
            .order('expires_at', { ascending: true });

        if (error) {
            console.error('Error fetching all active plans:', error);
            return [];
        }

        return activePlans || [];
    }

    // Methods needed by QueueController
    async markAsInQueue(userPlanId: string) {
        const supabase = this.getAdminSupabase(); // Use admin for updates
        const { data: updatedPlan, error } = await supabase
            .from('user_plans')
            .update({ status: 'in_queue' })
            .eq('id', parseInt(userPlanId))
            .select()
            .single();

        if (error) {
            console.error('Error marking plan as in queue:', error);
            return null;
        }

        return updatedPlan;
    }

    async markAsOutOfQueue(userPlanId: string) {
        const supabase = this.getAdminSupabase(); // Use admin for updates
        const { data: updatedPlan, error } = await supabase
            .from('user_plans')
            .update({ status: 'active' })
            .eq('id', parseInt(userPlanId))
            .select()
            .single();

        if (error) {
            console.error('Error marking plan as out of queue:', error);
            return null;
        }

        return updatedPlan;
    }
}

const userPlanController = new UserPlanController();
export default userPlanController;