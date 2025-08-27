'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { LayoutDashboard, Users, Shield, LogOut, Clock, PlayCircle } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface LoggedProps {
    user: User;
    profile: { admin_level: 'user' | 'admin' | 'owner'; discord_username: string | null; } | null;
}

interface QueueStatus {
    in_queue: boolean;
    status?: string;
    position_in_queue?: number;
    time_remaining_minutes?: number;
    estimated_wait_time?: number;
}

export default function LoggedComponent({ user, profile }: LoggedProps) {
    const router = useRouter();
    const supabase = createClient();
    const isAdmin = profile?.admin_level === 'admin' || profile?.admin_level === 'owner';
    
    const [queueStatus, setQueueStatus] = useState<QueueStatus>({ in_queue: false });
    const [isLoadingQueue, setIsLoadingQueue] = useState(false);
    const [hasIndividualVM, setHasIndividualVM] = useState(false);
    const [hasActivePlan, setHasActivePlan] = useState(false);

    // Buscar status da fila e verificar se tem VM própria
    useEffect(() => {
        ensureProfileExists();
        checkQueueStatus();
        checkIndividualVM();
        checkActivePlan();
    }, []);

    const ensureProfileExists = async () => {
        try {
            // Se não tem profile ou profile é null, criar um
            if (!profile) {
                console.log('Profile não encontrado, criando novo profile...');
                
                const { error } = await supabase
                    .from('profiles')
                    .upsert({
                        id: user.id,
                        discord_username: user.user_metadata?.preferred_username || 
                                        user.user_metadata?.username || 
                                        user.user_metadata?.user_name || 
                                        'Unknown',
                        avatar_url: user.user_metadata?.avatar_url,
                        admin_level: 'user',
                        updated_at: new Date().toISOString(),
                    });

                if (error) {
                    console.error('Erro ao criar profile:', error);
                } else {
                    console.log('Profile criado com sucesso');
                    // Recarregar a página para refletir o novo profile
                    window.location.reload();
                }
            }
        } catch (error) {
            console.error('Erro ao garantir que profile existe:', error);
        }
    };

    const checkIndividualVM = async () => {
        try {
            const response = await fetch(`/api/machine/getAllUser?user_id=${user.id}`);
            if (response.ok) {
                const machines = await response.json();
                // Se tem máquinas, significa que tem VM individual
                setHasIndividualVM(Array.isArray(machines) && machines.length > 0);
            }
        } catch (error) {
            console.error('Erro ao verificar VM individual:', error);
        }
    };

    const checkActivePlan = async () => {
        try {
            const response = await fetch('/api/user/plan-status');
            if (response.ok) {
                const data = await response.json();
                setHasActivePlan(data.has_active_plan || false);
            }
        } catch (error) {
            console.error('Erro ao verificar plano ativo:', error);
        }
    };

    const checkQueueStatus = async () => {
        try {
            const response = await fetch('/api/queue/position');
            if (response.ok) {
                const data = await response.json();
                setQueueStatus({
                    in_queue: data.in_queue || false,
                    position_in_queue: data.position,
                    status: data.in_queue ? 'waiting' : undefined
                });
            }
        } catch (error) {
            console.error('Erro ao verificar status da fila:', error);
        }
    };

    const handleQueueAction = async () => {
        if (isLoadingQueue) return;
        
        setIsLoadingQueue(true);
        
        try {
            if (queueStatus.in_queue) {
                // Sair da fila
                const response = await fetch('/api/queue/leave', {
                    method: 'POST'
                });
                
                if (response.ok) {
                    toast.success('Removido da fila com sucesso');
                    setQueueStatus({ in_queue: false });
                } else {
                    const error = await response.json();
                    toast.error(error.error || 'Erro ao sair da fila');
                }
            } else {
                // Entrar na fila - redirecionar para página de filas para escolher plano
                router.push('/queue');
            }
        } catch (error) {
            toast.error('Erro ao processar ação da fila');
        } finally {
            setIsLoadingQueue(false);
        }
    };

    const getQueueButtonText = () => {
        if (isLoadingQueue) return 'Carregando...';
        
        if (!queueStatus.in_queue) {
            return 'Entrar na fila';
        }
        
        switch (queueStatus.status) {
            case 'waiting':
                return `Fila: ${queueStatus.position_in_queue}° posição`;
            case 'playing':
                return `Jogando (${queueStatus.time_remaining_minutes || 0}min restantes)`;
            case 'spot_warning':
                return 'Aviso de spot - sessão terminando';
            default:
                return 'Na fila';
        }
    };

    const getQueueIcon = () => {
        if (queueStatus.in_queue && queueStatus.status === 'playing') {
            return <PlayCircle className="w-4 h-4 text-green-400" />;
        }
        if (queueStatus.in_queue && queueStatus.status === 'spot_warning') {
            return <Clock className="w-4 h-4 text-orange-400" />;
        }
        return <Users className="w-4 h-4 text-blue-400" />;
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.refresh(); // Atualiza a página para refletir o estado de logout
    };

    return (
        <div className="pl-5">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-3 p-2.5 rounded-xl transition-all duration-300 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/40 backdrop-blur-sm">
                        <div className="relative w-8 h-8 rounded-full overflow-hidden">
                            <Image
                                src={user.user_metadata.avatar_url || '/darkcloud.png'}
                                alt={user.user_metadata.user_name || 'User Avatar'}
                                fill
                                sizes="32px"
                                className="object-cover"
                            />
                        </div>
                    </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent className="w-72 p-2 bg-gray-900/90 border-gray-700/50 backdrop-blur-md text-white">
                    <div className="px-2 py-2">
                        <div className="text-xs text-gray-400">ID Discord: {user.user_metadata.provider_id || 'N/A'}</div>
                        <div className="text-xs text-gray-400 truncate">{user.email}</div>
                    </div>
                    <DropdownMenuSeparator className="bg-gray-700/50" />
                    <div className="space-y-1 p-1">
                        <DropdownMenuItem
                            onClick={() => router.push('/dashboard')}
                            className="flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-xl hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-indigo-500/10 focus:bg-white/5 transition-all group"
                        >
                            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                                <LayoutDashboard className="w-4 h-4 text-purple-400" />
                            </div>
                            <span className="text-white/80 group-hover:text-white transition-colors">Painel de Controle</span>
                        </DropdownMenuItem>

                        {/* Mostrar botão de fila se usuário tem plano ativo */}
                        {hasActivePlan && (
                            <DropdownMenuItem
                                onClick={handleQueueAction}
                                disabled={isLoadingQueue}
                                className="flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-xl hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-cyan-500/10 focus:bg-white/5 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                                    {getQueueIcon()}
                                </div>
                                <span className="text-white/80 group-hover:text-white transition-colors">
                                    {getQueueButtonText()}
                                </span>
                            </DropdownMenuItem>
                        )}

                        {isAdmin && (
                            <DropdownMenuItem
                                onClick={() => router.push('/admin')}
                                className="flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-xl hover:bg-gradient-to-r hover:from-green-500/10 hover:to-teal-500/10 focus:bg-white/5 transition-all group"
                            >
                                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                                    <Shield className="w-4 h-4 text-green-400" />
                                </div>
                                <span className="text-white/80 group-hover:text-white transition-colors">Administração</span>
                            </DropdownMenuItem>
                        )}


                        <DropdownMenuItem
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-xl hover:bg-gradient-to-r hover:from-red-500/10 hover:to-pink-500/10 focus:bg-white/5 transition-all group"
                        >
                            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 group-hover:bg-red-500/20 transition-colors">
                                <LogOut className="w-4 h-4 text-red-400" />
                            </div>
                            <span className="text-white/80 group-hover:text-white transition-colors">Sair</span>
                        </DropdownMenuItem>
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}