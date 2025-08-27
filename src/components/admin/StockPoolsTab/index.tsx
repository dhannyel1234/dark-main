'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createClient } from '@/utils/supabase/client';

interface StockPool {
    id: string;
    name: string;
    quantity: number;
}

const StockPoolsTab = () => {
    const supabase = createClient();
    const [pools, setPools] = useState<StockPool[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentPool, setCurrentPool] = useState<Partial<StockPool>>({ name: '', quantity: 0 });

    useEffect(() => {
        const fetchPools = async () => {
            setLoading(true);
            const { data, error } = await supabase.from('stock_pools').select('*');
            if (error) {
                toast.error('Erro ao buscar pools de estoque', { description: error.message });
            } else {
                setPools(data || []);
            }
            setLoading(false);
        };
        fetchPools();
    }, [supabase]);

    const handleSave = async () => {
        const poolToSave = { ...currentPool };
        
        // Lógica de Upsert manual via API
        const method = poolToSave.id ? 'PUT' : 'POST';
        const response = await fetch('/api/admin/stock-pools', {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(poolToSave),
        });

        const result = await response.json();

        if (!response.ok) {
            toast.error('Erro ao salvar pool', { description: result.error || 'Ocorreu um erro desconhecido' });
        } else {
            toast.success('Sucesso!', { description: `Pool de estoque ${poolToSave.id ? 'atualizado' : 'criado'} com sucesso.` });
            if (poolToSave.id) {
                setPools(pools.map(p => p.id === result.id ? result : p));
            } else {
                setPools([...pools, result]);
            }
            setIsDialogOpen(false);
        }
    };
    
    const handleDelete = async (id: string) => {
        const response = await fetch('/api/admin/stock-pools', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
        });

        if (!response.ok) {
            const result = await response.json();
            toast.error('Erro ao deletar pool', { description: result.error || 'Ocorreu um erro desconhecido' });
        } else {
            toast.success('Sucesso!', { description: 'Pool de estoque deletado.' });
            setPools(pools.filter(p => p.id !== id));
        }
    };

    const openDialog = (pool?: StockPool) => {
        setCurrentPool(pool || { name: '', quantity: 0 });
        setIsDialogOpen(true);
    };

    if (loading) {
        return <div>Carregando pools de estoque...</div>;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-semibold">Grupos de Estoque</h2>
                    <p className="text-gray-400">Crie e gerencie estoques compartilhados entre diferentes planos.</p>
                </div>
                <Button onClick={() => openDialog()}>Novo Grupo de Estoque</Button>
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome do Grupo</TableHead>
                            <TableHead>Quantidade em Estoque</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {pools.map((pool) => (
                            <TableRow key={pool.id}>
                                <TableCell className="font-medium">{pool.name}</TableCell>
                                <TableCell>{pool.quantity}</TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button variant="outline" size="sm" onClick={() => openDialog(pool)}>Editar</Button>
                                    <Button variant="destructive" size="sm" onClick={() => handleDelete(pool.id)}>Deletar</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{currentPool.id ? 'Editar Grupo de Estoque' : 'Novo Grupo de Estoque'}</DialogTitle>
                        <DialogDescription>
                            Preencha os detalhes do grupo de estoque.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Nome</Label>
                            <Input id="name" value={currentPool.name} onChange={(e) => setCurrentPool({ ...currentPool, name: e.target.value })} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="quantity" className="text-right">Quantidade</Label>
                            <Input id="quantity" type="number" value={currentPool.quantity} onChange={(e) => setCurrentPool({ ...currentPool, quantity: parseInt(e.target.value, 10) || 0 })} className="col-span-3" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSave}>Salvar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default StockPoolsTab;