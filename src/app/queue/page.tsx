'use client';

import { createClient } from "@/utils/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from "react";
import { motion } from 'framer-motion';
import { format, differenceInMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import Image from 'next/image';

import {
    Server,
    Clock,
    Users,
    Play,
    CheckCircle,
    AlertCircle,
    RefreshCw,
    Copy,
    Power,
    User,
    Timer,
    Globe,
    Lock,
    LinkIcon,
    Check,
    LockOpen,
    Tag,
    Database,
    HardDrive,
    Cpu,
    MonitorPlay
} from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuGroup,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

interface QueueStatus {
    position: number;
    status: 'waiting' | 'active' | 'completed' | 'expired';
    plan: {
        name: string;
        type: string;
        duration: number;
        startTime?: Date;
        endTime?: Date;
        alfaTimeLeftMs?: number;
    };
    machineInfo?: {
        ip: string;
        user: string;
        password: string;
        plan?: { name: string };
        name?: string;
        connectLink?: string;
    };
}

const dicas = [
    "A utilização de jogos craqueados ou qualquer arquivo torrent resultará na exclusão automática do plano sem direito a volta ou reembolso do valor.",
    "Não mine criptomoedas, nem faça overclocking em nenhuma de nossas máquinas e evite ter sua assinatura desabilitada.",
    "É totalmente proibido atualizar os drivers das máquinas virtuais."
];

// Função utilitária para exibir o nome correto do plano
function getPlanDisplayName(planType: string) {
  if (planType.toLowerCase() === 'omega') return 'ELITE 1';
  if (planType.toLowerCase() === 'beta') return 'Prime 1';
  if (planType.toLowerCase() === 'alfa') return 'Alfa';
  return planType.charAt(0).toUpperCase() + planType.slice(1);
}

export default function QueuePage() {
    const { toast } = useToast();
    const router = useRouter();

    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [isLoading, setLoading] = useState(true);
    const [isCheckingPlans, setIsCheckingPlans] = useState(true);
    const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
    const [isJoiningQueue, setIsJoiningQueue] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<'alfa' | 'omega' | 'beta' | null>(null);
    const [timeRemaining, setTimeRemaining] = useState<number>(0);
    const [dicaIndex, setDicaIndex] = useState(0);
    const [dots, setDots] = useState(1);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const dotsIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
    const [planoExpirado, setPlanoExpirado] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [availablePlans, setAvailablePlans] = useState<Array<{ type: string }>>([]);

    useEffect(() => {
        const supabase = createClient();

        const checkSessionAndPlans = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUser(user);
                setLoading(false);

                // Verificar se usuário tem plano ativo
                try {
                    const planStatusRes = await fetch('/api/user/plan-status');
                    const planStatus = await planStatusRes.json();
                    
                    if (!planStatus.has_active_plan) {
                        // Usuário não tem plano ativo, redirecionar para dashboard
                        toast({
                            title: "Plano necessário",
                            description: "Você precisa de um plano ativo para acessar as filas.",
                            variant: "destructive"
                        });
                        router.push('/dashboard');
                        return;
                    }
                } catch (error) {
                    console.error('Erro ao verificar plano ativo:', error);
                }

                // Verificar planos ativos
                setIsCheckingPlans(true);
                try {
                    const plansRes = await fetch('/api/user/plans');
                    const plansData = await plansRes.json();
                    if (plansData.success) {
                        setAvailablePlans(plansData.plans);
                        setPlanoExpirado(plansData.plans.length === 0);
                    } else {
                        setPlanoExpirado(true);
                    }
                } catch (error) {
                    console.error('Erro ao verificar planos:', error);
                    setPlanoExpirado(true);
                } finally {
                    setIsCheckingPlans(false);
                }

                // Verificar status da fila
                checkQueueStatus();
                const interval = setInterval(checkQueueStatus, 10000);
                return () => clearInterval(interval);

            } else {
                // Detectar URL de produção corretamente
                const isProduction = location.hostname === 'darkcloud.store';
                const redirectUrl = isProduction 
                    ? 'https://darkcloud.store/api/auth/callback'
                    : `${location.origin}/api/auth/callback`;
                    
                const { error } = await supabase.auth.signInWithOAuth({
                    provider: 'discord',
                    options: {
                        redirectTo: redirectUrl
                    }
                });
                if (error) console.error('Error logging in:', error);
            }
        };

        checkSessionAndPlans();
    }, []);

    useEffect(() => {
        if (queueStatus?.status === 'active' && queueStatus.plan.endTime) {
            const interval = setInterval(() => {
                const now = new Date();
                const endTime = new Date(queueStatus.plan.endTime!);
                const remaining = Math.max(0, differenceInMinutes(endTime, now));
                setTimeRemaining(remaining);

                if (remaining <= 0) {
                    checkQueueStatus();
                }
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [queueStatus]);

    useEffect(() => {
        if (!queueStatus || queueStatus.status !== 'active') return;
        
        const update = () => {
            let timeInSeconds = 0;
            
            // Para planos Alfa, usar alfaTimeLeftMs
            if (queueStatus.plan?.type?.toLowerCase() === 'alfa' && queueStatus.plan.alfaTimeLeftMs) {
                timeInSeconds = Math.floor(queueStatus.plan.alfaTimeLeftMs / 1000);
            } else if (queueStatus.plan?.endTime) {
                // Para outros planos, calcular baseado na data de expiração
                const endTime = new Date(queueStatus.plan.endTime);
                const now = new Date();
                timeInSeconds = Math.max(0, Math.floor((endTime.getTime() - now.getTime()) / 1000));
            }
            
            setTimeLeft(timeInSeconds);
        };

        // Garantir que só atualize no cliente
        if (typeof window !== 'undefined') {
            update(); // Atualização inicial
            const interval = setInterval(update, 1000);
            return () => clearInterval(interval);
        }
    }, [queueStatus]);

    // Dicas rotativas
    useEffect(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
            setDicaIndex((prev) => (prev + 1) % dicas.length);
        }, 5000);
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, []);

    // Animação dos três pontos
    useEffect(() => {
        if (dotsIntervalRef.current) clearInterval(dotsIntervalRef.current);
        dotsIntervalRef.current = setInterval(() => {
            setDots((prev) => (prev % 3) + 1);
        }, 500);
        return () => { if (dotsIntervalRef.current) clearInterval(dotsIntervalRef.current); };
    }, []);

    const checkQueueStatus = async () => {
        try {
            const response = await fetch('/api/queue/position');
            const data = await response.json();

            if (data.success) {
                setQueueStatus(data);
            } else {
                setQueueStatus(null);
            }
        } catch (error) {
            console.error('Erro ao verificar status da fila:', error);
        }
    };

    const joinQueue = async (planType: 'alfa' | 'omega' | 'beta') => {
        setIsJoiningQueue(true);
        try {
            const response = await fetch('/api/queue/join/enhanced-route', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ planType }),
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: "Sucesso!",
                    description: `Entrou na fila na posição ${data.position}`,
                });
                checkQueueStatus();
            } else {
                if (data.needsPlan) {
                    setPlanoExpirado(true);
                    toast({
                        title: 'Plano não encontrado',
                        description: 'Você precisa ter um plano ativo deste tipo para entrar na fila.',
                        action: (
                            <Button onClick={() => router.push('/')}>Ver Planos</Button>
                        ),
                        duration: 10000
                    });
                } else {
                    toast({
                        title: "Erro",
                        description: data.error,
                        variant: "destructive",
                    });
                }
            }
        } catch (error) {
            toast({
                title: "Erro",
                description: "Erro ao entrar na fila",
                variant: "destructive",
            });
        } finally {
            setIsJoiningQueue(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: "Copiado!",
            description: "Informação copiada para a área de transferência",
        });
        setCopiedIndex(text);
    };

    const formatTime = (seconds: number, planType?: string) => {
        if (seconds <= 0) return '0 segundos';

        const days = Math.floor(seconds / (24 * 60 * 60));
        const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
        const minutes = Math.floor((seconds % (60 * 60)) / 60);
        const remainingSeconds = seconds % 60;

        let parts = [];

        // Log para debug
        console.log('DEBUG - Formatando tempo:', {
            seconds,
            planType,
            days,
            hours,
            minutes,
            remainingSeconds,
            totalDays: seconds / (24 * 60 * 60)
        });

        // Para planos Alfa, mostrar horas, minutos e segundos
        if (planType?.toLowerCase() === 'alfa') {
            if (hours > 0) parts.push(`${hours}h`);
            if (minutes > 0 || hours > 0) parts.push(`${minutes}m`);
            parts.push(`${remainingSeconds}s`); // Sempre mostrar segundos
        } else {
            // Para outros planos, mostrar dias, horas e minutos
            if (days > 0) parts.push(`${days} dia${days > 1 ? 's' : ''}`);
            if (hours > 0) parts.push(`${hours} hora${hours > 1 ? 's' : ''}`);
            if (minutes > 0 && days === 0) parts.push(`${minutes} minuto${minutes > 1 ? 's' : ''}`);
            if (remainingSeconds > 0 && days === 0 && hours === 0) parts.push(`${remainingSeconds} segundo${remainingSeconds > 1 ? 's' : ''}`);
        }

        return parts.join(' ');
    };

    // Função para formatar a data de expiração
    const formatExpirationDate = (date: string) => {
        const expDate = new Date(date);
        return expDate.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Função para sair da fila
    const sairDaFila = async () => {
        try {
            const response = await fetch('/api/queue/leave', {
                method: 'POST'
            });
            await checkQueueStatus();
        } catch (error) {
            console.error('Erro ao sair da fila:', error);
        }
    };

    if (isLoading || isCheckingPlans) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <div className="flex items-center gap-2">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                    <span className="text-lg">Verificando seus planos{'.'.repeat(dots)}</span>
                </div>
            </div>
        );
    }

    if (queueStatus && queueStatus.status === 'waiting') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center relative">
                <div className="flex flex-col items-center justify-center z-10">
                    <div className="flex flex-col items-center justify-center">
                        <Image src="/darkcloud.png" alt="Logo" width={96} height={96} className="animate-pulse" />
                        <h1 className="text-2xl font-bold text-gray-200 mt-4">Carregando...</h1>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Sua posição na fila:</h1>
                    <div className="text-[5rem] md:text-[8rem] font-extrabold text-[#7dd3fc] drop-shadow-lg mb-4">
                        {queueStatus.position}
                    </div>
                    <div className="text-xl text-white mb-2">Plano: <span className="text-[#7dd3fc] font-semibold">{getPlanDisplayName(queueStatus.plan?.type || 'unknown')}</span></div>
                    <div className="text-lg text-gray-300 mb-8 flex items-center gap-2">Status: <span className="text-blue-400 font-semibold">Aguardando sua vez{'.'.repeat(dots)}</span></div>
                    <button onClick={sairDaFila} className="mt-4 px-8 py-3 rounded-full bg-[#7dd3fc] text-[#0a192f] font-bold text-lg shadow-lg hover:bg-[#60aaff] transition">Sair da fila</button>
                    <p className="mt-8 text-gray-400 text-sm text-center max-w-md transition-all duration-500 min-h-[48px]">{dicas[dicaIndex]}</p>
                </div>
            </div>
        );
    }

    if (queueStatus && queueStatus.status === 'active') {
        const machineInfo = queueStatus.machineInfo;
        const config = [
            'AMD EPYC 2.5Ghz',
            '16RAM',
            'NVIDIA TESLA T4',
            '256GB SSD'
        ];
        let expiration = '';
        if (queueStatus.plan.endTime) {
            const date = new Date(queueStatus.plan.endTime);
            expiration = date.toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        const connectLink = machineInfo?.connectLink || '';
        const tutorialLink = 'https://www.youtube.com/watch?v=jJnGhF4B4VU'; // Troque pelo link real
        return (
            <div className="min-h-screen flex flex-col items-center justify-center relative">
                <div className="flex flex-col items-center justify-center z-10">
                    <div className="rounded-2xl border border-blue-400 bg-gradient-to-br from-[#10182a] via-[#151823] to-[#0a0f1a] max-w-sm w-full p-5 flex flex-col items-center shadow-2xl transition-all duration-300 hover:shadow-blue-500/30">
                        <div className="flex flex-col items-center justify-center mb-2">
                            <Image src="/darkcloud.png" alt="Logo" width={64} height={64} className="mb-2 drop-shadow-lg" />
                            <h1 className="text-2xl font-bold text-gray-200">Fila de espera</h1>
                        </div>
                        <div className="flex items-center gap-2 text-blue-300 text-2xl font-extrabold mb-1 uppercase tracking-widest drop-shadow">
                            <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path fill="#60a5fa" d="M12 2l2.09 6.26L20 9.27l-5 3.64L16.18 21 12 17.27 7.82 21 9 12.91l-5-3.64 5.91-.01z"/></svg>
                            {getPlanDisplayName(queueStatus.plan?.type || 'unknown')}
                        </div>
                        <div className="w-full flex flex-col items-center mt-1 mb-1">
                            <span className="flex items-center gap-2 text-blue-200 text-sm font-semibold">
                                <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path fill="#38bdf8" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/><circle cx="12" cy="12" r="5" fill="#60a5fa"/></svg>
                                IP DA MÁQUINA
                            </span>
                            <span className="text-white text-lg font-mono select-all font-bold tracking-wider mt-0.5 mb-1">{machineInfo?.ip}</span>
                        </div>
                        <div className="w-full border-t border-white/10 my-1"></div>
                        <div className="w-full flex flex-col items-center mb-1">
                            <span className="flex items-center gap-2 text-blue-200 text-sm font-semibold">
                                <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="4" fill="#38bdf8"/><rect x="7" y="2" width="2" height="4" rx="1" fill="#60a5fa"/><rect x="15" y="2" width="2" height="4" rx="1" fill="#60a5fa"/></svg>
                                DATA DE EXPIRAÇÃO
                            </span>
                            <span className="text-white text-base font-bold mt-0.5 mb-1">
                                {queueStatus.plan.endTime ? formatExpirationDate(new Date(queueStatus.plan.endTime).toISOString()) : '---'}
                            </span>
                        </div>
                        <div className="w-full border-t border-white/10 my-1"></div>
                        <div className="w-full flex flex-col items-center mb-1">
                            <span className="flex items-center gap-2 text-blue-200 text-sm font-semibold">
                                <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4" fill="#38bdf8"/><rect x="8" y="8" width="8" height="8" rx="2" fill="#60a5fa"/></svg>
                                CONFIGURAÇÕES
                            </span>
                            <div className="text-blue-200 text-sm font-semibold text-center mb-2 space-y-1 w-full">
                                <div className="flex items-center gap-2 justify-center"><span>AMD EPYC 2.5Ghz</span></div>
                                <div className="flex items-center gap-2 justify-center"><span>16RAM</span></div>
                                <div className="flex items-center gap-2 justify-center"><span>NVIDIA TESLA T4</span></div>
                                <div className="flex items-center gap-2 justify-center"><span>256GB SSD</span></div>
                            </div>
                        </div>
                        <div className="w-full border-t border-white/10 my-1"></div>
                        <div className="w-full flex flex-col items-center mb-1">
                            <span className="flex items-center gap-2 text-blue-200 text-sm font-semibold">
                                <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#38bdf8"/><rect x="11" y="6" width="2" height="7" rx="1" fill="#60a5fa"/><rect x="11" y="12" width="5" height="2" rx="1" fill="#60a5fa"/></svg>
                                TEMPO RESTANTE
                            </span>
                            <span suppressHydrationWarning className="text-white text-lg font-mono font-bold mt-0.5 mb-1 tracking-widest">{formatTime(timeLeft, queueStatus.plan?.type)}</span>
                        </div>
                        <div className="w-full flex gap-4 justify-center mt-2">
                            <a
                                href={connectLink || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-md font-bold text-white text-base transition-all duration-200 shadow-md ${connectLink ? 'bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-700 hover:to-pink-600 cursor-pointer' : 'bg-gray-600 cursor-not-allowed'}`}
                                style={{ textDecoration: 'none' }}
                                tabIndex={connectLink ? 0 : -1}
                                aria-disabled={!connectLink}
                            >
                                <Image src="/parsec.svg" alt="Parsec" width={18} height={18} />
                                <span>Conectar</span>
                            </a>
                            <a
                                href={tutorialLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-md font-bold text-white text-base bg-gradient-to-r from-blue-500 to-blue-400 hover:from-blue-600 hover:to-blue-500 transition-all duration-200 shadow-md"
                                style={{ textDecoration: 'none' }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24"><path fill="#fff" d="M10 15.172V8.828a1 1 0 0 1 1.707-.707l4.243 3.172a1 1 0 0 1 0 1.414l-4.243 3.172A1 1 0 0 1 10 15.172Z"/></svg>
                                TUTORIAL
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!queueStatus && !planoExpirado && !isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center relative">
                <div className="flex flex-col items-center justify-center z-10">
                    <div className="rounded-2xl border-2 border-blue-400 bg-gradient-to-br from-[#10182a] via-[#151823] to-[#0a0f1a] max-w-md w-full p-10 flex flex-col items-center shadow-2xl transition-all duration-300 hover:shadow-[0_0_40px_10px_rgba(56,189,248,0.3)] group">
                        <Image src="/darkcloud.png" alt="Logo" width={80} height={80} className="mb-4 drop-shadow-lg" />
                        <span className="text-blue-300 text-lg font-bold mb-2 tracking-widest">STATUS</span>
                        <h1 className="text-3xl font-extrabold text-blue-400 mb-4 uppercase">PLANO ATIVO</h1>
                        <span className="text-white text-lg font-bold mb-2">CONFIGURAÇÕES</span>
                        <div className="text-blue-200 text-base font-semibold text-center mb-6 space-y-2 w-full">
                            <div className="flex items-center gap-2 justify-center">
                                <span>AMD EPYC 2.5Ghz</span>
                            </div>
                            <div className="flex items-center gap-2 justify-center">
                                <span>16RAM</span>
                            </div>
                            <div className="flex items-center gap-2 justify-center">
                                <span>NVIDIA TESLA T4</span>
                            </div>
                            <div className="flex items-center gap-2 justify-center">
                                <span>256GB SSD</span>
                            </div>
                        </div>
                        <Button
                            onClick={async () => {
                                const plansRes = await fetch('/api/user/plans');
                                const plansData = await plansRes.json();
                                if (plansData.success && plansData.plans.length > 0) {
                                    const planType = plansData.plans[0].type.toLowerCase();
                                    if (["alfa", "beta", "omega"].includes(planType)) {
                                        await joinQueue(planType as 'alfa' | 'beta' | 'omega');
                                    } else {
                                        toast({
                                            title: "Erro",
                                            description: "Tipo de plano inválido",
                                            variant: "destructive",
                                        });
                                    }
                                } else {
                                    setPlanoExpirado(true);
                                }
                            }}
                            className="mt-4 px-8 py-3 rounded-full bg-blue-400 text-[#0a192f] font-bold text-lg shadow-lg hover:bg-blue-500 transition w-full"
                        >
                            INICIAR INSTÂNCIA
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    if (planoExpirado) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <AlertCircle className="w-12 h-12 text-yellow-500" />
                <h2 className="text-2xl font-bold">Plano não encontrado</h2>
                <p className="text-gray-500">Você não possui nenhum plano ativo no momento. Adquira um plano para poder entrar na fila.</p>
                <Button onClick={() => router.push('/')}>Ver Planos Disponíveis</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8">
            {/* Background com efeito de gradiente */}
            <div className="fixed inset-0 bg-gradient-to-b from-blue-900/10 via-blue-900/5 to-transparent pointer-events-none" />
            <div className="fixed inset-0 bg-[url('/bg/Desktop.png')] opacity-10 pointer-events-none bg-cover bg-center" />
            
            <div className="max-w-4xl mx-auto relative">
                {/* Breadcrumb com animação */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Breadcrumb className="mb-8">
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/">Início</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Fila</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </motion.div>

                {isLoading || isCheckingPlans ? (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-col items-center justify-center min-h-[400px]"
                    >
                        <RefreshCw className="w-8 h-8 animate-spin text-blue-400" />
                        <p className="mt-4 text-gray-400">Verificando status{'.'.repeat(dots)}</p>
                    </motion.div>
                ) : planoExpirado ? (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-col items-center justify-center min-h-[400px] text-center"
                    >
                        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                        <h2 className="text-2xl font-bold mb-2">Plano Expirado</h2>
                        <p className="text-gray-400 mb-6">Você não possui um plano ativo no momento.</p>
                        <Button 
                            onClick={() => router.push('/plans')} 
                            variant="default"
                            className="bg-blue-500 hover:bg-blue-600 transition-colors"
                        >
                            Ver Planos Disponíveis
                        </Button>
                    </motion.div>
                ) : queueStatus ? (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="space-y-6"
                    >
                        {/* Card Principal com Status */}
                        <div className="relative bg-gradient-to-br from-blue-900/50 to-blue-800/30 rounded-2xl p-6 backdrop-blur-sm border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 shadow-lg hover:shadow-blue-500/20">
                            <motion.div 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2 }}
                                className="absolute -top-3 -right-3"
                            >
                                <Badge variant="default" className="bg-blue-500 shadow-lg">
                                    {queueStatus.status === 'active' ? 'ATIVO' : 'NA FILA'}
                                </Badge>
                            </motion.div>
                            
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center space-x-4">
                                    <motion.div 
                                        whileHover={{ scale: 1.05 }}
                                        className="p-3 bg-blue-500/20 rounded-xl"
                                    >
                                        <Image
                                            src="/darkcloud.png"
                                            alt="DarkCloud"
                                            width={40}
                                            height={40}
                                            className="rounded-lg"
                                        />
                                    </motion.div>
                                    <div>
                                        <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-blue-400 bg-clip-text text-transparent">
                                            DARKCLOUD
                                        </h2>
                                        <p className="text-blue-400">Cloud Gaming</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Configurações da Máquina */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold mb-4 text-blue-300">CONFIGURAÇÕES</h3>
                                    <div className="space-y-3">
                                        <motion.div 
                                            whileHover={{ x: 5 }}
                                            className="flex items-center space-x-3 text-gray-300 transition-colors hover:text-blue-400"
                                        >
                                            <Server className="w-5 h-5 text-blue-400" />
                                            <span>AMD EPYC 2.5Ghz</span>
                                        </motion.div>
                                        <motion.div
                                            whileHover={{ x: 5 }}
                                            className="flex items-center space-x-3 text-gray-300 transition-colors hover:text-blue-400"
                                        >
                                            <Database className="w-5 h-5 text-blue-400" />
                                            <span>16RAM</span>
                                        </motion.div>
                                        <motion.div 
                                            whileHover={{ x: 5 }}
                                            className="flex items-center space-x-3 text-gray-300 transition-colors hover:text-blue-400"
                                        >
                                            <MonitorPlay className="w-5 h-5 text-blue-400" />
                                            <span>NVIDIA TESLA T4</span>
                                        </motion.div>
                                        <motion.div 
                                            whileHover={{ x: 5 }}
                                            className="flex items-center space-x-3 text-gray-300 transition-colors hover:text-blue-400"
                                        >
                                            <HardDrive className="w-5 h-5 text-blue-400" />
                                            <span>256GB SSD</span>
                                        </motion.div>
                                    </div>
                                </div>

                                {/* Status e Ações */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold mb-4 text-blue-300">STATUS</h3>
                                    {queueStatus.status === 'active' ? (
                                        <>
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-300">Tempo Restante</span>
                                                    <span className="text-blue-400 font-medium">
                                                        {formatTime(timeLeft, queueStatus.plan?.type)}
                                                    </span>
                                                </div>
                                                <Progress 
                                                    value={Math.min(100, (timeLeft / (queueStatus.plan.duration * 60)) * 100)} 
                                                    className="h-2 bg-blue-950"
                                                />
                                            </div>
                                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                                <Button 
                                                    className="w-full mt-4 bg-blue-500 hover:bg-blue-600 transition-colors shadow-lg hover:shadow-blue-500/50"
                                                    onClick={() => window.open(queueStatus.machineInfo?.connectLink, '_blank')}
                                                >
                                                    <Play className="w-4 h-4 mr-2" />
                                                    INICIAR INSTÂNCIA
                                                </Button>
                                            </motion.div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-300">Posição na Fila</span>
                                                    <span className="text-blue-400 font-medium">
                                                        #{queueStatus.position}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-300">Plano</span>
                                                    <span className="text-blue-400 font-medium">
                                                        {getPlanDisplayName(queueStatus.plan?.type || 'unknown')}
                                                    </span>
                                                </div>
                                            </div>
                                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                                <Button 
                                                    variant="destructive" 
                                                    className="w-full mt-4 shadow-lg hover:shadow-red-500/50"
                                                    onClick={sairDaFila}
                                                >
                                                    Sair da Fila
                                                </Button>
                                            </motion.div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Dicas e Informações */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                            className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 rounded-xl p-6 backdrop-blur-sm border border-gray-500/20 hover:border-gray-500/40 transition-all duration-300 shadow-lg hover:shadow-gray-500/20"
                        >
                            <h3 className="text-lg font-semibold mb-4 flex items-center text-yellow-400">
                                <AlertCircle className="w-5 h-5 mr-2" />
                                Dicas Importantes
                            </h3>
                            <p className="text-gray-300">{dicas[dicaIndex]}</p>
                        </motion.div>
                    </motion.div>
                ) : (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex items-center justify-center min-h-[400px]"
                    >
                        <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 rounded-2xl p-8 backdrop-blur-sm border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 shadow-lg hover:shadow-blue-500/20 max-w-sm w-full">
                            {/* Logo e Status */}
                            <div className="flex flex-col items-center text-center mb-8">
                                <motion.div 
                                    whileHover={{ scale: 1.05 }}
                                    className="p-4 bg-blue-500/20 rounded-2xl mb-6"
                                >
                                    <Image
                                        src="/darkcloud.png"
                                        alt="DarkCloud"
                                        width={60}
                                        height={60}
                                        className="rounded-xl"
                                    />
                                </motion.div>
                                <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-blue-400 bg-clip-text text-transparent mb-2">
                                    STATUS
                                </h2>
                                <h3 className="text-xl font-bold text-blue-400 mb-4">
                                    PLANO ATIVO
                                </h3>
                            </div>

                            {/* Configurações */}
                            <div className="space-y-4 mb-8">
                                <h3 className="text-lg font-semibold text-blue-300 text-center mb-4">CONFIGURAÇÕES</h3>
                                <div className="space-y-3">
                                    <motion.div 
                                        whileHover={{ x: 5 }}
                                        className="flex items-center space-x-3 text-gray-300 transition-colors hover:text-blue-400"
                                    >
                                        <Server className="w-5 h-5 text-blue-400" />
                                        <span>AMD EPYC 2.5Ghz</span>
                                    </motion.div>
                                    <motion.div
                                        whileHover={{ x: 5 }}
                                        className="flex items-center space-x-3 text-gray-300 transition-colors hover:text-blue-400"
                                    >
                                        <Database className="w-5 h-5 text-blue-400" />
                                        <span>16RAM</span>
                                    </motion.div>
                                    <motion.div 
                                        whileHover={{ x: 5 }}
                                        className="flex items-center space-x-3 text-gray-300 transition-colors hover:text-blue-400"
                                    >
                                        <MonitorPlay className="w-5 h-5 text-blue-400" />
                                        <span>NVIDIA TESLA T4</span>
                                    </motion.div>
                                    <motion.div 
                                        whileHover={{ x: 5 }}
                                        className="flex items-center space-x-3 text-gray-300 transition-colors hover:text-blue-400"
                                    >
                                        <HardDrive className="w-5 h-5 text-blue-400" />
                                        <span>256GB SSD</span>
                                    </motion.div>
                                </div>
                            </div>

                            {/* Botão de Ação */}
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                <Button 
                                    onClick={() => joinQueue('alfa')}
                                    disabled={isJoiningQueue}
                                    className="w-full bg-blue-500 hover:bg-blue-600 transition-colors shadow-lg hover:shadow-blue-500/50 font-semibold text-lg py-6"
                                >
                                    {isJoiningQueue ? (
                                        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                                    ) : (
                                        <Play className="w-5 h-5 mr-2" />
                                    )}
                                    INICIAR INSTÂNCIA
                                </Button>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
} 