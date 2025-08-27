'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
    HardDrive, 
    Server, 
    Play, 
    Square, 
    Trash2, 
    Plus, 
    Settings, 
    Users, 
    Clock,
    Activity,
    AlertTriangle,
    CheckCircle
} from "lucide-react";

interface UserDisk {
    id: string;
    user_id: string;
    disk_name: string;
    azure_disk_id?: string;
    azure_snapshot_id?: string;
    status: 'available' | 'in_use' | 'maintenance' | 'reserved';
    size_gb: number;
    disk_type: string;
    last_used_at?: string;
    created_by_admin?: string;
    notes?: string;
    created_at: string;
    profiles?: {
        discord_username: string;
        avatar_url: string;
    };
    created_by_admin_profile?: {
        discord_username: string;
    };
}

interface DiskVM {
    id: string;
    name: string;
    azure_vm_id?: string;
    azure_vm_name?: string;
    location: string;
    vm_size: string;
    resource_group: string;
    status: 'available' | 'occupied' | 'maintenance' | 'offline';
    public_ip?: string;
    private_ip?: string;
    username: string;
    password: string;
    max_concurrent_users: number;
    current_users: number;
    last_maintenance_at?: string;
    created_at: string;
}

interface DiskSession {
    id: string;
    user_id: string;
    user_disk_id: string;
    vm_id: string;
    plan_id: number;
    status: 'active' | 'completed' | 'expired' | 'terminated';
    session_duration_minutes: number;
    started_at: string;
    expires_at: string;
    ended_at?: string;
    last_activity_at?: string;
    termination_reason?: string;
    profiles?: {
        discord_username: string;
        avatar_url: string;
    };
    user_disks?: {
        disk_name: string;
        status: string;
    };
    disk_vms?: {
        name: string;
        public_ip?: string;
    };
    plans?: {
        name: string;
    };
}

interface Statistics {
    totalDisks: number;
    availableDisks: number;
    disksInUse: number;
    totalVMs: number;
    availableVMs: number;
    occupiedVMs: number;
    activeSessions: number;
}

