'use client';

import { useState, useEffect } from 'react';
import { toast } from "sonner";
import { createClient } from '@/utils/supabase/client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Edit, Trash2, Plus, Eye, EyeOff } from 'lucide-react';

// Tipos atualizados
interface Plan {
    id: string;
    name: string;
    price: number;
    duration_days: number | null;
    duration_type: 'days' | 'hours';
    order: number;
    limited_session: boolean;
    saves_files: boolean;
    has_queue: boolean;
    description: string | null;
    is_active: boolean;
    individual_stock: number;
    provisioning_type: 'individual' | 'queue_manual' | 'queue_auto';
    stock_pool_id: string | null;
    highlight_color: string | null;
    vm_config?: {
        session_duration_minutes?: number;
        queue_auto_enabled?: boolean;
        spot_warning_minutes?: number;
    };
    // Campos individuais para facilitar o form
    session_duration_minutes?: number;
    queue_auto_enabled?: boolean;
    spot_warning_minutes?: number;
}

interface StockPool {
    id: string;
    name: string;
}

export default function PlansManagement() {
    const supabase = createClient();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [stockPools, setStockPools] = useState<StockPool[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [currentPlan, setCurrentPlan] = useState<Partial<Plan>>({});
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);
    const [togglingPlanId, setTogglingPlanId] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [plansRes, poolsRes] = await Promise.all([
                    fetch('/api/admin/plans'),
                    fetch('/api/admin/stock-pools')
                ]);

                if (!plansRes.ok || !poolsRes.ok) {
                    throw new Error('Falha ao buscar dados do servidor.');
                }

                const plansData = await plansRes.json();
                const poolsData = await poolsRes.json();

                // Processar planos para extrair configurações do vm_config
                const processedPlans = (plansData || []).map((plan: any) => ({
                    ...plan,
                    session_duration_minutes: plan.vm_config?.session_duration_minutes || 60,
                    queue_auto_enabled: plan.vm_config?.queue_auto_enabled || false,
                    spot_warning_minutes: plan.vm_config?.spot_warning_minutes || 5
                }));
                setPlans(processedPlans);
                setStockPools(poolsData || []);

            } catch (error) {
                const e = error as Error;
                toast.error('Erro ao buscar dados', { description: e.message });
            }
            setLoading(false);
        };
        fetchData();
    }, []);

    const handleSavePlan = async () => {
        setIsSaving(true);
        const planToSave = { ...currentPlan };

        const method = planToSave.id ? 'PUT' : 'POST';
        const response = await fetch('/api/admin/plans', {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(planToSave),
        });

        const result = await response.json();

        if (!response.ok) {
            toast.error('Erro ao salvar plano', { description: result.error || 'Ocorreu um erro desconhecido' });
        } else {
            toast.success('Sucesso!', { description: `Plano "${result.name}" salvo com sucesso.` });
            if (currentPlan.id) {
                setPlans(plans.map(p => p.id === result.id ? result : p));
            } else {
                setPlans([...plans, result]);
            }
            setIsDialogOpen(false);
        }
        setIsSaving(false);
    };

    const handleTogglePlan = async (planId: string, isActive: boolean) => {
        setTogglingPlanId(planId);
        try {
            const response = await fetch('/api/admin/plans', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: planId,
                    is_active: !isActive
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                toast.error('Erro ao alterar status do plano', { description: result.error || 'Erro desconhecido' });
            } else {
                toast.success(`Plano ${!isActive ? 'ativado' : 'desativado'} com sucesso!`);
                setPlans(plans.map(p => p.id === planId ? { ...p, is_active: !isActive } : p));
            }
        } catch (error) {
            toast.error('Erro ao alterar status do plano');
        } finally {
            setTogglingPlanId(null);
        }
    };

    const handleDeletePlan = async (planId: string) => {
        setDeletingPlanId(planId);
        try {
            const response = await fetch('/api/admin/plans', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: planId }),
            });

            const result = await response.json();

            if (!response.ok) {
                toast.error('Erro ao deletar plano', { description: result.error });
            } else {
                toast.success('Plano deletado com sucesso!');
                setPlans(plans.filter(p => p.id !== planId));
            }
        } catch (error) {
            toast.error('Erro ao deletar plano');
        } finally {
            setDeletingPlanId(null);
        }
    };

    const openDialog = (plan?: Plan) => {
        setCurrentPlan(plan || {
            name: '', price: 0, duration_days: 30, duration_type: 'days', order: 0,
            limited_session: true, saves_files: false, has_queue: true,
            description: '', is_active: true,
            individual_stock: 10, provisioning_type: 'individual', stock_pool_id: null, highlight_color: '',
            session_duration_minutes: 60, queue_auto_enabled: false, spot_warning_minutes: 5
        });
        setIsDialogOpen(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                    <p className="mt-2 text-muted-foreground">Carregando planos...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                Gerenciamento de Planos
                                <Badge variant="secondary">{plans.length} planos</Badge>
                            </CardTitle>
                            <CardDescription>
                                Configure os planos de assinatura e tipos de provisionamento disponíveis para os usuários.
                            </CardDescription>
                        </div>
                        <Button onClick={() => openDialog()} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Criar Novo Plano
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {plans.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground">Nenhum plano configurado</p>
                            <Button onClick={() => openDialog()} variant="outline" className="mt-4">
                                Criar primeiro plano
                            </Button>
                        </div>
                    ) : (
                        <div className="rounded-lg border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Plano</TableHead>
                                        <TableHead>Preço</TableHead>
                                        <TableHead>Estoque</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {plans.map((plan) => (
                                        <TableRow key={plan.id} className="group">
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    {plan.highlight_color && (
                                                        <div
                                                            className="w-3 h-3 rounded-full border"
                                                            style={{ backgroundColor: plan.highlight_color }}
                                                        />
                                                    )}
                                                    <div>
                                                        <div className="font-medium">{plan.name}</div>
                                                        {plan.description && (
                                                            <div className="text-sm text-muted-foreground line-clamp-1">
                                                                {plan.description}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-mono font-medium">
                                                    R$ {plan.price.toFixed(2)}
                                                </div>
                                                {plan.duration_days && (
                                                    <div className="text-xs text-muted-foreground">
                                                        {plan.duration_days} {plan.duration_type === 'days' 
                                                            ? (plan.duration_days === 1 ? 'dia' : 'dias')
                                                            : (plan.duration_days === 1 ? 'hora' : 'horas')
                                                        }
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {plan.stock_pool_id ? 'Pool Compartilhado' : `${plan.individual_stock} unidades`}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={
                                                    plan.provisioning_type === 'individual' ? 'default' :
                                                        plan.provisioning_type === 'queue_manual' ? 'secondary' : 'destructive'
                                                }>
                                                    {plan.provisioning_type === 'individual' && 'Máquina Própria'}
                                                    {plan.provisioning_type === 'queue_manual' && 'Fila Manual'}
                                                    {plan.provisioning_type === 'queue_auto' && 'Fila Automática'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Switch
                                                        checked={plan.is_active}
                                                        onCheckedChange={() => handleTogglePlan(plan.id, plan.is_active)}
                                                        disabled={togglingPlanId === plan.id}
                                                    />
                                                    <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                                                        {plan.is_active ? (
                                                            <>
                                                                <Eye className="h-3 w-3 mr-1" />
                                                                Ativo
                                                            </>
                                                        ) : (
                                                            <>
                                                                <EyeOff className="h-3 w-3 mr-1" />
                                                                Inativo
                                                            </>
                                                        )}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => openDialog(plan)}
                                                        className="gap-1"
                                                    >
                                                        <Edit className="h-3 w-3" />
                                                        Editar
                                                    </Button>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                className="gap-1"
                                                                disabled={deletingPlanId === plan.id}
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                                Deletar
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Deletar Plano</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Tem certeza que deseja deletar o plano "{plan.name}"?
                                                                    Esta ação irá desativá-lo permanentemente e não poderá ser desfeita.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => handleDeletePlan(plan.id)}
                                                                    className="bg-destructive text-destructive-foreground"
                                                                >
                                                                    Confirmar Exclusão
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{currentPlan.id ? 'Editar Plano' : 'Criar Novo Plano'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Input placeholder="Nome do Plano" value={currentPlan.name || ''} onChange={(e) => setCurrentPlan({ ...currentPlan, name: e.target.value })} />
                        <Input type="number" placeholder="Preço (ex: 49.90)" value={currentPlan.price || ''} onChange={(e) => setCurrentPlan({ ...currentPlan, price: parseFloat(e.target.value) || 0 })} />

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Duração</Label>
                                <Input type="number" placeholder="Duração (deixe em branco para vitalício)" value={currentPlan.duration_days || ''} onChange={(e) => setCurrentPlan({ ...currentPlan, duration_days: e.target.value ? parseInt(e.target.value) : null })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Tipo de Duração</Label>
                                <Select value={currentPlan.duration_type || 'days'} onValueChange={(value) => setCurrentPlan({ ...currentPlan, duration_type: value as 'days' | 'hours' })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="days">Dias</SelectItem>
                                        <SelectItem value="hours">Horas</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Ordem de Exibição</Label>
                                <Input type="number" placeholder="Ordem (menor número aparece primeiro)" value={currentPlan.order || 0} onChange={(e) => setCurrentPlan({ ...currentPlan, order: parseInt(e.target.value) || 0 })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Cor de Destaque</Label>
                                <Input placeholder="Cor (ex: yellow, #FF5733)" value={currentPlan.highlight_color || ''} onChange={(e) => setCurrentPlan({ ...currentPlan, highlight_color: e.target.value })} />
                            </div>
                        </div>

                        <Input placeholder="Descrição" value={currentPlan.description || ''} onChange={(e) => setCurrentPlan({ ...currentPlan, description: e.target.value })} />

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Provisionamento</Label>
                                <Select value={currentPlan.provisioning_type} onValueChange={(value) => setCurrentPlan({ ...currentPlan, provisioning_type: value as any })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="individual">Máquina Própria</SelectItem>
                                        <SelectItem value="queue_manual">Fila Manual</SelectItem>
                                        <SelectItem value="queue_auto">Fila Automática</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Grupo de Estoque</Label>
                                <Select value={currentPlan.stock_pool_id || 'individual'} onValueChange={(value) => setCurrentPlan({ ...currentPlan, stock_pool_id: value === 'individual' ? null : value })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="individual">Nenhum (Estoque Individual)</SelectItem>
                                        {stockPools.map(pool => <SelectItem key={pool.id} value={pool.id}>{pool.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {!currentPlan.stock_pool_id && (
                            <div className="space-y-2">
                                <Label>Estoque Individual</Label>
                                <Input type="number" placeholder="Quantidade em estoque" value={currentPlan.individual_stock || 0} onChange={(e) => setCurrentPlan({ ...currentPlan, individual_stock: parseInt(e.target.value) || 0 })} />
                            </div>
                        )}

                        {/* Configurações específicas para Fila Automática */}
                        {currentPlan.provisioning_type === 'queue_auto' && (
                            <div className="space-y-4 p-4 border rounded-lg bg-gray-900 dark:bg-gray-900">
                                <h4 className="font-medium text-sm">Configurações de Fila Automática</h4>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Duração da Sessão (minutos)</Label>
                                        <Input
                                            type="number"
                                            placeholder="60"
                                            value={currentPlan.session_duration_minutes || 60}
                                            onChange={(e) => setCurrentPlan({ ...currentPlan, session_duration_minutes: parseInt(e.target.value) || 60 })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Aviso antes do Spot (minutos)</Label>
                                        <Input
                                            type="number"
                                            placeholder="5"
                                            value={currentPlan.spot_warning_minutes || 5}
                                            onChange={(e) => setCurrentPlan({ ...currentPlan, spot_warning_minutes: parseInt(e.target.value) || 5 })}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="queue_auto_enabled"
                                        checked={currentPlan.queue_auto_enabled || false}
                                        onCheckedChange={(checked) => setCurrentPlan({ ...currentPlan, queue_auto_enabled: checked })}
                                    />
                                    <Label htmlFor="queue_auto_enabled">Fila Automática Ativada</Label>
                                </div>
                            </div>
                        )}

                        {/* Configurações de características do plano */}
                        <div className="space-y-4 p-4 border rounded-lg bg-gray-900 dark:bg-gray-900">
                            <h4 className="font-medium text-sm">Características do Plano</h4>

                            <div className="grid grid-cols-1 gap-4">
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="limited_session"
                                        checked={currentPlan.limited_session || false}
                                        onCheckedChange={(checked) => setCurrentPlan({ ...currentPlan, limited_session: checked })}
                                    />
                                    <Label htmlFor="limited_session">Sessão Limitada</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="saves_files"
                                        checked={currentPlan.saves_files || false}
                                        onCheckedChange={(checked) => setCurrentPlan({ ...currentPlan, saves_files: checked })}
                                    />
                                    <Label htmlFor="saves_files">Salva os Arquivos</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="has_queue"
                                        checked={currentPlan.has_queue || false}
                                        onCheckedChange={(checked) => setCurrentPlan({ ...currentPlan, has_queue: checked })}
                                    />
                                    <Label htmlFor="has_queue">Tem Fila de Máquinas</Label>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Switch id="is_active" checked={currentPlan.is_active} onCheckedChange={(checked) => setCurrentPlan({ ...currentPlan, is_active: checked })} />
                            <Label htmlFor="is_active">Plano Ativo</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                        <Button onClick={handleSavePlan} disabled={isSaving}>{isSaving ? 'Salvando...' : 'Salvar'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}