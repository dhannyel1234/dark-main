'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCcw, Check, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface RenewalPlan {
    id: string;
    plan_id: string;
    plan_name: string;
    plan_price: number;
    plan_duration: number;
    plan_duration_type?: 'days' | 'hours';
    expires_at: string;
    days_until_expiration: number;
    is_expired: boolean;
    renewal_urgency: string;
}

function RenewalPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    
    const [renewalPlans, setRenewalPlans] = useState<RenewalPlan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRenewing, setIsRenewing] = useState<string | null>(null);
    const [selectedDurations, setSelectedDurations] = useState<{[key: string]: number}>({});

    const planParam = searchParams?.get('plan');
    const renewalDurations = [7, 15, 30, 60, 90];

    useEffect(() => {
        fetchRenewalPlans();
    }, []);

    const fetchRenewalPlans = async () => {
        try {
            const response = await fetch('/api/plans/renew');
            if (response.ok) {
                const data = await response.json();
                let plans = data.plans_needing_renewal || [];
                
                // Filtrar por plano específico se especificado na URL
                if (planParam) {
                    plans = plans.filter((plan: RenewalPlan) => 
                        plan.plan_name.toLowerCase().replace(' ', '') === planParam.toLowerCase()
                    );
                }
                
                setRenewalPlans(plans);
                
                // Definir durações padrão
                const defaultDurations: {[key: string]: number} = {};
                plans.forEach((plan: RenewalPlan) => {
                    defaultDurations[plan.plan_id] = plan.plan_duration || 30;
                });
                setSelectedDurations(defaultDurations);
            }
        } catch (error) {
            console.error('Erro ao buscar planos para renovação:', error);
            toast({
                title: "Erro",
                description: "Erro ao carregar planos para renovação",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleRenewal = async (planId: string, planName: string) => {
        setIsRenewing(planId);
        
        try {
            const response = await fetch('/api/plans/renew', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    planId,
                    renewalDays: selectedDurations[planId]
                })
            });

            if (response.ok) {
                const data = await response.json();
                
                toast({
                    title: "✅ Plano renovado!",
                    description: `${planName} foi renovado por ${selectedDurations[planId]} dias.`,
                });
                
                // Remover da lista após sucesso
                setRenewalPlans(prev => prev.filter(p => p.plan_id !== planId));
                
                // Se não há mais planos, redirecionar
                if (renewalPlans.length <= 1) {
                    setTimeout(() => router.push('/dashboard'), 2000);
                }
                
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

    const calculateRenewalPrice = (plan: RenewalPlan, days: number) => {
        const dailyPrice = plan.plan_price / (plan.plan_duration || 30);
        return dailyPrice * days;
    };

    const getUrgencyStyle = (urgency: string, isExpired: boolean) => {
        if (isExpired) {
            return 'from-red-500/20 to-red-600/10 border-red-500/50';
        }
        switch (urgency) {
            case 'critical':
                return 'from-red-500/15 to-orange-500/10 border-red-500/40';
            case 'high':
                return 'from-orange-500/15 to-yellow-500/10 border-orange-500/40';
            default:
                return 'from-blue-500/15 to-blue-600/10 border-blue-500/40';
        }
    };

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="space-y-6">
                    <Skeleton className="h-8 w-64" />
                    <div className="grid gap-6">
                        {Array.from({ length: 2 }).map((_, i) => (
                            <Skeleton key={i} className="h-64 w-full rounded-xl" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (renewalPlans.length === 0) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="text-center space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        <Check className="w-16 h-16 text-green-400 mx-auto" />
                        <h1 className="text-2xl font-bold text-white">
                            Todos os planos estão atualizados!
                        </h1>
                        <p className="text-gray-400">
                            Você não possui planos que precisem de renovação no momento.
                        </p>
                        <Button
                            onClick={() => router.push('/dashboard')}
                            className="mt-6"
                        >
                            Voltar ao Dashboard
                        </Button>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center space-x-4 mb-8"
            >
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.back()}
                    className="hover:bg-white/10"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar
                </Button>
                
                <div>
                    <h1 className="text-3xl font-bold text-white">
                        Renovação de Planos
                    </h1>
                    <p className="text-gray-400 mt-1">
                        Renove seus planos para continuar usando seus recursos
                    </p>
                </div>
            </motion.div>

            {/* Renewal Cards */}
            <div className="space-y-6">
                {renewalPlans.map((plan, index) => (
                    <motion.div
                        key={plan.plan_id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`rounded-xl p-6 bg-gradient-to-r ${getUrgencyStyle(plan.renewal_urgency, plan.is_expired)} backdrop-blur-sm border shadow-lg`}
                    >
                        {/* Plan Header */}
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center space-x-3">
                                {plan.is_expired ? (
                                    <AlertTriangle className="w-6 h-6 text-red-400" />
                                ) : (
                                    <Clock className="w-6 h-6 text-orange-400" />
                                )}
                                <div>
                                    <h3 className="text-xl font-semibold text-white">
                                        {plan.plan_name}
                                    </h3>
                                    <p className="text-sm text-gray-400">
                                        {plan.is_expired 
                                            ? `Expirado há ${Math.abs(plan.days_until_expiration)} dias`
                                            : plan.days_until_expiration === 0
                                                ? 'Expira hoje'
                                                : `Expira em ${plan.days_until_expiration} dias`
                                        }
                                    </p>
                                </div>
                            </div>
                            
                            <div className="text-right">
                                <p className="text-sm text-gray-400">Data de expiração</p>
                                <p className="text-white font-medium">
                                    {new Date(plan.expires_at).toLocaleDateString('pt-BR')}
                                </p>
                            </div>
                        </div>

                        {/* Duration Selection */}
                        <div className="mb-6">
                            <p className="text-sm text-gray-400 mb-3">Escolha a duração da renovação:</p>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                {renewalDurations.map((days) => (
                                    <button
                                        key={days}
                                        onClick={() => setSelectedDurations(prev => ({
                                            ...prev,
                                            [plan.plan_id]: days
                                        }))}
                                        className={`p-3 rounded-lg border transition-all ${
                                            selectedDurations[plan.plan_id] === days
                                                ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                                                : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                                        }`}
                                    >
                                        <div className="text-center">
                                            <p className="font-semibold">{days} dias</p>
                                            <p className="text-xs opacity-75">
                                                R$ {calculateRenewalPrice(plan, days).toFixed(2)}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Renewal Action */}
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-400">
                                <p>Nova data de expiração:</p>
                                <p className="text-white font-medium">
                                    {new Date(
                                        Date.now() + (selectedDurations[plan.plan_id] || 30) * 24 * 60 * 60 * 1000
                                    ).toLocaleDateString('pt-BR')}
                                </p>
                            </div>
                            
                            <Button
                                onClick={() => handleRenewal(plan.plan_id, plan.plan_name)}
                                disabled={isRenewing === plan.plan_id}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                            >
                                {isRenewing === plan.plan_id ? (
                                    <>
                                        <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
                                        Renovando...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCcw className="w-4 h-4 mr-2" />
                                        Renovar por R$ {calculateRenewalPrice(plan, selectedDurations[plan.plan_id] || 30).toFixed(2)}
                                    </>
                                )}
                            </Button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

export default function RenewalPage() {
    return (
        <Suspense fallback={<div className="container mx-auto px-4 py-8 max-w-4xl"><Skeleton className="h-8 w-48 mb-4" /><Skeleton className="h-32 w-full" /></div>}>
            <RenewalPageContent />
        </Suspense>
    );
}