export default function DisksTab() {
    const [userDisks, setUserDisks] = useState<UserDisk[]>([]);
    const [diskVMs, setDiskVMs] = useState<DiskVM[]>([]);
    const [activeSessions, setActiveSessions] = useState<DiskSession[]>([]);
    const [statistics, setStatistics] = useState<Statistics | null>(null);
    const [loading, setLoading] = useState(true);

    // Estados para modais
    const [showCreateDiskModal, setShowCreateDiskModal] = useState(false);
    const [showCreateVMModal, setShowCreateVMModal] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState('');

    // Estados para formulários
    const [diskForm, setDiskForm] = useState({
        user_id: '',
        disk_name: '',
        size_gb: 30,
        disk_type: 'Standard_LRS',
        notes: ''
    });

    const [vmForm, setVMForm] = useState({
        name: '',
        location: 'East US',
        vm_size: 'Standard_B2s',
        resource_group: 'darkcloud-rg',
        username: 'azureuser',
        password: '',
        max_concurrent_users: 1
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/disks');
            if (!response.ok) throw new Error('Erro ao buscar dados');
            
            const data = await response.json();
            setUserDisks(data.userDisks || []);
            setDiskVMs(data.vms || []);
            setActiveSessions(data.activeSessions || []);
            setStatistics(data.statistics || null);
        } catch (error) {
            console.error('Erro ao buscar dados:', error);
            toast.error('Erro ao carregar dados dos discos');
        } finally {
            setLoading(false);
        }
    };

    const createUserDisk = async () => {
        try {
            const response = await fetch('/api/admin/disks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'user-disk',
                    ...diskForm
                })
            });

            if (!response.ok) throw new Error('Erro ao criar disco');
            
            toast.success('Disco criado com sucesso!');
            setShowCreateDiskModal(false);
            setDiskForm({
                user_id: '',
                disk_name: '',
                size_gb: 30,
                disk_type: 'Standard_LRS',
                notes: ''
            });
            fetchData();
        } catch (error) {
            console.error('Erro ao criar disco:', error);
            toast.error('Erro ao criar disco');
        }
    };

    const createDiskVM = async () => {
        try {
            const response = await fetch('/api/admin/disks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'vm',
                    ...vmForm
                })
            });

            if (!response.ok) throw new Error('Erro ao criar VM');
            
            toast.success('VM criada com sucesso!');
            setShowCreateVMModal(false);
            setVMForm({
                name: '',
                location: 'East US',
                vm_size: 'Standard_B2s',
                resource_group: 'darkcloud-rg',
                username: 'azureuser',
                password: '',
                max_concurrent_users: 1
            });
            fetchData();
        } catch (error) {
            console.error('Erro ao criar VM:', error);
            toast.error('Erro ao criar VM');
        }
    };

    const updateVMStatus = async (vmId: string, status: string) => {
        try {
            const response = await fetch('/api/admin/disks', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'vm',
                    id: vmId,
                    status
                })
            });

            if (!response.ok) throw new Error('Erro ao atualizar VM');
            
            toast.success('Status da VM atualizado!');
            fetchData();
        } catch (error) {
            console.error('Erro ao atualizar VM:', error);
            toast.error('Erro ao atualizar VM');
        }
    };

    const endSession = async (sessionId: string, reason: string = 'Finalizado pelo admin') => {
        try {
            const response = await fetch('/api/admin/disks', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'session-end',
                    id: sessionId,
                    reason
                })
            });

            if (!response.ok) throw new Error('Erro ao finalizar sessão');
            
            toast.success('Sessão finalizada!');
            fetchData();
        } catch (error) {
            console.error('Erro ao finalizar sessão:', error);
            toast.error('Erro ao finalizar sessão');
        }
    };

    const deleteDisk = async (diskId: string) => {
        if (!confirm('Tem certeza que deseja deletar este disco?')) return;

        try {
            const response = await fetch(`/api/admin/disks?type=user-disk&id=${diskId}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Erro ao deletar disco');
            
            toast.success('Disco deletado!');
            fetchData();
        } catch (error) {
            console.error('Erro ao deletar disco:', error);
            toast.error('Erro ao deletar disco');
        }
    };

    const deleteVM = async (vmId: string) => {
        if (!confirm('Tem certeza que deseja deletar esta VM?')) return;

        try {
            const response = await fetch(`/api/admin/disks?type=vm&id=${vmId}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Erro ao deletar VM');
            
            toast.success('VM deletada!');
            fetchData();
        } catch (error) {
            console.error('Erro ao deletar VM:', error);
            toast.error('Erro ao deletar VM');
        }
    };

    const getStatusBadge = (status: string, type: 'disk' | 'vm' | 'session') => {
        const variants: Record<string, any> = {
            disk: {
                available: { variant: 'default', icon: CheckCircle, color: 'text-green-600' },
                in_use: { variant: 'secondary', icon: Activity, color: 'text-blue-600' },
                maintenance: { variant: 'destructive', icon: AlertTriangle, color: 'text-orange-600' },
                reserved: { variant: 'outline', icon: Clock, color: 'text-purple-600' }
            },
            vm: {
                available: { variant: 'default', icon: CheckCircle, color: 'text-green-600' },
                occupied: { variant: 'secondary', icon: Activity, color: 'text-blue-600' },
                maintenance: { variant: 'destructive', icon: AlertTriangle, color: 'text-orange-600' },
                offline: { variant: 'outline', icon: Square, color: 'text-gray-600' }
            },
            session: {
                active: { variant: 'default', icon: Play, color: 'text-green-600' },
                completed: { variant: 'outline', icon: CheckCircle, color: 'text-gray-600' },
                expired: { variant: 'destructive', icon: Clock, color: 'text-red-600' },
                terminated: { variant: 'secondary', icon: Square, color: 'text-orange-600' }
            }
        };

        const config = variants[type][status] || variants[type].available;
        const Icon = config.icon;

        return (
            <Badge variant={config.variant} className="gap-1">
                <Icon className={`h-3 w-3 ${config.color}`} />
                {status}
            </Badge>
        );
    };

    const formatTimeRemaining = (expiresAt: string) => {
        const now = new Date();
        const expires = new Date(expiresAt);
        const diff = expires.getTime() - now.getTime();
        
        if (diff <= 0) return 'Expirado';
        
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        }
        return `${minutes}m`;
    };

    if (loading) {
        return <div className="p-4">Carregando...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Statistics Cards */}
            {statistics && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total de Discos</CardTitle>
                            <HardDrive className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.totalDisks}</div>
                            <p className="text-xs text-muted-foreground">{statistics.availableDisks} disponíveis</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">VMs Ativas</CardTitle>
                            <Server className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.totalVMs}</div>
                            <p className="text-xs text-muted-foreground">{statistics.availableVMs} disponíveis</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Sessões Ativas</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.activeSessions}</div>
                            <p className="text-xs text-muted-foreground">Em uso agora</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Taxa de Uso</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {statistics.totalVMs > 0 ? 
                                    Math.round((statistics.occupiedVMs / statistics.totalVMs) * 100) : 0}%
                            </div>
                            <p className="text-xs text-muted-foreground">VMs ocupadas</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            <Tabs defaultValue="sessions" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="sessions">Sessões Ativas</TabsTrigger>
                    <TabsTrigger value="disks">Discos de Usuários</TabsTrigger>
                    <TabsTrigger value="vms">VMs do Sistema</TabsTrigger>
                </TabsList>

                {/* Sessões Ativas */}
                <TabsContent value="sessions" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Sessões Ativas</h3>
                        <Button onClick={fetchData}>Atualizar</Button>
                    </div>

                    <div className="grid gap-4">
                        {activeSessions.map((session) => (
                            <Card key={session.id}>
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-base">
                                                {session.profiles?.discord_username || 'Usuário Desconhecido'}
                                            </CardTitle>
                                            <CardDescription>
                                                Disco: {session.user_disks?.disk_name} | 
                                                VM: {session.disk_vms?.name} | 
                                                Plano: {session.plans?.name}
                                            </CardDescription>
                                        </div>
                                        <div className="flex gap-2">
                                            {getStatusBadge(session.status, 'session')}
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => endSession(session.id)}
                                            >
                                                <Square className="h-4 w-4 mr-1" />
                                                Finalizar
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <strong>Iniciou:</strong><br />
                                            {new Date(session.started_at).toLocaleString('pt-BR')}
                                        </div>
                                        <div>
                                            <strong>Expira:</strong><br />
                                            {new Date(session.expires_at).toLocaleString('pt-BR')}
                                        </div>
                                        <div>
                                            <strong>Tempo Restante:</strong><br />
                                            {formatTimeRemaining(session.expires_at)}
                                        </div>
                                        <div>
                                            <strong>IP Público:</strong><br />
                                            {session.disk_vms?.public_ip || 'N/A'}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {activeSessions.length === 0 && (
                            <Card>
                                <CardContent className="text-center py-8">
                                    <p className="text-muted-foreground">Nenhuma sessão ativa no momento</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </TabsContent>

                {/* Discos de Usuários */}
                <TabsContent value="disks" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Discos de Usuários</h3>
                        <Dialog open={showCreateDiskModal} onOpenChange={setShowCreateDiskModal}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Criar Disco
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Criar Novo Disco</DialogTitle>
                                    <DialogDescription>
                                        Crie um novo disco para um usuário
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="user_id">ID do Usuário</Label>
                                        <Input
                                            id="user_id"
                                            value={diskForm.user_id}
                                            onChange={(e) => setDiskForm({...diskForm, user_id: e.target.value})}
                                            placeholder="UUID do usuário"
                                        />
                                    </div>
                                    
                                    <div>
                                        <Label htmlFor="disk_name">Nome do Disco</Label>
                                        <Input
                                            id="disk_name"
                                            value={diskForm.disk_name}
                                            onChange={(e) => setDiskForm({...diskForm, disk_name: e.target.value})}
                                            placeholder="Nome único do disco"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="size_gb">Tamanho (GB)</Label>
                                        <Input
                                            id="size_gb"
                                            type="number"
                                            value={diskForm.size_gb}
                                            onChange={(e) => setDiskForm({...diskForm, size_gb: parseInt(e.target.value)})}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="disk_type">Tipo do Disco</Label>
                                        <Select value={diskForm.disk_type} onValueChange={(value) => setDiskForm({...diskForm, disk_type: value})}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Standard_LRS">Standard LRS</SelectItem>
                                                <SelectItem value="Premium_LRS">Premium LRS</SelectItem>
                                                <SelectItem value="StandardSSD_LRS">StandardSSD LRS</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label htmlFor="notes">Observações</Label>
                                        <Textarea
                                            id="notes"
                                            value={diskForm.notes}
                                            onChange={(e) => setDiskForm({...diskForm, notes: e.target.value})}
                                            placeholder="Observações opcionais"
                                        />
                                    </div>

                                    <Button onClick={createUserDisk} className="w-full">
                                        Criar Disco
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="grid gap-4">
                        {userDisks.map((disk) => (
                            <Card key={disk.id}>
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-base">{disk.disk_name}</CardTitle>
                                            <CardDescription>
                                                Usuário: {disk.profiles?.discord_username || 'Desconhecido'} | 
                                                {disk.size_gb}GB {disk.disk_type}
                                            </CardDescription>
                                        </div>
                                        <div className="flex gap-2">
                                            {getStatusBadge(disk.status, 'disk')}
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => deleteDisk(disk.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                {disk.notes && (
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground">{disk.notes}</p>
                                    </CardContent>
                                )}
                            </Card>
                        ))}

                        {userDisks.length === 0 && (
                            <Card>
                                <CardContent className="text-center py-8">
                                    <p className="text-muted-foreground">Nenhum disco encontrado</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </TabsContent>

                {/* VMs do Sistema */}
                <TabsContent value="vms" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">VMs do Sistema</h3>
                        <Dialog open={showCreateVMModal} onOpenChange={setShowCreateVMModal}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Criar VM
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Criar Nova VM</DialogTitle>
                                    <DialogDescription>
                                        Adicione uma nova VM ao sistema de discos
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="vm_name">Nome da VM</Label>
                                        <Input
                                            id="vm_name"
                                            value={vmForm.name}
                                            onChange={(e) => setVMForm({...vmForm, name: e.target.value})}
                                            placeholder="DiskVM-01"
                                        />
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="location">Localização</Label>
                                            <Input
                                                id="location"
                                                value={vmForm.location}
                                                onChange={(e) => setVMForm({...vmForm, location: e.target.value})}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="vm_size">Tamanho da VM</Label>
                                            <Input
                                                id="vm_size"
                                                value={vmForm.vm_size}
                                                onChange={(e) => setVMForm({...vmForm, vm_size: e.target.value})}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="resource_group">Resource Group</Label>
                                        <Input
                                            id="resource_group"
                                            value={vmForm.resource_group}
                                            onChange={(e) => setVMForm({...vmForm, resource_group: e.target.value})}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="username">Usuário</Label>
                                            <Input
                                                id="username"
                                                value={vmForm.username}
                                                onChange={(e) => setVMForm({...vmForm, username: e.target.value})}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="password">Senha</Label>
                                            <Input
                                                id="password"
                                                type="password"
                                                value={vmForm.password}
                                                onChange={(e) => setVMForm({...vmForm, password: e.target.value})}
                                                placeholder="Senha da VM"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="max_users">Máximo de Usuários Simultâneos</Label>
                                        <Input
                                            id="max_users"
                                            type="number"
                                            value={vmForm.max_concurrent_users}
                                            onChange={(e) => setVMForm({...vmForm, max_concurrent_users: parseInt(e.target.value)})}
                                        />
                                    </div>

                                    <Button onClick={createDiskVM} className="w-full">
                                        Criar VM
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="grid gap-4">
                        {diskVMs.map((vm) => (
                            <Card key={vm.id}>
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-base">{vm.name}</CardTitle>
                                            <CardDescription>
                                                {vm.vm_size} | {vm.location} | {vm.current_users}/{vm.max_concurrent_users} usuários
                                            </CardDescription>
                                        </div>
                                        <div className="flex gap-2">
                                            {getStatusBadge(vm.status, 'vm')}
                                            <Select 
                                                value={vm.status} 
                                                onValueChange={(value) => updateVMStatus(vm.id, value)}
                                            >
                                                <SelectTrigger className="w-32">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="available">Disponível</SelectItem>
                                                    <SelectItem value="maintenance">Manutenção</SelectItem>
                                                    <SelectItem value="offline">Offline</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => deleteVM(vm.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <strong>IP Público:</strong><br />
                                            {vm.public_ip || 'N/A'}
                                        </div>
                                        <div>
                                            <strong>Usuário:</strong><br />
                                            {vm.username}
                                        </div>
                                        <div>
                                            <strong>Resource Group:</strong><br />
                                            {vm.resource_group}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {diskVMs.length === 0 && (
                            <Card>
                                <CardContent className="text-center py-8">
                                    <p className="text-muted-foreground">Nenhuma VM encontrada</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}