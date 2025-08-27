// Novo sistema de filas será implementado aqui conforme briefing do usuário.
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import ActiveUsers from './ActiveUsers';
import { RefreshCw } from 'lucide-react';

// Tipos para clientes ativos e filas
interface MachineInfo {
  name: string;
  ip: string;
  user: string;
  password: string;
  connectLink?: string;
}

interface ActiveClient {
  userId: string;
  userName: string;
  userEmail: string;
  userImage?: string;
  machineInfo: MachineInfo;
  activatedAt: string;
}

interface QueueData {
  waiting: number;
  active: number;
  users: any[];
  activeUsers: ActiveClient[];
}

interface QueueStats {
  alfa: QueueData;
  beta: QueueData;
  omega: QueueData;
}

const queueNames: { key: 'alfa' | 'beta' | 'omega'; label: string; color: string }[] = [
  { key: 'alfa', label: 'Fila Alfa', color: 'blue' },
  { key: 'beta', label: 'Prime 1', color: 'green' },
  { key: 'omega', label: 'ELITE 1', color: 'yellow' },
];

export default function QueueTab() {
  // Campos fixos compartilhados
  const [machineName, setMachineName] = useState('');
  const [machineIP, setMachineIP] = useState('');
  const [machineUser, setMachineUser] = useState('');
  const [machinePassword, setMachinePassword] = useState('');
  const [connectLink, setConnectLink] = useState('');

  // Estado das filas
  const [queues, setQueues] = useState<QueueStats>({
    alfa: { waiting: 0, active: 0, users: [], activeUsers: [] },
    beta: { waiting: 0, active: 0, users: [], activeUsers: [] },
    omega: { waiting: 0, active: 0, users: [], activeUsers: [] },
  });

  const { toast } = useToast();

  // Função para buscar dados das filas
  const fetchQueueStats = async () => {
    try {
      const response = await fetch('/api/queue/admin/stats');
      const data = await response.json();
      
      if (data.success && data.stats) {
        setQueues(data.stats);
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    }
  };

  // Buscar dados ao montar o componente e a cada 30 segundos
  useEffect(() => {
    fetchQueueStats();
    const interval = setInterval(fetchQueueStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const clearFields = () => {
    setMachineName('');
    setMachineIP('');
    setMachineUser('');
    setMachinePassword('');
    setConnectLink('');
  };

  // Ativar próximo da fila
  const handleNext = async (queueKey: 'alfa' | 'beta' | 'omega') => {
    if (!machineName || !machineIP || !machineUser || !machinePassword || !connectLink) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos da máquina, incluindo o link de conexão.',
        variant: 'destructive',
      });
      return;
    }

    const requestData = {
      name: machineName,
      ip: machineIP,
      user: machineUser,
      password: machinePassword,
      connectLink: connectLink
    };

    console.log('DEBUG - Enviando dados:', requestData);

    try {
      const response = await fetch('/api/queue/admin/next', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      // Log da resposta bruta para debug
      const responseText = await response.text();
      console.log('DEBUG - Resposta bruta da API:', responseText);

      // Tenta fazer o parse do JSON apenas se a resposta for válida
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('DEBUG - Erro ao fazer parse da resposta:', parseError);
        toast({
          title: 'Erro ao processar resposta',
          description: 'A resposta do servidor não está no formato esperado',
          variant: 'destructive',
        });
        return;
      }

      console.log('DEBUG - Resposta processada da API:', data);
      
      if (data.success) {
        toast({
          title: 'Sucesso!',
          description: 'Usuário ativado com sucesso!',
        });
        fetchQueueStats(); // Atualizar dados
        clearFields(); // Limpar campos
      } else {
        toast({
          title: 'Erro ao ativar usuário',
          description: data.message || data.error || 'Erro ao ativar usuário',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('DEBUG - Erro na requisição:', error);
      toast({
        title: 'Erro ao ativar usuário',
        description: 'Erro ao se comunicar com o servidor',
        variant: 'destructive',
      });
    }
  };

  const handleRemove = async (queueKey: 'alfa' | 'beta' | 'omega', user: ActiveClient) => {
    try {
      const response = await fetch('/api/queue/admin/deactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.userId })
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Sucesso!',
          description: 'Usuário removido com sucesso!',
        });
        fetchQueueStats(); // Atualizar dados
      } else {
        toast({
          title: 'Erro ao remover usuário',
          description: data.message || 'Erro ao remover usuário',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro ao remover usuário',
        description: 'Erro ao remover usuário',
        variant: 'destructive',
      });
    }
  };

  // Calcular tempo ativo
  const getActiveTime = (activatedAt: string) => {
    const start = new Date(activatedAt);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  // Função para limpar a fila (apenas aguardando)
  const handleClearQueue = async () => {
    if (!window.confirm('Tem certeza que deseja limpar todas as filas? Isso removerá todos os usuários aguardando, mas não afetará os ativos.')) return;
    try {
      const response = await fetch('/api/queue/admin/clear', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Sucesso!',
          description: 'Filas limpas com sucesso!',
        });
        fetchQueueStats();
      } else {
        toast({
          title: 'Erro ao limpar filas',
          description: data.message || 'Erro ao limpar filas',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro ao limpar filas',
        description: 'Erro ao limpar filas',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Seção de inputs com background */}
      <div className="bg-[#151823] p-4 rounded-lg border border-gray-800">
        <div className="space-y-4">
          {/* Primeira fileira */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Nome da máquina"
              value={machineName}
              onChange={(e) => setMachineName(e.target.value)}
            />
            <Input
              placeholder="IP da máquina"
              value={machineIP}
              onChange={(e) => setMachineIP(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Usuário"
                value={machineUser}
                onChange={(e) => setMachineUser(e.target.value)}
              />
              <Input
                placeholder="Senha"
                type="password"
                value={machinePassword}
                onChange={(e) => setMachinePassword(e.target.value)}
              />
            </div>
          </div>

          {/* Segunda fileira */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Link de conexão (ex: parsec:peer_id=123456)"
              value={connectLink}
              onChange={(e) => setConnectLink(e.target.value)}
              className="md:col-span-2"
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={clearFields} className="flex-1">
                Limpar
              </Button>
              <Button variant="outline" onClick={fetchQueueStats} className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
              <Button variant="destructive" onClick={handleClearQueue} className="flex-1">
                Limpar Fila
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Cards das filas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {queueNames.map(queue => (
          <div key={queue.key} className={`bg-[#151823] p-4 rounded-lg border border-gray-800`}>
            <h3 className={`text-lg font-semibold text-${queue.color}-400 mb-4`}>{queue.label}</h3>
            <div className="grid gap-2">
              <div className="flex justify-between">
                <span>Aguardando:</span>
                <span>{queues[queue.key].waiting}</span>
              </div>
              <div className="flex justify-between">
                <span>Ativos:</span>
                <span>{queues[queue.key].active}</span>
              </div>
              <Button
                className="w-full"
                onClick={() => handleNext(queue.key)}
              >
                Próximo da fila
              </Button>
            </div>
          </div>
        ))}
      </div>

      <ActiveUsers
        alphaUsers={queues.alfa.activeUsers}
        betaUsers={queues.beta.activeUsers}
        omegaUsers={queues.omega.activeUsers}
        onRefresh={fetchQueueStats}
      />
    </div>
  );
} 