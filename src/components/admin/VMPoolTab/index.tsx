'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    Server, 
    Recycle, 
    Users, 
    BarChart3, 
    AlertTriangle, 
    CheckCircle,
    XCircle,
    RefreshCw,
    Settings,
    Database,
    HardDrive
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';

interface VMPoolStats {
    available_for_reuse: number;
    total_active: number;
    assigned_to_users: number;
    utilization_rate: number;
}

interface AvailableVM {
    id: string;
    name: string;
    azure_vm_name: string;
    status: string;
    is_active: boolean;
    created_at: string;
}

export default function VMPoolTab() {
    const { toast } = useToast();
    const [stats, setStats] = useState<VMPoolStats | null>(null);
    const [availableVMs, setAvailableVMs] = useState<AvailableVM[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [releaseReason, setReleaseReason] = useState('');
    const [selectedVMId, setSelectedVMId] = useState<string | null>(null);

    useEffect(() => {
        fetchVMPoolData();
    }, []);

    const fetchVMPoolData = async () => {
        try {
            const response = await fetch('/api/admin/vm-pool');
            if (response.ok) {
                const data = await response.json();
                setStats(data.stats);
                setAvailableVMs(data.available_vms || []);
            } else {
                toast({
                    title: "Erro",
                    description: "Erro ao carregar dados do pool de VMs",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Erro ao buscar dados do pool:', error);
            toast({
                title: "Erro",
                description: "Erro de conexão ao carregar pool de VMs",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchVMPoolData();
        setIsRefreshing(false);
    };

    const handleForceRelease = async (vmId: string) => {
        if (!releaseReason.trim()) {
            toast({
                title: "Erro",
                description: "Motivo da liberação é obrigatório",
                variant: "destructive"
            });
            return;
        }

        try {
            const response = await fetch('/api/admin/vm-pool', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'force_release',
                    vmId,
                    reason: releaseReason
                })
            });

            if (response.ok) {
                toast({
                    title: "Sucesso",
                    description: "VM liberada com sucesso"
                });
                setReleaseReason('');
                setSelectedVMId(null);
                await fetchVMPoolData();
            } else {
                const errorData = await response.json();
                toast({
                    title: "Erro",
                    description: errorData.error || "Erro ao liberar VM",
                    variant: "destructive"
                });
            }
        } catch (error) {
            toast({
                title: "Erro",
                description: "Erro de conexão ao liberar VM",
                variant: "destructive"
            });
        }
    };

    const getStatusBadge = (status: string, isActive: boolean) => {
        if (!isActive) {
            return <Badge variant="destructive">Inativa</Badge>;
        }
        
        switch (status?.toLowerCase()) {
            case 'running':
                return <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Em Execução</Badge>;
            case 'deallocated':
            case 'stopped':
                return <Badge className="bg-gray-500/20 text-gray-300 border-gray-500/30">Parada</Badge>;
            case 'starting':
                return <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">Iniciando</Badge>;
            default:
                return <Badge variant="secondary">{status || 'Desconhecido'}</Badge>;
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-32 w-full" />
                    ))}
                </div>
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Pool de VMs</h2>
                    <p className="text-gray-400 mt-1">
                        Gerenciamento de VMs disponíveis para reutilização
                    </p>
                </div>
                <Button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    variant="outline"
                    className="border-gray-600 hover:bg-gray-700"
                >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Atualizar
                </Button>
            </div>

            {/* Statistics Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <Card className="bg-gray-800/50 border-gray-700">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-gray-300">
                                    VMs Disponíveis
                                </CardTitle>
                                <Recycle className="h-4 w-4 text-green-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-white">{stats.available_for_reuse}</div>
                                <p className="text-xs text-gray-400">
                                    Prontas para reutilização
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Card className="bg-gray-800/50 border-gray-700">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-gray-300">
                                    Total Ativas
                                </CardTitle>
                                <Server className="h-4 w-4 text-blue-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-white">{stats.total_active}</div>
                                <p className="text-xs text-gray-400">
                                    VMs no sistema
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <Card className="bg-gray-800/50 border-gray-700">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-gray-300">
                                    Em Uso
                                </CardTitle>
                                <Users className="h-4 w-4 text-purple-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-white">{stats.assigned_to_users}</div>
                                <p className="text-xs text-gray-400">
                                    Atribuídas a usuários
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <Card className="bg-gray-800/50 border-gray-700">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-gray-300">
                                    Taxa de Utilização
                                </CardTitle>
                                <BarChart3 className="h-4 w-4 text-orange-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-white">
                                    {stats.utilization_rate.toFixed(1)}%
                                </div>
                                <p className="text-xs text-gray-400">
                                    Eficiência do pool
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            )}

            {/* Available VMs List */}
            <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                    <CardTitle className="text-white flex items-center">
                        <Database className="w-5 h-5 mr-2" />
                        VMs Disponíveis para Reutilização
                    </CardTitle>
                    <CardDescription>
                        VMs que foram desanexadas de usuários e estão prontas para nova atribuição
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {availableVMs.length === 0 ? (
                        <div className="text-center py-8">
                            <Server className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                            <p className="text-gray-400">Nenhuma VM disponível no momento</p>
                            <p className="text-sm text-gray-500 mt-2">
                                VMs aparecerão aqui quando planos expirarem e forem liberadas
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {availableVMs.map((vm, index) => (
                                <motion.div
                                    key={vm.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="flex items-center justify-between p-4 rounded-lg bg-gray-700/50 border border-gray-600"
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className="flex-shrink-0">
                                            <HardDrive className="w-8 h-8 text-blue-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-white font-medium">{vm.name}</h4>
                                            <p className="text-sm text-gray-400">
                                                Azure: {vm.azure_vm_name}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Disponível desde {new Date(vm.created_at).toLocaleDateString('pt-BR')}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center space-x-3">
                                        {getStatusBadge(vm.status, vm.is_active)}
                                        
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="border-red-600 text-red-400 hover:bg-red-600/20"
                                                    onClick={() => setSelectedVMId(vm.id)}
                                                >
                                                    <XCircle className="w-4 h-4 mr-1" />
                                                    Liberar Forçadamente
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent className="bg-gray-800 border-gray-700">
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle className="text-white">
                                                        Liberar VM Forçadamente
                                                    </AlertDialogTitle>
                                                    <AlertDialogDescription className="text-gray-400">
                                                        Esta ação irá forçar a liberação da VM {vm.name}. 
                                                        Informe o motivo da liberação forçada:
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <div className="py-4">
                                                    <Input
                                                        placeholder="Ex: Manutenção programada, falha técnica..."
                                                        value={releaseReason}
                                                        onChange={(e) => setReleaseReason(e.target.value)}
                                                        className="bg-gray-700 border-gray-600 text-white"
                                                    />
                                                </div>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel 
                                                        className="bg-gray-700 text-white hover:bg-gray-600"
                                                        onClick={() => {
                                                            setReleaseReason('');
                                                            setSelectedVMId(null);
                                                        }}
                                                    >
                                                        Cancelar
                                                    </AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => selectedVMId && handleForceRelease(selectedVMId)}
                                                        className="bg-red-600 text-white hover:bg-red-700"
                                                        disabled={!releaseReason.trim()}
                                                    >
                                                        Liberar VM
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* System Info */}
            <Card className="bg-blue-500/10 border-blue-500/30">
                <CardHeader>
                    <CardTitle className="text-blue-300 flex items-center">
                        <Settings className="w-5 h-5 mr-2" />
                        Sistema de Reutilização
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-blue-200 space-y-2">
                    <p>• <strong>Política de Reutilização:</strong> VMs são automaticamente desanexadas quando planos individuais expiram</p>
                    <p>• <strong>Gerenciamento de Disco:</strong> Discos personalizados são removidos na expiração, VMs ficam com disco limpo</p>
                    <p>• <strong>Atribuição Automática:</strong> Sistema atribui automaticamente VMs disponíveis para novos pagamentos</p>
                    <p>• <strong>Economia de Recursos:</strong> Reduz custos evitando criação desnecessária de novas VMs</p>
                </CardContent>
            </Card>
        </div>
    );
}