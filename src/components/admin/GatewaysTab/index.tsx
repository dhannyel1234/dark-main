'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/utils/supabase/client';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from '@/components/ui/skeleton';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Separator } from '@/components/ui/separator';

interface Gateway {
    id: string;
    name: string;
    provider: string;
    is_active: boolean;
    confirmation_type: 'webhook' | 'polling';
    polling_interval_seconds: number | null;
}

export default function GatewaysTab() {
    const { toast } = useToast();
    const [gateways, setGateways] = useState<Gateway[]>([]);
    const [paymentsEnabled, setPaymentsEnabled] = useState(true);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Buscar gateways
                const gatewaysResponse = await fetch('/api/admin/gateways');
                if (!gatewaysResponse.ok) throw new Error('Falha ao buscar gateways');
                const gatewaysData = await gatewaysResponse.json();
                setGateways(gatewaysData);

                // Buscar status global de pagamento
                const settingsResponse = await fetch('/api/settings/payment-status');
                if (!settingsResponse.ok) throw new Error('Falha ao buscar configurações de pagamento');
                const settingsData = await settingsResponse.json();
                setPaymentsEnabled(settingsData.enabled);

            } catch (error) {
                toast({ title: 'Erro', description: (error as Error).message, variant: 'destructive' });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [toast]);

    const handleGatewayUpdate = async (provider: string, updates: Partial<Gateway>) => {
        try {
            const response = await fetch('/api/admin/gateways/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider, ...updates }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Erro desconhecido');

            setGateways(gateways.map(g => g.provider === provider ? { ...g, ...updates } : g));
            toast({ title: 'Sucesso', description: `Gateway ${result.gateway.name} foi atualizado.` });
        } catch (error) {
            toast({ title: 'Erro ao atualizar gateway', description: (error as Error).message, variant: 'destructive' });
        }
    };

    const handlePaymentsToggle = async (isEnabled: boolean) => {
        try {
            const response = await fetch('/api/admin/settings/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'payments_enabled', value: String(isEnabled) }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Erro desconhecido');

            setPaymentsEnabled(isEnabled);
            toast({ title: 'Sucesso', description: `Pagamentos no site foram ${isEnabled ? 'habilitados' : 'desabilitados'}.` });
        } catch (error) {
            toast({ title: 'Erro ao atualizar configuração', description: (error as Error).message, variant: 'destructive' });
        }
    };

    if (loading) {
        return (
            <div className="space-y-8">
                <Skeleton className="h-12 w-1/3" />
                <div className="space-y-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-semibold">Gerenciamento de Gateways</h2>
                <p className="text-gray-400">
                    Ative ou desative os provedores de pagamento e controle o status geral de pagamentos no site.
                </p>
            </div>

            <div className="p-6 border rounded-lg bg-gray-900/30 border-gray-700/50">
                <h3 className="text-lg font-medium mb-4">Status Geral</h3>
                <div className="flex items-center space-x-4 p-4 rounded-md bg-gray-800/50">
                    <Switch
                        id="payments-enabled"
                        checked={paymentsEnabled}
                        onCheckedChange={handlePaymentsToggle}
                    />
                    <Label htmlFor="payments-enabled" className="text-base">
                        {paymentsEnabled ? 'Pagamentos Habilitados no Site' : 'Pagamentos Desabilitados no Site'}
                    </Label>
                </div>
            </div>

            <div className="p-6 border rounded-lg bg-gray-900/30 border-gray-700/50">
                <h3 className="text-lg font-medium mb-4">Provedores de Pagamento</h3>
                <div className="space-y-6">
                    {gateways.map((gateway) => (
                        <div key={gateway.id} className="p-4 rounded-md bg-gray-800/50 border border-gray-700">
                            <div className="flex items-center justify-between">
                                <Label className="text-xl font-semibold">
                                    {gateway.name}
                                </Label>
                                <Switch
                                    checked={gateway.is_active}
                                    onCheckedChange={(isChecked) => handleGatewayUpdate(gateway.provider, { is_active: isChecked })}
                                />
                            </div>
                            <Separator className="my-4 bg-gray-700" />
                            <div className="space-y-4">
                                <Label>Método de Confirmação</Label>
                                <RadioGroup
                                    value={gateway.confirmation_type}
                                    onValueChange={(value: 'webhook' | 'polling') => handleGatewayUpdate(gateway.provider, { confirmation_type: value })}
                                    className="flex space-x-4"
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="webhook" id={`webhook-${gateway.provider}`} />
                                        <Label htmlFor={`webhook-${gateway.provider}`}>Webhook (Recomendado)</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="polling" id={`polling-${gateway.provider}`} />
                                        <Label htmlFor={`polling-${gateway.provider}`}>Polling (Verificação Manual)</Label>
                                    </div>
                                </RadioGroup>

                                {gateway.confirmation_type === 'polling' && (
                                    <div className="space-y-2">
                                        <Label htmlFor={`interval-${gateway.provider}`}>Intervalo de Polling (segundos)</Label>
                                        <Input
                                            id={`interval-${gateway.provider}`}
                                            type="number"
                                            value={gateway.polling_interval_seconds || 30}
                                            onChange={(e) => setGateways(gateways.map(g => g.provider === gateway.provider ? { ...g, polling_interval_seconds: Number(e.target.value) } : g))}
                                            onBlur={(e) => handleGatewayUpdate(gateway.provider, { polling_interval_seconds: Number(e.target.value) })}
                                            className="w-40 bg-gray-900"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}