'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Clock, RefreshCcw, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface PlanNeedingRenewal {
    id: string;
    plan_id: string;
    plan_name: string;
    plan_price: number;
    plan_duration: number;
    expires_at: string;
    days_until_expiration: number;
    is_expired: boolean;
    renewal_urgency: 'critical' | 'high' | 'medium';
}

interface ExpirationNotificationProps {
    className?: string;
}

export default function ExpirationNotification({ className = '' }: ExpirationNotificationProps) {
    const { toast } = useToast();
    const [plansNeedingRenewal, setPlansNeedingRenewal] = useState<PlanNeedingRenewal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [dismissed, setDismissed] = useState<Set<string>>(new Set());
    const [isRenewing, setIsRenewing] = useState<string | null>(null);

    useEffect(() => {
        fetchRenewalInfo();
        
        // Atualizar a cada 5 minutos
        const interval = setInterval(fetchRenewalInfo, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const fetchRenewalInfo = async () => {
        try {
            const response = await fetch('/api/plans/renew');
            if (response.ok) {
                const data = await response.json();
                setPlansNeedingRenewal(data.plans_needing_renewal || []);
            }
        } catch (error) {
            console.error('Erro ao buscar informações de renovação:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRenewPlan = async (planId: string, planName: string) => {
        setIsRenewing(planId);
        
        try {
            const response = await fetch('/api/plans/renew', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId })
            });

            if (response.ok) {
                toast({
                    title: "Plano renovado!",
                    description: `${planName} foi renovado com sucesso.`,
                });
                
                // Remover da lista e atualizar
                setPlansNeedingRenewal(prev => prev.filter(p => p.plan_id !== planId));
                await fetchRenewalInfo();
            } else {
                const errorData = await response.json();
                toast({
                    title: "Erro na renovação",
                    description: errorData.error || "Erro ao renovar plano",
                    variant: "destructive"
                });
            }
        } catch (error) {
            toast({
                title: "Erro na renovação",
                description: "Erro de conexão. Tente novamente.",
                variant: "destructive"
            });
        } finally {
            setIsRenewing(null);
        }
    };

    const dismissNotification = (planId: string) => {
        setDismissed(prev => new Set([...prev, planId]));
    };

    const getUrgencyStyle = (urgency: string) => {
        switch (urgency) {
            case 'critical':
                return {
                    bgGradient: 'from-red-500/20 to-red-600/10',
                    border: 'border-red-500/50',
                    icon: 'text-red-400',
                    badge: 'bg-red-500/20 text-red-300 border-red-500/30'
                };
            case 'high':
                return {
                    bgGradient: 'from-orange-500/20 to-yellow-600/10',
                    border: 'border-orange-500/50',
                    icon: 'text-orange-400',
                    badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                };
            default:
                return {
                    bgGradient: 'from-blue-500/20 to-blue-600/10',
                    border: 'border-blue-500/50',
                    icon: 'text-blue-400',
                    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                };
        }
    };

    const getUrgencyText = (days: number, isExpired: boolean) => {
        if (isExpired) return `Expirado há ${Math.abs(days)} dias`;
        if (days === 0) return 'Expira hoje';
        if (days === 1) return 'Expira amanhã';
        return `Expira em ${days} dias`;
    };

    // Filtrar planos não dispensados
    const visiblePlans = plansNeedingRenewal.filter(plan => !dismissed.has(plan.plan_id));

    if (isLoading || visiblePlans.length === 0) {
        return null;
    }

    return (
        <div className={`space-y-4 ${className}`}>
            <AnimatePresence>
                {visiblePlans.map((plan) => {
                    const styles = getUrgencyStyle(plan.renewal_urgency);
                    
                    return (
                        <motion.div
                            key={plan.plan_id}
                            initial={{ opacity: 0, y: -20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                            className={`relative rounded-xl p-4 bg-gradient-to-r ${styles.bgGradient} backdrop-blur-sm border ${styles.border} shadow-lg`}
                        >
                            {/* Botão fechar */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => dismissNotification(plan.plan_id)}
                                className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-white/10"
                            >
                                <X className="h-3 w-3 text-gray-400" />
                            </Button>

                            <div className="flex items-start space-x-3">
                                {/* Ícone */}
                                <div className="flex-shrink-0 mt-0.5">
                                    {plan.is_expired ? (
                                        <AlertTriangle className={`h-5 w-5 ${styles.icon}`} />
                                    ) : (
                                        <Clock className={`h-5 w-5 ${styles.icon}`} />
                                    )}
                                </div>

                                {/* Conteúdo */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2 mb-1">
                                        <h4 className="text-sm font-semibold text-white">
                                            {plan.is_expired ? 'Plano Expirado!' : 'Plano Expirando'}
                                        </h4>
                                        <Badge className={`text-xs ${styles.badge}`}>
                                            {getUrgencyText(plan.days_until_expiration, plan.is_expired)}
                                        </Badge>
                                    </div>
                                    
                                    <p className="text-sm text-gray-300 mb-3">
                                        Seu plano <strong>{plan.plan_name}</strong> {plan.is_expired ? 
                                            'expirou e será removido em breve' : 
                                            'expirará em breve'}. Renove agora para continuar usando seus recursos.
                                    </p>

                                    {/* Ações */}
                                    <div className="flex items-center space-x-3">
                                        <Button
                                            onClick={() => handleRenewPlan(plan.plan_id, plan.plan_name)}
                                            disabled={isRenewing === plan.plan_id}
                                            size="sm"
                                            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all duration-200"
                                        >
                                            {isRenewing === plan.plan_id ? (
                                                <>
                                                    <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                                                    Renovando...
                                                </>
                                            ) : (
                                                <>
                                                    <Zap className="h-4 w-4 mr-2" />
                                                    Renovar Agora
                                                </>
                                            )}
                                        </Button>
                                        
                                        <div className="text-xs text-gray-400">
                                            A partir de R$ {plan.plan_price.toFixed(2)}/{plan.plan_duration} dias
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Barra de progresso para planos próximos ao vencimento */}
                            {!plan.is_expired && plan.days_until_expiration <= 7 && (
                                <div className="mt-3 pt-3 border-t border-white/10">
                                    <div className="flex items-center space-x-2 text-xs text-gray-400 mb-1">
                                        <Clock className="h-3 w-3" />
                                        <span>Tempo restante</span>
                                    </div>
                                    <div className="w-full bg-gray-700/50 rounded-full h-1.5">
                                        <motion.div
                                            className={`h-1.5 rounded-full ${
                                                plan.days_until_expiration <= 1 ? 'bg-red-500' :
                                                plan.days_until_expiration <= 3 ? 'bg-orange-500' : 'bg-blue-500'
                                            }`}
                                            initial={{ width: 0 }}
                                            animate={{ 
                                                width: `${Math.max(5, (plan.days_until_expiration / 7) * 100)}%` 
                                            }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                        />
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}