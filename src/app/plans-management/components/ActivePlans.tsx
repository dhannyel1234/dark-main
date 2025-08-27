"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import AddPlanDialog from "./AddPlanDialog";

interface Plan {
  id: string;
  userId: string;
  userName: string;
  planType: string;
  startDate: string;
  endDate: string | null;
  status: string;
  alfaTimeLeftMs: number | null;
  timeLeft: string;
}

// Adicionar função de formatação de data
const formatDateTime = (dateString: string | null) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

export default function ActivePlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [clientTime, setClientTime] = useState<string | null>(null);
  // Adiciona estado para termo de pesquisa
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (lastUpdate) {
      setClientTime(lastUpdate.toLocaleTimeString());
    }
  }, [lastUpdate]);

  const fetchActivePlans = async () => {
    try {
      setLoading(true);
      console.log("Buscando planos ativos...");
      const response = await fetch("/api/plans/active");
      
      if (!response.ok) {
        throw new Error(`Falha ao carregar planos ativos: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Planos ativos carregados:", data);
      
      if (Array.isArray(data)) {
        setPlans(data);
        setError(null);
        setLastUpdate(new Date());
      } else {
        throw new Error("Formato de dados inválido");
      }
    } catch (err) {
      console.error("Erro ao carregar planos ativos:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      toast.error("Erro ao carregar planos ativos");
    } finally {
      setLoading(false);
    }
  };

  // Atualização automática a cada 30 segundos
  useEffect(() => {
    fetchActivePlans();
    const interval = setInterval(fetchActivePlans, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleDeactivatePlan = async (userId: string, userName: string) => {
    try {
      const response = await fetch("/api/plans/deactivate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          userId,
          reason: "Desativado pelo administrador"
        }),
      });

      if (!response.ok) {
        throw new Error("Falha ao desativar plano");
      }

      toast.success(`Plano de ${userName} desativado com sucesso`);
      fetchActivePlans(); // Recarrega a lista
    } catch (error) {
      console.error("Erro ao desativar plano:", error);
      toast.error("Erro ao desativar plano");
    }
  };

  // Filtra os planos conforme o termo de pesquisa
  const filteredPlans = plans.filter((plan) => {
    const userName = plan.userName?.toLowerCase() || "";
    const userId = plan.userId?.toString() || "";
    const term = searchTerm.toLowerCase();
    return userName.includes(term) || userId.includes(term);
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Planos Ativos</CardTitle>
            <CardDescription>
              Lista de todos os planos atualmente ativos no sistema
              {lastUpdate && clientTime && (
                <div className="text-xs text-muted-foreground mt-1">
                  Última atualização: {clientTime}
                </div>
              )}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <AddPlanDialog onSuccess={fetchActivePlans} />
            <Button 
              onClick={fetchActivePlans}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              {loading ? "Atualizando..." : "Atualizar Lista"}
            </Button>
          </div>
        </div>
        {/* Campo de pesquisa */}
        <div className="mt-4">
          <input
            type="text"
            placeholder="Pesquisar por usuário ou ID do Discord..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 rounded bg-background border border-muted text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-red-500 p-4 text-center">
            {error}
            <Button 
              onClick={fetchActivePlans}
              variant="outline"
              size="sm"
              className="ml-2"
            >
              Tentar Novamente
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50">
                <TableHead>Usuário</TableHead>
                <TableHead>ID do Discord</TableHead>
                <TableHead>Tipo do Plano</TableHead>
                <TableHead>Data de Início</TableHead>
                <TableHead>Data de Término</TableHead>
                <TableHead>Tempo Restante</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4">
                    Carregando planos...
                  </TableCell>
                </TableRow>
              ) : filteredPlans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4">
                    Nenhum plano ativo encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredPlans.map((plan) => (
                  <TableRow key={plan.id} className="hover:bg-secondary/10">
                    <TableCell className="font-medium">
                      {plan.userName.replace('Discord ID: ', '')}
                    </TableCell>
                    <TableCell className="font-medium">{plan.userId}</TableCell>
                    <TableCell>
                      <Badge variant={
                        plan.planType === "alfa" ? "default" :
                        plan.planType === "omega" ? "secondary" :
                        "outline"
                      }>
                        {plan.planType === 'omega' ? 'ELITE 1' : plan.planType === 'beta' ? 'Prime 1' : plan.planType.charAt(0).toUpperCase() + plan.planType.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatDateTime(plan.startDate)}
                    </TableCell>
                    <TableCell>
                      {plan.planType === 'alfa' ? plan.timeLeft : formatDateTime(plan.endDate)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">Ativo</Badge>
                    </TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            Desativar Plano
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Desativar Plano</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja desativar o plano de {plan.userName.replace('Discord ID: ', '')}? 
                              O plano será movido para a lista de planos cancelados.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeactivatePlan(plan.userId, plan.userName)}
                            >
                              Confirmar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
} 