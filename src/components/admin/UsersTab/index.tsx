'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from "sonner";
import { createClient } from '@/utils/supabase/client';
import { debounce } from 'lodash';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, History, Server as ServerIcon, User, Shield, CreditCard, MapPin } from 'lucide-react'; // Adicionado ServerIcon
import { Badge } from '@/components/ui/badge';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { format } from 'date-fns';

// Tipos
interface User {
    id: string;
    email: string | undefined;
    discord_id: string;
    full_name?: string;
    username?: string;
    profile: {
        username?: string;
        full_name?: string;
        avatar_url?: string;
        admin_level: 'user' | 'admin' | 'owner';
        website?: string;
        created_at?: string;
        updated_at?: string;
    } | null;
    has_active_plan: boolean;
    created_at?: string;
    last_sign_in_at?: string;
    providers?: string[];
}

interface PaymentHistory {
    id: string;
    created_at: string;
    price: number;
    status: string;
    user_name: string;
    email: string;
    plans: { name: string } | null;
}

// Novo tipo para as máquinas do usuário
interface UserMachine {
    id: string;
    name: string;
    surname: string;
    status: string;
    ip: string;
    plan?: {
        name: string;
    };
}

const UsersTab = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ searchTerm: '', level: 'all', subscribers: 'all' });
    const [currentUserLevel, setCurrentUserLevel] = useState<'user' | 'admin' | 'owner'>('user');
    
    // Estados de paginação
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalUsers: 0,
        usersPerPage: 20,
        hasNextPage: false,
        hasPreviousPage: false
    });
    
    // Estado para indicar pesquisa pendente
    const [searchPending, setSearchPending] = useState(false);
    
    // Estados para o modal de histórico
    const [isHistoryModalOpen, setHistoryModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [historyData, setHistoryData] = useState<PaymentHistory[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Estados para o modal de máquinas
    const [isMachinesModalOpen, setMachinesModalOpen] = useState(false);
    const [machinesData, setMachinesData] = useState<UserMachine[]>([]);
    const [machinesLoading, setMachinesLoading] = useState(false);

    // Estados para o modal de dados pessoais
    const [isPersonalDataModalOpen, setPersonalDataModalOpen] = useState(false);
    const [personalData, setPersonalData] = useState<any>(null);
    const [personalDataLoading, setPersonalDataLoading] = useState(false);

    // Estados para modais de ações
    const [isPermissionModalOpen, setPermissionModalOpen] = useState(false);
    const [isPlanModalOpen, setPlanModalOpen] = useState(false);
    const [isMachineAssignModalOpen, setMachineAssignModalOpen] = useState(false);
    const [selectedUserForAction, setSelectedUserForAction] = useState<User | null>(null);
    
    // Estados para formulários
    const [newPermissionLevel, setNewPermissionLevel] = useState<'user' | 'admin' | 'owner'>('user');
    const [planAssignData, setPlanAssignData] = useState({ planName: '', days: '7' });
    const [machineAssignData, setMachineAssignData] = useState({ machineName: '', planName: '', days: '7' });
    
    // Estados para planos disponíveis
    const [availablePlans, setAvailablePlans] = useState<Array<{id: string, name: string}>>([]);
    const [plansLoading, setPlansLoading] = useState(false);


    const handleShowHistory = async (user: User) => {
        setSelectedUser(user);
        setHistoryModalOpen(true);
        setHistoryLoading(true);
        try {
            const response = await fetch(`/api/admin/users/${user.id}/history`);
            if (!response.ok) throw new Error('Falha ao buscar histórico');
            const data = await response.json();
            if (Array.isArray(data)) {
                setHistoryData(data);
            } else {
                toast.error('Erro ao buscar histórico', { description: data.error || 'Ocorreu um erro inesperado.' });
                setHistoryData([]);
            }
        } catch (error) {
            toast.error('Erro ao buscar histórico', { description: (error as Error).message });
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleShowMachines = async (user: User) => {
        setSelectedUser(user);
        setMachinesModalOpen(true);
        setMachinesLoading(true);
        try {
            const response = await fetch(`/api/machine/getAllUser?user_id=${user.id}`);
            if (!response.ok) {
                 const errorData = await response.json();
                 throw new Error(errorData.message || 'Falha ao buscar máquinas');
            }
            const data = await response.json();
             if (data.message) { // Caso de "Nenhuma máquina encontrada"
                setMachinesData([]);
            } else if (Array.isArray(data)) {
                setMachinesData(data);
            } else {
                toast.error('Erro ao buscar máquinas', { description: data.error || 'Formato de resposta inesperado.' });
                setMachinesData([]);
            }
        } catch (error) {
            toast.error('Erro ao buscar máquinas', { description: (error as Error).message });
            setMachinesData([]);
        } finally {
            setMachinesLoading(false);
        }
    };

    const handleShowPersonalData = async (user: User) => {
        setSelectedUser(user);
        setPersonalDataModalOpen(true);
        setPersonalDataLoading(true);
        try {
            const response = await fetch(`/api/admin/users/${user.id}/personal-data`);
            if (!response.ok) throw new Error('Falha ao buscar dados pessoais');
            const data = await response.json();
            if (data.success) {
                setPersonalData(data);
            } else {
                toast.error('Erro ao buscar dados pessoais', { description: data.error || 'Ocorreu um erro inesperado.' });
                setPersonalData(null);
            }
        } catch (error) {
            toast.error('Erro ao buscar dados pessoais', { description: (error as Error).message });
        } finally {
            setPersonalDataLoading(false);
        }
    };

    useEffect(() => {
        const fetchCurrentUser = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase.from('profiles').select('admin_level').eq('id', user.id).single();
                if (profile) {
                    setCurrentUserLevel(profile.admin_level);
                }
            }
        };
        fetchCurrentUser();
    }, []);

    const fetchUsers = async (page: number = 1, searchTerm: string = '') => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: pagination.usersPerPage.toString(),
                ...(searchTerm && { search: searchTerm })
            });
            
            const response = await fetch(`/api/admin/users?${params}`);
            if (!response.ok) throw new Error('Falha ao buscar usuários');
            const data = await response.json();
            setUsers(data.users || []);
            setPagination(data.pagination);
        } catch (error) {
            toast.error('Erro ao buscar usuários', { description: (error as Error).message });
        }
        setLoading(false);
    };

    // Handler para pesquisa com debounce
    const debouncedSearch = useCallback(
        debounce((searchTerm: string) => {
            console.log(`🔍 Executando pesquisa para: "${searchTerm}"`);
            setSearchPending(false); // Remove indicador de pesquisa pendente
            // Sempre volta para a primeira página quando pesquisa
            fetchUsers(1, searchTerm);
        }, 2000), // 2 segundos de delay
        []
    );

    useEffect(() => {
        fetchUsers(1);
        
        // Cleanup do debounce quando o componente for desmontado
        return () => {
            debouncedSearch.cancel();
        };
    }, [debouncedSearch]);

    // Handlers de paginação
    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            fetchUsers(newPage, filters.searchTerm);
        }
    };

    const handleSearchChange = (searchTerm: string) => {
        setFilters({...filters, searchTerm});
        
        // Se o campo estiver vazio, pesquisa imediatamente
        if (!searchTerm.trim()) {
            debouncedSearch.cancel(); // Cancela pesquisa pendente
            setSearchPending(false);
            fetchUsers(1, '');
        } else {
            // Indica que tem pesquisa pendente
            setSearchPending(true);
            // Caso contrário, usa debounce
            debouncedSearch(searchTerm);
        }
    };

    const filteredUsers = useMemo(() => {
        // Se tem termo de pesquisa, a API já fez a filtragem - apenas aplicar filtros locais
        return users.filter(user => {
            const levelMatch = filters.level === 'all' || user.profile?.admin_level === filters.level;
            const subscriberMatch = filters.subscribers === 'all' || (filters.subscribers === 'yes' && user.has_active_plan) || (filters.subscribers === 'no' && !user.has_active_plan);
            
            return levelMatch && subscriberMatch;
        });
    }, [users, filters]);

    // Handlers para ações
    const handleChangePermission = (user: User) => {
        setSelectedUserForAction(user);
        setNewPermissionLevel(user.profile?.admin_level || 'user');
        setPermissionModalOpen(true);
    };

    const handleAssignPlan = async (user: User) => {
        setSelectedUserForAction(user);
        setPlanAssignData({ planName: '', days: '7' });
        setPlanModalOpen(true);
        
        // Buscar planos disponíveis
        await fetchAvailablePlans();
    };

    const fetchAvailablePlans = async () => {
        setPlansLoading(true);
        try {
            const response = await fetch('/api/admin/plans');
            if (!response.ok) throw new Error('Falha ao buscar planos');
            const plans = await response.json();
            
            // Filtrar apenas planos que têm fila (has_queue: true)
            const plansWithQueue = plans.filter((plan: any) => plan.has_queue === true);
            
            setAvailablePlans(plansWithQueue.map((plan: any) => ({
                id: plan.id,
                name: plan.name
            })));
        } catch (error) {
            toast.error('Erro ao buscar planos', { description: (error as Error).message });
            setAvailablePlans([]);
        } finally {
            setPlansLoading(false);
        }
    };

    const handleAssignMachine = (user: User) => {
        setSelectedUserForAction(user);
        setMachineAssignData({ machineName: '', planName: '', days: '7' });
        setMachineAssignModalOpen(true);
    };

    // Função para atualizar permissão
    const submitPermissionChange = async () => {
        if (!selectedUserForAction) return;
        
        try {
            const response = await fetch('/api/admin/set-level', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: selectedUserForAction.id,
                    newLevel: newPermissionLevel
                })
            });

            if (response.ok) {
                toast.success('Permissão alterada com sucesso!');
                setPermissionModalOpen(false);
                // Recarregar usuários
                const updatedUsers = users.map(u => 
                    u.id === selectedUserForAction.id 
                        ? { ...u, profile: { ...u.profile, admin_level: newPermissionLevel } }
                        : u
                );
                setUsers(updatedUsers);
            } else {
                const errorData = await response.json();
                toast.error('Erro ao alterar permissão', { description: errorData.error });
            }
        } catch (error) {
            toast.error('Erro de conexão', { description: (error as Error).message });
        }
    };

    // Função para atribuir plano
    const submitPlanAssign = async () => {
        if (!selectedUserForAction || !planAssignData.planName || planAssignData.planName === 'no-plans') {
            toast.error('Erro', { description: 'Selecione um plano válido antes de continuar.' });
            return;
        }
        
        try {
            const response = await fetch('/api/admin/users/assign-plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: selectedUserForAction.id,
                    planName: planAssignData.planName,
                    days: parseInt(planAssignData.days)
                })
            });

            if (response.ok) {
                toast.success('Plano atribuído com sucesso!');
                setPlanModalOpen(false);
            } else {
                const errorData = await response.json();
                toast.error('Erro ao atribuir plano', { description: errorData.error });
            }
        } catch (error) {
            toast.error('Erro de conexão', { description: (error as Error).message });
        }
    };

    // Função para atribuir máquina
    const submitMachineAssign = async () => {
        if (!selectedUserForAction || !machineAssignData.machineName) return;
        
        try {
            // Primeiro registrar a VM
            const registerResponse = await fetch('/api/admin/vm/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    vmName: machineAssignData.machineName
                })
            });

            if (!registerResponse.ok) {
                const errorData = await registerResponse.json();
                toast.error('Erro ao registrar máquina', { description: errorData.error });
                return;
            }

            const registerData = await registerResponse.json();
            const vmId = registerData.machine?.id;

            if (!vmId) {
                toast.error('Erro: ID da máquina não encontrado');
                return;
            }

            // Depois alugar para o usuário
            const rentResponse = await fetch('/api/admin/vm-management', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'rent',
                    vmId: vmId,
                    userId: selectedUserForAction.id,
                    planName: machineAssignData.planName,
                    days: machineAssignData.days
                })
            });

            if (rentResponse.ok) {
                toast.success('Máquina registrada e atribuída com sucesso!');
                setMachineAssignModalOpen(false);
            } else {
                const errorData = await rentResponse.json();
                toast.error('Máquina registrada mas erro ao atribuir', { description: errorData.error });
            }
        } catch (error) {
            toast.error('Erro de conexão', { description: (error as Error).message });
        }
    };

    if (loading) {
        return <div>Carregando usuários...</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-semibold">Gerenciamento de Usuários</h2>
                <p className="text-gray-400">Visualize e gerencie todos os usuários da plataforma.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                    <Input 
                        placeholder="Pesquisar por Nome, Email, ID ou ID Discord..." 
                        value={filters.searchTerm} 
                        onChange={e => handleSearchChange(e.target.value)} 
                    />
                    {searchPending && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                        </div>
                    )}
                    {searchPending && (
                        <div className="absolute -bottom-6 left-0 text-xs text-gray-400">
                            Aguardando você parar de digitar...
                        </div>
                    )}
                </div>
                {/* Adicionar Selects para level e subscribers aqui */}
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome de Usuário</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>ID Usuário</TableHead>
                            <TableHead>ID Discord</TableHead>
                            <TableHead>Nível</TableHead>
                            <TableHead>Assinante</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUsers.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">
                                    {user.profile?.username || user.username || user.profile?.full_name || user.full_name || 'Sem nome'}
                                </TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell className="text-gray-400">{user.id}</TableCell>
                                <TableCell className="text-gray-400">{user.discord_id}</TableCell>
                                <TableCell><Badge variant={user.profile?.admin_level === 'owner' ? 'destructive' : 'secondary'}>{user.profile?.admin_level}</Badge></TableCell>
                                <TableCell>{user.has_active_plan ? 'Sim' : 'Não'}</TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Abrir menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => handleChangePermission(user)}>
                                                <Shield className="mr-2 h-4 w-4" />
                                                Mudar Permissão
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleAssignPlan(user)}>
                                                <CreditCard className="mr-2 h-4 w-4" />
                                                Atribuir Plano
                                            </DropdownMenuItem>
                                            {currentUserLevel === 'owner' && (
                                                <DropdownMenuItem onClick={() => handleAssignMachine(user)}>
                                                    <ServerIcon className="mr-2 h-4 w-4" />
                                                    Atribuir Máquina
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => handleShowMachines(user)}>
                                               <ServerIcon className="mr-2 h-4 w-4" />
                                               <span>Ver Máquinas</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleShowHistory(user)}>
                                                <History className="mr-2 h-4 w-4" />
                                                <span>Ver Histórico</span>
                                            </DropdownMenuItem>
                                            {currentUserLevel === 'owner' && (
                                                <DropdownMenuItem onClick={() => handleShowPersonalData(user)}>
                                                    <User className="mr-2 h-4 w-4" />
                                                    <span>Dados Pessoais</span>
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Controles de Paginação */}
            <div className="flex items-center justify-between">
                <div className="text-sm text-gray-400">
                    Mostrando {((pagination.currentPage - 1) * pagination.usersPerPage) + 1} a {Math.min(pagination.currentPage * pagination.usersPerPage, pagination.totalUsers)} de {pagination.totalUsers} usuários
                </div>
                <div className="flex items-center space-x-2">
                    <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={!pagination.hasPreviousPage || loading}
                    >
                        Anterior
                    </Button>
                    
                    <div className="flex items-center space-x-1">
                        {/* Mostrar algumas páginas ao redor da atual */}
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                            const startPage = Math.max(1, pagination.currentPage - 2);
                            const pageNumber = startPage + i;
                            if (pageNumber <= pagination.totalPages) {
                                return (
                                    <Button
                                        key={pageNumber}
                                        variant={pageNumber === pagination.currentPage ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => handlePageChange(pageNumber)}
                                        disabled={loading}
                                        className="w-8 h-8 p-0"
                                    >
                                        {pageNumber}
                                    </Button>
                                );
                            }
                            return null;
                        })}
                    </div>
                    
                    <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={!pagination.hasNextPage || loading}
                    >
                        Próxima
                    </Button>
                </div>
            </div>

           {/* Modal de Histórico de Pagamentos */}
            <Dialog open={isHistoryModalOpen} onOpenChange={(open) => {
                if (!open) {
                    setSelectedUser(null);
                    setHistoryData([]);
                }
                setHistoryModalOpen(open);
            }}>
                <DialogContent className="max-w-4xl bg-gray-900 border-gray-800 text-white">
                    {selectedUser && (
                        <>
                            <DialogHeader>
                                <DialogTitle>Histórico de Pagamentos de {selectedUser.profile?.username || selectedUser.username || selectedUser.email}</DialogTitle>
                                <DialogDescription>
                                    Aqui estão todos os pagamentos concluídos para este usuário.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="max-h-[60vh] overflow-y-auto">
                                {historyLoading ? (
                                    <p>Carregando histórico...</p>
                                ) : historyData.length === 0 ? (
                                    <p>Nenhum pagamento encontrado.</p>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Data</TableHead>
                                                <TableHead>Plano</TableHead>
                                                <TableHead>Valor</TableHead>
                                                <TableHead>Nome no Pagamento</TableHead>
                                                <TableHead>Email Pag.</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {historyData.map((payment) => (
                                                <TableRow key={payment.id}>
                                                    <TableCell>
                                                        {payment.created_at ? format(new Date(payment.created_at), 'dd/MM/yyyy HH:mm') : 'Data inválida'}
                                                    </TableCell>
                                                    <TableCell>{payment.plans?.name || 'N/A'}</TableCell>
                                                    <TableCell>
                                                        {typeof payment.price === 'number' ? `R$ ${payment.price.toFixed(2)}` : 'Preço inválido'}
                                                    </TableCell>
                                                    <TableCell>{payment.user_name}</TableCell>
                                                    <TableCell>{payment.email}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </div>
                            <DialogFooter>
                                <Button 
                                    variant="outline" 
                                    onClick={() => {
                                        setHistoryModalOpen(false);
                                        setTimeout(() => {
                                            setSelectedUser(null);
                                            setHistoryData([]);
                                            setHistoryLoading(false);
                                        }, 300);
                                    }}
                                >
                                    Fechar
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

           {/* Modal de Máquinas do Usuário */}
           <Dialog open={isMachinesModalOpen} onOpenChange={(open) => {
               if (!open) {
                   setSelectedUser(null);
                   setMachinesData([]);
               }
               setMachinesModalOpen(open);
           }}>
               <DialogContent className="max-w-4xl bg-gray-900 border-gray-800 text-white">
                   {selectedUser && (
                       <>
                           <DialogHeader>
                               <DialogTitle>Máquinas de {selectedUser.profile?.username || selectedUser.username || selectedUser.email}</DialogTitle>
                               <DialogDescription>
                                   Visualize as máquinas virtuais associadas a este usuário.
                               </DialogDescription>
                           </DialogHeader>
                           <div className="max-h-[60vh] overflow-y-auto">
                               {machinesLoading ? (
                                   <p>Carregando máquinas...</p>
                               ) : machinesData.length === 0 ? (
                                   <p>Nenhuma máquina encontrada para este usuário.</p>
                               ) : (
                                   <Table>
                                       <TableHeader>
                                           <TableRow>
                                               <TableHead>Apelido</TableHead>
                                               <TableHead>Nome (Host)</TableHead>
                                               <TableHead>Status</TableHead>
                                               <TableHead>IP Público</TableHead>
                                               <TableHead>Plano</TableHead>
                                           </TableRow>
                                       </TableHeader>
                                       <TableBody>
                                           {machinesData.map((machine) => (
                                               <TableRow key={machine.id}>
                                                   <TableCell>{machine.surname}</TableCell>
                                                   <TableCell className="text-gray-400">{machine.name}</TableCell>
                                                   <TableCell>
                                                       <Badge variant={machine.status === 'running' ? 'default' : 'secondary'}>
                                                           {machine.status}
                                                       </Badge>
                                                   </TableCell>
                                                   <TableCell className="text-gray-400">{machine.ip}</TableCell>
                                                   <TableCell>{machine.plan?.name || 'N/A'}</TableCell>
                                               </TableRow>
                                           ))}
                                       </TableBody>
                                   </Table>
                               )}
                           </div>
                           <DialogFooter>
                               <Button 
                                   variant="outline" 
                                   onClick={() => {
                                       setMachinesModalOpen(false);
                                       setTimeout(() => {
                                           setSelectedUser(null);
                                           setMachinesData([]);
                                           setMachinesLoading(false);
                                       }, 300);
                                   }}
                               >
                                   Fechar
                               </Button>
                           </DialogFooter>
                       </>
                   )}
               </DialogContent>
           </Dialog>

           {/* Modal de Dados Pessoais */}
           <Dialog open={isPersonalDataModalOpen} onOpenChange={(open) => {
               if (!open) {
                   setSelectedUser(null);
                   setPersonalData(null);
                   setPersonalDataLoading(false);
               }
               setPersonalDataModalOpen(open);
           }}>
               <DialogContent className="max-w-6xl bg-gray-900 border-gray-800 text-white">
                   {selectedUser && (
                       <>
                           <DialogHeader>
                               <DialogTitle className="flex items-center">
                                   <Shield className="w-5 h-5 mr-2 text-red-400" />
                                   Dados Pessoais - {selectedUser.profile?.username || selectedUser.username || selectedUser.email}
                               </DialogTitle>
                               <DialogDescription className="text-red-300">
                                   ⚠️ Informações confidenciais - Uso restrito conforme LGPD
                               </DialogDescription>
                           </DialogHeader>
                           <div className="max-h-[70vh] overflow-y-auto space-y-6">
                               {personalDataLoading ? (
                                   <p>Carregando dados pessoais...</p>
                               ) : !personalData ? (
                                   <p>Nenhum dado pessoal encontrado.</p>
                               ) : (
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                       {/* Dados de Perfil */}
                                       <div className="bg-gray-800/50 p-4 rounded-lg">
                                           <h3 className="text-lg font-semibold mb-3 flex items-center">
                                               <User className="w-4 h-4 mr-2" />
                                               Perfil
                                           </h3>
                                           <div className="space-y-2 text-sm">
                                               <div><strong>Discord:</strong> {personalData.user_profile.username || 'N/A'}</div>
                                               <div><strong>Nome Completo:</strong> {personalData.user_profile.full_name || 'N/A'}</div>
                                               <div><strong>Nível:</strong> {personalData.user_profile.admin_level}</div>
                                               <div><strong>Cadastrado:</strong> {format(new Date(personalData.user_profile.created_at), 'dd/MM/yyyy HH:mm')}</div>
                                           </div>
                                       </div>

                                       {/* Nomes Utilizados */}
                                       <div className="bg-gray-800/50 p-4 rounded-lg">
                                           <h3 className="text-lg font-semibold mb-3">📝 Nomes nos Pagamentos</h3>
                                           <div className="space-y-1 text-sm">
                                               {personalData.personal_data.names.length > 0 ? (
                                                   personalData.personal_data.names.map((name: string, index: number) => (
                                                       <div key={index} className="bg-gray-700/50 p-2 rounded">{name}</div>
                                                   ))
                                               ) : (
                                                   <div className="text-gray-400">Nenhum nome registrado</div>
                                               )}
                                           </div>
                                       </div>

                                       {/* Emails */}
                                       <div className="bg-gray-800/50 p-4 rounded-lg">
                                           <h3 className="text-lg font-semibold mb-3">📧 Emails Utilizados</h3>
                                           <div className="space-y-1 text-sm">
                                               {personalData.personal_data.emails.length > 0 ? (
                                                   personalData.personal_data.emails.map((email: string, index: number) => (
                                                       <div key={index} className="bg-gray-700/50 p-2 rounded">{email}</div>
                                                   ))
                                               ) : (
                                                   <div className="text-gray-400">Nenhum email registrado</div>
                                               )}
                                           </div>
                                       </div>

                                       {/* Documentos */}
                                       <div className="bg-gray-800/50 p-4 rounded-lg">
                                           <h3 className="text-lg font-semibold mb-3">🆔 Documentos</h3>
                                           <div className="space-y-1 text-sm">
                                               {personalData.personal_data.documents.length > 0 ? (
                                                   personalData.personal_data.documents.map((doc: string, index: number) => (
                                                       <div key={index} className="bg-gray-700/50 p-2 rounded font-mono">{doc}</div>
                                                   ))
                                               ) : (
                                                   <div className="text-gray-400">Nenhum documento registrado</div>
                                               )}
                                           </div>
                                       </div>

                                       {/* Telefones */}
                                       <div className="bg-gray-800/50 p-4 rounded-lg">
                                           <h3 className="text-lg font-semibold mb-3">📱 Telefones</h3>
                                           <div className="space-y-1 text-sm">
                                               {personalData.personal_data.phones.length > 0 ? (
                                                   personalData.personal_data.phones.map((phone: string, index: number) => (
                                                       <div key={index} className="bg-gray-700/50 p-2 rounded">{phone}</div>
                                                   ))
                                               ) : (
                                                   <div className="text-gray-400">Nenhum telefone registrado</div>
                                               )}
                                           </div>
                                       </div>

                                       {/* Estatísticas de Pagamento */}
                                       <div className="bg-gray-800/50 p-4 rounded-lg">
                                           <h3 className="text-lg font-semibold mb-3 flex items-center">
                                               <CreditCard className="w-4 h-4 mr-2" />
                                               Estatísticas
                                           </h3>
                                           <div className="space-y-2 text-sm">
                                               <div><strong>Total Gasto:</strong> R$ {personalData.payment_stats.total_spent.toFixed(2)}</div>
                                               <div><strong>Pagamentos:</strong> {personalData.payment_stats.total_payments}</div>
                                               <div><strong>Bem-sucedidos:</strong> {personalData.payment_stats.successful_payments}</div>
                                               <div><strong>Falharam:</strong> {personalData.payment_stats.failed_payments}</div>
                                               <div><strong>Métodos:</strong> {personalData.payment_stats.payment_methods.join(', ')}</div>
                                               {personalData.payment_stats.first_payment && (
                                                   <div><strong>Primeiro:</strong> {format(new Date(personalData.payment_stats.first_payment), 'dd/MM/yyyy')}</div>
                                               )}
                                           </div>
                                       </div>
                                   </div>
                               )}

                               {/* Endereços */}
                               {personalData && personalData.personal_data.addresses.length > 0 && (
                                   <div className="bg-gray-800/50 p-4 rounded-lg">
                                       <h3 className="text-lg font-semibold mb-3 flex items-center">
                                           <MapPin className="w-4 h-4 mr-2" />
                                           Endereços Utilizados
                                       </h3>
                                       <div className="space-y-3">
                                           {personalData.personal_data.addresses.map((address: any, index: number) => (
                                               <div key={index} className="bg-gray-700/50 p-3 rounded">
                                                   <div className="text-sm">
                                                       <div><strong>Rua:</strong> {address.street}</div>
                                                       <div><strong>Cidade:</strong> {address.city}</div>
                                                       <div><strong>Estado:</strong> {address.state}</div>
                                                       <div><strong>CEP:</strong> {address.zipcode}</div>
                                                       <div className="text-xs text-gray-400 mt-2">
                                                           Usado no pagamento: {address.used_in_payment}
                                                       </div>
                                                   </div>
                                               </div>
                                           ))}
                                       </div>
                                   </div>
                               )}
                           </div>
                           <DialogFooter>
                               <Button 
                                   variant="outline" 
                                   onClick={() => {
                                       setPersonalDataModalOpen(false);
                                       setTimeout(() => {
                                           setSelectedUser(null);
                                           setPersonalData(null);
                                           setPersonalDataLoading(false);
                                       }, 300);
                                   }}
                               >
                                   Fechar
                               </Button>
                           </DialogFooter>
                       </>
                   )}
               </DialogContent>
           </Dialog>

           {/* Modal de Mudança de Permissão */}
           <Dialog open={isPermissionModalOpen} onOpenChange={setPermissionModalOpen}>
               <DialogContent className="bg-gray-900 border-gray-800 text-white">
                   <DialogHeader>
                       <DialogTitle>Alterar Nível de Permissão</DialogTitle>
                       <DialogDescription>
                           Alterar o nível de acesso de {selectedUserForAction?.profile?.username || selectedUserForAction?.email}
                       </DialogDescription>
                   </DialogHeader>
                   <div className="space-y-4">
                       <div>
                           <label className="text-sm font-medium mb-2 block">Novo Nível</label>
                           <Select value={newPermissionLevel} onValueChange={(value: 'user' | 'admin' | 'owner') => setNewPermissionLevel(value)}>
                               <SelectTrigger className="bg-gray-800 border-gray-700">
                                   <SelectValue />
                               </SelectTrigger>
                               <SelectContent className="bg-gray-800 border-gray-700">
                                   <SelectItem value="user">Usuário</SelectItem>
                                   <SelectItem value="admin">Admin</SelectItem>
                                   <SelectItem value="owner">Owner</SelectItem>
                               </SelectContent>
                           </Select>
                       </div>
                   </div>
                   <DialogFooter>
                       <Button variant="outline" onClick={() => setPermissionModalOpen(false)}>Cancelar</Button>
                       <Button onClick={submitPermissionChange}>Confirmar</Button>
                   </DialogFooter>
               </DialogContent>
           </Dialog>

           {/* Modal de Atribuir Plano */}
           <Dialog open={isPlanModalOpen} onOpenChange={setPlanModalOpen}>
               <DialogContent className="bg-gray-900 border-gray-800 text-white">
                   <DialogHeader>
                       <DialogTitle>Atribuir Plano</DialogTitle>
                       <DialogDescription>
                           Atribuir um plano com fila para {selectedUserForAction?.profile?.username || selectedUserForAction?.email}
                       </DialogDescription>
                   </DialogHeader>
                   <div className="space-y-4">
                       <div>
                           <label className="text-sm font-medium mb-2 block">Plano</label>
                           {plansLoading ? (
                               <div className="flex items-center justify-center py-4">
                                   <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                                   <span className="ml-2 text-sm">Carregando planos...</span>
                               </div>
                           ) : (
                               <Select 
                                   value={planAssignData.planName} 
                                   onValueChange={(value) => setPlanAssignData(prev => ({ ...prev, planName: value }))}
                               >
                                   <SelectTrigger className="bg-gray-800 border-gray-700">
                                       <SelectValue placeholder="Selecione um plano..." />
                                   </SelectTrigger>
                                   <SelectContent className="bg-gray-800 border-gray-700">
                                       {availablePlans.length > 0 ? (
                                           availablePlans.map((plan) => (
                                               <SelectItem key={plan.id} value={plan.name}>
                                                   {plan.name}
                                               </SelectItem>
                                           ))
                                       ) : (
                                           <SelectItem value="no-plans" disabled>
                                               Nenhum plano com fila disponível
                                           </SelectItem>
                                       )}
                                   </SelectContent>
                               </Select>
                           )}
                       </div>
                       <div>
                           <label className="text-sm font-medium mb-2 block">Duração (dias)</label>
                           <Input 
                               type="number"
                               min="1"
                               placeholder="7"
                               value={planAssignData.days}
                               onChange={(e) => setPlanAssignData(prev => ({ ...prev, days: e.target.value }))}
                               className="bg-gray-800 border-gray-700"
                           />
                       </div>
                   </div>
                   <DialogFooter>
                       <Button variant="outline" onClick={() => setPlanModalOpen(false)}>Cancelar</Button>
                       <Button onClick={submitPlanAssign}>Atribuir Plano</Button>
                   </DialogFooter>
               </DialogContent>
           </Dialog>

           {/* Modal de Atribuir Máquina */}
           <Dialog open={isMachineAssignModalOpen} onOpenChange={setMachineAssignModalOpen}>
               <DialogContent className="bg-gray-900 border-gray-800 text-white">
                   <DialogHeader>
                       <DialogTitle>Atribuir Máquina</DialogTitle>
                       <DialogDescription>
                           Registrar e atribuir uma máquina para {selectedUserForAction?.profile?.username || selectedUserForAction?.email}
                       </DialogDescription>
                   </DialogHeader>
                   <div className="space-y-4">
                       <div>
                           <label className="text-sm font-medium mb-2 block">Nome da Máquina (Azure)</label>
                           <Input 
                               placeholder="Ex: gaming-vm-01"
                               value={machineAssignData.machineName}
                               onChange={(e) => setMachineAssignData(prev => ({ ...prev, machineName: e.target.value }))}
                               className="bg-gray-800 border-gray-700"
                           />
                       </div>
                       <div>
                           <label className="text-sm font-medium mb-2 block">Nome do Plano</label>
                           <Input 
                               placeholder="Ex: Premium Individual"
                               value={machineAssignData.planName}
                               onChange={(e) => setMachineAssignData(prev => ({ ...prev, planName: e.target.value }))}
                               className="bg-gray-800 border-gray-700"
                           />
                       </div>
                       <div>
                           <label className="text-sm font-medium mb-2 block">Duração (dias)</label>
                           <Input 
                               type="number"
                               min="1"
                               placeholder="7"
                               value={machineAssignData.days}
                               onChange={(e) => setMachineAssignData(prev => ({ ...prev, days: e.target.value }))}
                               className="bg-gray-800 border-gray-700"
                           />
                       </div>
                   </div>
                   <DialogFooter>
                       <Button variant="outline" onClick={() => setMachineAssignModalOpen(false)}>Cancelar</Button>
                       <Button onClick={submitMachineAssign}>Atribuir Máquina</Button>
                   </DialogFooter>
               </DialogContent>
           </Dialog>
        </div>
    );
};

export default UsersTab;