'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    Server, 
    Plus, 
    Trash2, 
    Lock, 
    Unlock, 
    Home, 
    Users, 
    Settings,
    Eye,
    MoreVertical,
    AlertTriangle,
    CheckCircle,
    Clock,
    Shield,
    Database
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
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

interface VM {
    id: string;
    name: string;
    azure_vm_name: string;
    azure_status: string;
    system_status: 'available' | 'occupied_queue' | 'rented' | 'reserved' | 'maintenance';
    is_registered: boolean;
    owner_id: string | null;
    reserved_by: string | null;
    reserved_reason: string | null;
    owner_discord: string | null;
    owner_email: string | null;
    owner_discord_id: string | null;
    created_at: string;
    updated_at: string;
}

interface VMStats {
    total: number;
    registered: number;
    available: number;
    rented: number;
    occupied_queue: number;
    reserved: number;
    maintenance: number;
    utilization_rate: number;
}

interface VMHierarchyTabProps {
    profile: { admin_level: 'user' | 'admin' | 'owner' } | null;
}

export default function VMHierarchyTab({ profile }: VMHierarchyTabProps) {
    const { toast } = useToast();
    const [vms, setVMs] = useState<VM[]>([]);
    const [stats, setStats] = useState<VMStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState<string | null>(null);
    
    // Dialog states
    const [registerDialog, setRegisterDialog] = useState(false);
    const [reserveDialog, setReserveDialog] = useState<{ open: boolean; vmId: string | null }>({ open: false, vmId: null });
    const [rentDialog, setRentDialog] = useState<{ open: boolean; vmId: string | null }>({ open: false, vmId: null });
    const [newVMName, setNewVMName] = useState('');
    const [reserveReason, setReserveReason] = useState('');
    const [rentData, setRentData] = useState({ userId: '', planName: 'Semanal', days: '7' });

    const isOwner = profile?.admin_level === 'owner';

    useEffect(() => {
        fetchVMs();
    }, []);

    const fetchVMs = async () => {
        try {
            const response = await fetch('/api/admin/vm-management');
            if (response.ok) {
                const data = await response.json();
                setVMs(data.vms || []);
                setStats(data.stats);
            } else {
                toast({
                    title: "Erro",
                    description: "Erro ao carregar VMs",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Erro ao buscar VMs:', error);
            toast({
                title: "Erro",
                description: "Erro de conexão ao carregar VMs",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleVMAction = async (action: string, vmId?: string, extraData?: any) => {
        if (!isOwner && ['register', 'unregister', 'reserve', 'unreserve', 'rent', 'unrent'].includes(action)) {
            toast({
                title: "Acesso negado",
                description: "Apenas owners podem executar esta ação",
                variant: "destructive"
            });
            return;
        }

        setIsProcessing(vmId || 'general');
        
        try {
            const response = await fetch('/api/admin/vm-management', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action,
                    vmId,
                    ...extraData
                })
            });

            if (response.ok) {
                const data = await response.json();
                toast({
                    title: "Sucesso",
                    description: data.message
                });
                
                // Resetar dialogs
                setRegisterDialog(false);
                setReserveDialog({ open: false, vmId: null });
                setRentDialog({ open: false, vmId: null });
                setNewVMName('');
                setReserveReason('');
                setRentData({ userId: '', planName: 'Semanal', days: '7' });
                
                // Atualizar lista
                await fetchVMs();
            } else {
                const errorData = await response.json();
                toast({
                    title: "Erro",
                    description: errorData.error || "Erro ao executar ação",
                    variant: "destructive"
                });
            }
        } catch (error) {
            toast({
                title: "Erro",
                description: "Erro de conexão",
                variant: "destructive"
            });
        } finally {
            setIsProcessing(null);
        }
    };

    const getStatusBadge = (systemStatus: string, azureStatus: string) => {
        const statusConfig = {
            available: { color: 'bg-green-500/20 text-green-300 border-green-500/30', label: 'Disponível', icon: CheckCircle },
            occupied_queue: { color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', label: 'Ocupada (Fila)', icon: Users },
            rented: { color: 'bg-purple-500/20 text-purple-300 border-purple-500/30', label: 'Alugada', icon: Home },
            reserved: { color: 'bg-orange-500/20 text-orange-300 border-orange-500/30', label: 'Reservada', icon: Lock },
            maintenance: { color: 'bg-gray-500/20 text-gray-300 border-gray-500/30', label: 'Manutenção', icon: Settings }
        };

        const config = statusConfig[systemStatus as keyof typeof statusConfig] || statusConfig.maintenance;
        const Icon = config.icon;

        return (
            <Badge className={`${config.color} flex items-center gap-1`}>
                <Icon className="w-3 h-3" />
                {config.label}
            </Badge>
        );
    };

    const getAzureStatusBadge = (status: string) => {
        const isRunning = status?.toLowerCase() === 'running';
        return (
            <Badge variant={isRunning ? 'default' : 'secondary'} className="text-xs">
                {isRunning ? '🟢' : '🔴'} {status || 'Desconhecido'}
            </Badge>
        );
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-24 w-full" />
                    ))}
                </div>
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Gerenciamento de VMs</h2>
                    <p className="text-gray-400 mt-1">
                        Hierarquia: Disponível → Ocupada (Fila) → Alugada → Reservada
                    </p>
                </div>
                
                {isOwner && (
                    <Dialog open={registerDialog} onOpenChange={setRegisterDialog}>
                        <DialogTrigger asChild>
                            <Button className="bg-blue-600 hover:bg-blue-700">
                                <Plus className="w-4 h-4 mr-2" />
                                Registrar VM
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-gray-800 border-gray-700">
                            <DialogHeader>
                                <DialogTitle className="text-white">Registrar Nova VM</DialogTitle>
                                <DialogDescription className="text-gray-400">
                                    Registre uma VM da Azure no sistema para torná-la disponível
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <Input
                                    placeholder="Nome da VM na Azure (ex: gaming-vm-01)"
                                    value={newVMName}
                                    onChange={(e) => setNewVMName(e.target.value)}
                                    className="bg-gray-700 border-gray-600 text-white"
                                />
                            </div>
                            <DialogFooter>
                                <Button 
                                    variant="outline" 
                                    onClick={() => setRegisterDialog(false)}
                                    className="border-gray-600 text-gray-300"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={() => handleVMAction('register', undefined, { azureVmName: newVMName })}
                                    disabled={!newVMName.trim() || isProcessing === 'general'}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    {isProcessing === 'general' ? 'Registrando...' : 'Registrar'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {/* Statistics */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                    <Card className="bg-gray-800/50 border-gray-700">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-300 flex items-center">
                                <Database className="w-4 h-4 mr-1" />
                                Total
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">{stats.total}</div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gray-800/50 border-gray-700">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-300 flex items-center">
                                <Shield className="w-4 h-4 mr-1" />
                                Registradas
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">{stats.registered}</div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gray-800/50 border-gray-700">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-green-300 flex items-center">
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Disponíveis
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-400">{stats.available}</div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gray-800/50 border-gray-700">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-blue-300 flex items-center">
                                <Users className="w-4 h-4 mr-1" />
                                Fila
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-400">{stats.occupied_queue}</div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gray-800/50 border-gray-700">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-purple-300 flex items-center">
                                <Home className="w-4 h-4 mr-1" />
                                Alugadas
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-purple-400">{stats.rented}</div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gray-800/50 border-gray-700">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-orange-300 flex items-center">
                                <Lock className="w-4 h-4 mr-1" />
                                Reservadas
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-400">{stats.reserved}</div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gray-800/50 border-gray-700">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-300 flex items-center">
                                <Settings className="w-4 h-4 mr-1" />
                                Utilização
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">{stats.utilization_rate.toFixed(1)}%</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* VMs Table */}
            <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                    <CardTitle className="text-white flex items-center">
                        <Server className="w-5 h-5 mr-2" />
                        Virtual Machines
                    </CardTitle>
                    <CardDescription>
                        {isOwner ? 'Gerenciamento completo de VMs' : 'Visualização de VMs (somente leitura)'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-gray-700">
                                <TableHead className="text-gray-300">Nome</TableHead>
                                <TableHead className="text-gray-300">Status Sistema</TableHead>
                                <TableHead className="text-gray-300">Status Azure</TableHead>
                                <TableHead className="text-gray-300">Usuário</TableHead>
                                <TableHead className="text-gray-300">Detalhes</TableHead>
                                {isOwner && <TableHead className="text-gray-300">Ações</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {vms.map((vm) => (
                                <TableRow key={vm.id} className="border-gray-700">
                                    <TableCell className="text-white font-medium">
                                        <div>
                                            <div>{vm.name}</div>
                                            <div className="text-sm text-gray-400">{vm.azure_vm_name}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(vm.system_status, vm.azure_status)}
                                    </TableCell>
                                    <TableCell>
                                        {getAzureStatusBadge(vm.azure_status)}
                                    </TableCell>
                                    <TableCell>
                                        {vm.owner_discord || vm.owner_discord_id ? (
                                            <div className="text-sm">
                                                <div className="text-white">{vm.owner_discord || 'Discord User'}</div>
                                                <div className="text-gray-400 font-mono text-xs">
                                                    ID: {vm.owner_discord_id || 'N/A'}
                                                </div>
                                                {vm.owner_email && (
                                                    <div className="text-gray-500 text-xs">{vm.owner_email}</div>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-gray-500">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {vm.system_status === 'reserved' && vm.reserved_reason && (
                                            <div className="text-sm text-orange-300">
                                                <div className="font-medium">Reservada</div>
                                                <div className="text-gray-400">{vm.reserved_reason}</div>
                                            </div>
                                        )}
                                        {vm.system_status === 'occupied_queue' && (
                                            <div className="text-sm text-blue-300">
                                                Em uso na fila automática
                                            </div>
                                        )}
                                        {vm.system_status === 'maintenance' && !vm.is_registered && (
                                            <div className="text-sm text-gray-400">
                                                Não registrada no sistema
                                            </div>
                                        )}
                                    </TableCell>
                                    {isOwner && (
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                                                        disabled={isProcessing === vm.id}
                                                    >
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                                                    {vm.system_status === 'available' && (
                                                        <>
                                                            <DropdownMenuItem
                                                                onClick={() => setRentDialog({ open: true, vmId: vm.id })}
                                                                className="text-green-400 hover:text-green-300"
                                                            >
                                                                <Home className="mr-2 h-4 w-4" />
                                                                Alugar para Usuário
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => setReserveDialog({ open: true, vmId: vm.id })}
                                                                className="text-orange-400 hover:text-orange-300"
                                                            >
                                                                <Lock className="mr-2 h-4 w-4" />
                                                                Reservar
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator className="bg-gray-700" />
                                                        </>
                                                    )}
                                                    
                                                    {vm.system_status === 'reserved' && (
                                                        <>
                                                            <DropdownMenuItem
                                                                onClick={() => handleVMAction('unreserve', vm.id)}
                                                                className="text-green-400 hover:text-green-300"
                                                            >
                                                                <Unlock className="mr-2 h-4 w-4" />
                                                                Remover Reserva
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator className="bg-gray-700" />
                                                        </>
                                                    )}

                                                    {vm.system_status === 'rented' && (
                                                        <>
                                                            <DropdownMenuItem
                                                                onClick={() => handleVMAction('unrent', vm.id)}
                                                                className="text-yellow-400 hover:text-yellow-300"
                                                            >
                                                                <Home className="mr-2 h-4 w-4" />
                                                                Desalugar
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator className="bg-gray-700" />
                                                        </>
                                                    )}

                                                    {vm.is_registered && vm.system_status !== 'rented' && vm.system_status !== 'occupied_queue' && (
                                                        <DropdownMenuItem
                                                            onClick={() => handleVMAction('unregister', vm.id)}
                                                            className="text-red-400 hover:text-red-300"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Remover Registro
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    {vms.length === 0 && (
                        <div className="text-center py-8">
                            <Server className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                            <p className="text-gray-400">Nenhuma VM encontrada</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Rent Dialog */}
            <Dialog open={rentDialog.open} onOpenChange={(open) => setRentDialog({ open, vmId: null })}>
                <DialogContent className="bg-gray-800 border-gray-700">
                    <DialogHeader>
                        <DialogTitle className="text-white">Alugar VM para Usuário</DialogTitle>
                        <DialogDescription className="text-gray-400">
                            Associe esta VM a um usuário específico com um plano definido.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-300 mb-2 block">
                                ID do Usuário (Discord)
                            </label>
                            <Input
                                placeholder="Ex: 123456789012345678"
                                value={rentData.userId}
                                onChange={(e) => setRentData(prev => ({ ...prev, userId: e.target.value }))}
                                className="bg-gray-700 border-gray-600 text-white"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-300 mb-2 block">
                                Nome do Plano
                            </label>
                            <Input
                                placeholder="Ex: Premium, VIP, Especial..."
                                value={rentData.planName}
                                onChange={(e) => setRentData(prev => ({ ...prev, planName: e.target.value }))}
                                className="bg-gray-700 border-gray-600 text-white"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-300 mb-2 block">
                                Duração (dias)
                            </label>
                            <Input
                                type="number"
                                min="1"
                                placeholder="Ex: 7, 15, 30..."
                                value={rentData.days}
                                onChange={(e) => setRentData(prev => ({ ...prev, days: e.target.value }))}
                                className="bg-gray-700 border-gray-600 text-white"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button 
                            variant="outline" 
                            onClick={() => setRentDialog({ open: false, vmId: null })}
                            className="border-gray-600 text-gray-300"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={() => handleVMAction('rent', rentDialog.vmId!, { 
                                userId: rentData.userId, 
                                planName: rentData.planName, 
                                days: rentData.days 
                            })}
                            disabled={!rentData.userId.trim() || !rentData.planName.trim() || !rentData.days || isProcessing === rentDialog.vmId}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {isProcessing === rentDialog.vmId ? 'Processando...' : 'Alugar VM'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reserve Dialog */}
            <Dialog open={reserveDialog.open} onOpenChange={(open) => setReserveDialog({ open, vmId: null })}>
                <DialogContent className="bg-gray-800 border-gray-700">
                    <DialogHeader>
                        <DialogTitle className="text-white">Reservar VM</DialogTitle>
                        <DialogDescription className="text-gray-400">
                            Informe o motivo da reserva. A VM ficará bloqueada e não poderá ser usada em filas ou por usuários.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Input
                            placeholder="Ex: Manutenção programada, teste específico..."
                            value={reserveReason}
                            onChange={(e) => setReserveReason(e.target.value)}
                            className="bg-gray-700 border-gray-600 text-white"
                        />
                    </div>
                    <DialogFooter>
                        <Button 
                            variant="outline" 
                            onClick={() => setReserveDialog({ open: false, vmId: null })}
                            className="border-gray-600 text-gray-300"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={() => handleVMAction('reserve', reserveDialog.vmId!, { reason: reserveReason })}
                            disabled={!reserveReason.trim() || isProcessing === reserveDialog.vmId}
                            className="bg-orange-600 hover:bg-orange-700"
                        >
                            {isProcessing === reserveDialog.vmId ? 'Reservando...' : 'Reservar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Permission Info */}
            <Card className="bg-blue-500/10 border-blue-500/30">
                <CardHeader>
                    <CardTitle className="text-blue-300 flex items-center">
                        <Shield className="w-5 h-5 mr-2" />
                        Hierarquia e Permissões
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-blue-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h4 className="font-semibold mb-2">Estados das VMs:</h4>
                            <ul className="space-y-1 text-xs">
                                <li>🟢 <strong>Disponível:</strong> Registrada, pode ir para filas ou usuários</li>
                                <li>🔵 <strong>Ocupada (Fila):</strong> Em uso pela fila automática</li>
                                <li>🟣 <strong>Alugada:</strong> Atribuída a um usuário específico</li>
                                <li>🟠 <strong>Reservada:</strong> Bloqueada pelo owner</li>
                                <li>⚪ <strong>Manutenção:</strong> Não registrada ou inativa</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-2">Permissões:</h4>
                            <ul className="space-y-1 text-xs">
                                <li><strong>Owner:</strong> Todas as ações (registrar, reservar, alugar, etc.)</li>
                                <li><strong>Admin:</strong> Apenas visualização (detalhes, usuários)</li>
                                <li><strong>Sistema:</strong> VMs disponíveis são atribuídas automaticamente</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}