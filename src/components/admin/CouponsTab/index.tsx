'use client';

import { useState, useEffect } from 'react';
import { toast } from "sonner";
import { createClient } from '@/utils/supabase/client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Edit, Copy, Calendar, Percent, DollarSign } from 'lucide-react';

// Tipos
interface Coupon {
    id: string;
    code: string;
    name: string;
    description: string | null;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    max_uses: number | null;
    current_uses: number;
    expires_at: string | null;
    is_active: boolean;
    minimum_order_value: number | null;
    applicable_plans: string[] | null;
}

interface Plan {
    id: string;
    name: string;
}

export default function CouponsTab() {
    const supabase = createClient();
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [currentCoupon, setCurrentCoupon] = useState<Partial<Coupon>>({});
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [couponsRes, plansRes] = await Promise.all([
                    fetch('/api/admin/coupons'),
                    fetch('/api/admin/plans')
                ]);

                if (!couponsRes.ok || !plansRes.ok) {
                    throw new Error('Falha ao buscar dados do servidor.');
                }

                const couponsData = await couponsRes.json();
                const plansData = await plansRes.json();

                setCoupons(couponsData || []);
                setPlans(plansData || []);

            } catch (error) {
                const e = error as Error;
                toast.error('Erro ao buscar dados', { description: e.message });
            }
            setLoading(false);
        };
        fetchData();
    }, []);

    const handleSaveCoupon = async () => {
        setIsSaving(true);
        const couponToSave = { ...currentCoupon };

        const method = couponToSave.id ? 'PUT' : 'POST';
        const response = await fetch('/api/admin/coupons', {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(couponToSave),
        });

        const result = await response.json();

        if (!response.ok) {
            toast.error('Erro ao salvar cupom', { description: result.error || 'Ocorreu um erro desconhecido' });
        } else {
            toast.success('Sucesso!', { description: `Cupom "${result.code}" salvo com sucesso.` });
            if (currentCoupon.id) {
                setCoupons(coupons.map(c => c.id === result.id ? result : c));
            } else {
                setCoupons([...coupons, result]);
            }
            setIsDialogOpen(false);
        }
        setIsSaving(false);
    };

    const handleDeleteCoupon = async (couponId: string) => {
        const response = await fetch('/api/admin/coupons', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: couponId }),
        });

        if (response.ok) {
            setCoupons(coupons.filter(c => c.id !== couponId));
            toast.success('Cupom excluído com sucesso');
        } else {
            toast.error('Erro ao excluir cupom');
        }
    };

    const openDialog = (coupon?: Coupon) => {
        setCurrentCoupon(coupon || {
            code: '',
            name: '',
            description: '',
            discount_type: 'percentage',
            discount_value: 0,
            max_uses: null,
            current_uses: 0,
            expires_at: null,
            is_active: true,
            minimum_order_value: null,
            applicable_plans: null
        });
        setIsDialogOpen(true);
    };

    const generateCouponCode = () => {
        const code = Math.random().toString(36).substr(2, 8).toUpperCase();
        setCurrentCoupon({ ...currentCoupon, code });
    };

    const copyCouponCode = (code: string) => {
        navigator.clipboard.writeText(code);
        toast.success('Código copiado!');
    };

    const formatDiscountValue = (coupon: Coupon) => {
        return coupon.discount_type === 'percentage' 
            ? `${coupon.discount_value}%` 
            : `R$ ${coupon.discount_value.toFixed(2)}`;
    };

    const getUsageText = (coupon: Coupon) => {
        if (coupon.max_uses === null) return `${coupon.current_uses} / Ilimitado`;
        return `${coupon.current_uses} / ${coupon.max_uses}`;
    };

    const getExpirationText = (coupon: Coupon) => {
        if (!coupon.expires_at) return 'Nunca expira';
        const date = new Date(coupon.expires_at);
        return date.toLocaleDateString('pt-BR');
    };

    if (loading) {
        return <div>Carregando cupons...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-semibold">Gerenciamento de Cupons</h2>
                    <p className="text-gray-400">Crie e gerencie cupons de desconto para os clientes.</p>
                </div>
                <Button onClick={() => openDialog()}>Criar Novo Cupom</Button>
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Código</TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead>Desconto</TableHead>
                            <TableHead>Uso</TableHead>
                            <TableHead>Expira</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {coupons.map((coupon) => (
                            <TableRow key={coupon.id}>
                                <TableCell className="font-mono">
                                    <div className="flex items-center gap-2">
                                        <span>{coupon.code}</span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => copyCouponCode(coupon.code)}
                                            className="p-1 h-auto"
                                        >
                                            <Copy className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </TableCell>
                                <TableCell>{coupon.name}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1">
                                        {coupon.discount_type === 'percentage' ? <Percent className="h-3 w-3" /> : <DollarSign className="h-3 w-3" />}
                                        {formatDiscountValue(coupon)}
                                    </div>
                                </TableCell>
                                <TableCell>{getUsageText(coupon)}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {getExpirationText(coupon)}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={coupon.is_active ? "default" : "secondary"}>
                                        {coupon.is_active ? 'Ativo' : 'Inativo'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="outline" size="sm" onClick={() => openDialog(coupon)}>
                                            <Edit className="h-3 w-3" />
                                        </Button>
                                        <Button variant="destructive" size="sm" onClick={() => handleDeleteCoupon(coupon.id)}>
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{currentCoupon.id ? 'Editar Cupom' : 'Criar Novo Cupom'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {/* Código do cupom */}
                        <div className="grid grid-cols-4 gap-2">
                            <div className="col-span-3">
                                <Label>Código do Cupom</Label>
                                <Input 
                                    placeholder="DESCONTO10" 
                                    value={currentCoupon.code || ''} 
                                    onChange={(e) => setCurrentCoupon({ ...currentCoupon, code: e.target.value.toUpperCase() })} 
                                />
                            </div>
                            <div className="flex items-end">
                                <Button type="button" variant="outline" onClick={generateCouponCode}>
                                    Gerar
                                </Button>
                            </div>
                        </div>

                        {/* Nome e descrição */}
                        <Input 
                            placeholder="Nome do cupom" 
                            value={currentCoupon.name || ''} 
                            onChange={(e) => setCurrentCoupon({ ...currentCoupon, name: e.target.value })} 
                        />
                        
                        <Textarea 
                            placeholder="Descrição do cupom (opcional)" 
                            value={currentCoupon.description || ''} 
                            onChange={(e) => setCurrentCoupon({ ...currentCoupon, description: e.target.value })} 
                        />

                        {/* Tipo e valor do desconto */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Tipo de Desconto</Label>
                                <Select 
                                    value={currentCoupon.discount_type} 
                                    onValueChange={(value) => setCurrentCoupon({ ...currentCoupon, discount_type: value as any })}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                                        <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Valor do Desconto</Label>
                                <Input 
                                    type="number" 
                                    step="0.01"
                                    placeholder={currentCoupon.discount_type === 'percentage' ? '10' : '5.00'} 
                                    value={currentCoupon.discount_value || ''} 
                                    onChange={(e) => setCurrentCoupon({ ...currentCoupon, discount_value: parseFloat(e.target.value) || 0 })} 
                                />
                            </div>
                        </div>

                        {/* Limites de uso */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Máximo de Usos (deixe vazio para ilimitado)</Label>
                                <Input 
                                    type="number" 
                                    placeholder="100" 
                                    value={currentCoupon.max_uses || ''} 
                                    onChange={(e) => setCurrentCoupon({ ...currentCoupon, max_uses: e.target.value ? parseInt(e.target.value) : null })} 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Valor Mínimo do Pedido (R$)</Label>
                                <Input 
                                    type="number" 
                                    step="0.01"
                                    placeholder="50.00" 
                                    value={currentCoupon.minimum_order_value || ''} 
                                    onChange={(e) => setCurrentCoupon({ ...currentCoupon, minimum_order_value: e.target.value ? parseFloat(e.target.value) : null })} 
                                />
                            </div>
                        </div>

                        {/* Data de expiração */}
                        <div className="space-y-2">
                            <Label>Data de Expiração (deixe vazio para nunca expirar)</Label>
                            <Input 
                                type="datetime-local" 
                                value={currentCoupon.expires_at ? new Date(currentCoupon.expires_at).toISOString().slice(0, 16) : ''} 
                                onChange={(e) => setCurrentCoupon({ ...currentCoupon, expires_at: e.target.value ? new Date(e.target.value).toISOString() : null })} 
                            />
                        </div>

                        {/* Planos aplicáveis */}
                        <div className="space-y-2">
                            <Label>Aplicável aos Planos (deixe vazio para todos)</Label>
                            <Select 
                                value={currentCoupon.applicable_plans ? 'specific' : 'all'} 
                                onValueChange={(value) => {
                                    if (value === 'all') {
                                        setCurrentCoupon({ ...currentCoupon, applicable_plans: null });
                                    } else {
                                        setCurrentCoupon({ ...currentCoupon, applicable_plans: [] });
                                    }
                                }}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os Planos</SelectItem>
                                    <SelectItem value="specific">Planos Específicos</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Switch ativo */}
                        <div className="flex items-center space-x-2">
                            <Switch 
                                id="is_active" 
                                checked={currentCoupon.is_active !== false} 
                                onCheckedChange={(checked) => setCurrentCoupon({ ...currentCoupon, is_active: checked })} 
                            />
                            <Label htmlFor="is_active">Cupom Ativo</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                        <Button onClick={handleSaveCoupon} disabled={isSaving}>
                            {isSaving ? 'Salvando...' : 'Salvar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}