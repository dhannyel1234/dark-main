'use client';

import { useState, useEffect } from 'react';
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Link2Off, Link2, Trash2 } from 'lucide-react';

// Tipos
interface CombinedMachineData {
    azureInfo: {
        name: string | undefined;
        location: string | undefined;
        vmId: string | undefined;
    };
    dbInfo: {
        owner_id: string;
        surname: string;
        plan_name: string;
    } | null;
}

const MachinesTab = () => {
    const [machines, setMachines] = useState<CombinedMachineData[]>([]);
    const [loading, setLoading] = useState(true);
    const [registering, setRegistering] = useState<string | null>(null);
    const [cleaningIPs, setCleaningIPs] = useState(false);
    
    // Para tracking de loading por VM
    const [registrationStates, setRegistrationStates] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const fetchMachines = async () => {
            setLoading(true);
            try {
                const response = await fetch('/api/admin/getAll');
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Falha ao buscar máquinas');
                }
                const data = await response.json();
                setMachines(data);
            } catch (error) {
                toast.error('Erro ao buscar máquinas', { description: (error as Error).message });
            } finally {
                setLoading(false);
            }
        };
        fetchMachines();
    }, []);

    const handleLinkMachine = async (vmName: string | undefined) => {
        if (!vmName) return;
        
        setRegistering(vmName);
        
        try {
            const response = await fetch('/api/admin/vm/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    vmName: vmName
                }),
            });

            const result = await response.json();

            if (response.ok) {
                toast.success(`VM '${vmName}' registrada com sucesso como disponível!`);
                // Refresh the machines list
                const machinesResponse = await fetch('/api/admin/getAll');
                if (machinesResponse.ok) {
                    const data = await machinesResponse.json();
                    setMachines(data);
                }
            } else {
                toast.error(result.error || 'Erro ao registrar VM');
            }
        } catch (error) {
            console.error('Erro ao registrar VM:', error);
            toast.error('Erro interno ao registrar VM');
        } finally {
            setRegistering(null);
        }
    };

    const handleCleanupIPs = async () => {
        setCleaningIPs(true);
        
        try {
            const response = await fetch('/api/admin/cleanup-ips', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const result = await response.json();

            if (response.ok) {
                toast.success(result.message, {
                    description: `IPs: ${result.summary.deletedIPs} | NICs: ${result.summary.deletedNICs} | VMs ativas: ${result.summary.totalVMs}`
                });
            } else {
                toast.error(result.error || 'Erro ao limpar IPs');
            }
        } catch (error) {
            console.error('Erro ao limpar IPs:', error);
            toast.error('Erro interno ao limpar IPs não utilizados');
        } finally {
            setCleaningIPs(false);
        }
    };

    if (loading) {
        return <div>Carregando todas as máquinas...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-semibold">Gerenciamento de VMs (Azure)</h2>
                    <p className="text-gray-400">Registre VMs do Azure no sistema para torná-las disponíveis para planos individuais ou fila automática.</p>
                </div>
                <Button 
                    onClick={handleCleanupIPs}
                    disabled={cleaningIPs}
                    variant="outline"
                    className="bg-red-600 hover:bg-red-700 text-white border-red-600"
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {cleaningIPs ? 'Limpando...' : 'Limpar IPs Órfãos'}
                </Button>
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome da VM (Azure)</TableHead>
                            <TableHead>Localização</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Apelido (DB)</TableHead>
                            <TableHead>Plano (DB)</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {machines.map((machine) => (
                            <TableRow key={machine.azureInfo.vmId}>
                                <TableCell className="font-medium">{machine.azureInfo.name}</TableCell>
                                <TableCell>{machine.azureInfo.location}</TableCell>
                                <TableCell>
                                    {machine.dbInfo ? (
                                        <Badge variant="default" className="bg-green-600">
                                            <Link2 className="mr-2 h-4 w-4" />
                                            Vinculada
                                        </Badge>
                                    ) : (
                                        <Badge variant="secondary">
                                            <Link2Off className="mr-2 h-4 w-4" />
                                            Não Vinculada
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell>{machine.dbInfo?.surname || 'N/A'}</TableCell>
                                <TableCell>{machine.dbInfo?.plan_name || 'N/A'}</TableCell>
                                <TableCell className="text-right">
                                    {!machine.dbInfo && (
                                        <Button 
                                            onClick={() => handleLinkMachine(machine.azureInfo.name)}
                                            disabled={registering === machine.azureInfo.name}
                                        >
                                            {registering === machine.azureInfo.name ? 'Registrando...' : 'Registrar como Disponível'}
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

        </div>
    );
};

export default MachinesTab;