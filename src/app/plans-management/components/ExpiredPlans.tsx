"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Plan {
  id: string;
  userId: string;
  userName: string;
  planType: string;
  startDate: string;
  endDate: string;
  status: string;
  diasExpirado: number;
}

export default function ExpiredPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reactivationHours, setReactivationHours] = useState<number>(0);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Memoize fetchExpiredPlans para evitar recriações desnecessárias
  const fetchExpiredPlans = useCallback(async () => {
    console.log('[ExpiredPlans] Iniciando busca de planos expirados...', new Date().toISOString());
    try {
      setLoading(true);
      const response = await fetch("/api/plans/expired", {
        // Adicionar cache: 'no-store' para evitar cache
        cache: 'no-store',
        headers: {
          'pragma': 'no-cache',
          'cache-control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error("Falha ao carregar planos expirados");
      }
      
      const data = await response.json();
      console.log('[ExpiredPlans] Dados recebidos:', {
        timestamp: new Date().toISOString(),
        quantidade: data.length,
        planos: data
      });
      
      setPlans(data);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      console.error('[ExpiredPlans] Erro ao carregar planos:', err);
      setError("Erro ao carregar planos expirados");
    } finally {
      setLoading(false);
    }
  }, []);

  // Efeito para carregar dados iniciais
  useEffect(() => {
    console.log('[ExpiredPlans] Montando componente...');
    fetchExpiredPlans();
    
    // Atualizar a cada 15 segundos
    const interval = setInterval(() => {
      console.log('[ExpiredPlans] Atualizando automaticamente...', new Date().toISOString());
      fetchExpiredPlans();
    }, 15000);

    return () => {
      console.log('[ExpiredPlans] Desmontando componente...');
      clearInterval(interval);
    };
  }, [fetchExpiredPlans]);

  const handleCancelPlan = async (userId: string, userName: string) => {
    console.log('[ExpiredPlans] Tentando cancelar plano:', { userId, userName });
    try {
      const response = await fetch("/api/plans/deactivate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          userId,
          reason: "Cancelado após expiração"
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Falha ao cancelar plano");
      }

      console.log('[ExpiredPlans] Plano cancelado com sucesso:', { userId, userName });
      toast.success(`Plano de ${userName} movido para cancelados`);
      fetchExpiredPlans();
    } catch (error) {
      console.error("[ExpiredPlans] Erro ao cancelar plano:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao cancelar plano");
    }
  };

  const handleReactivatePlan = async (userId: string, userName: string, planType: string) => {
    console.log('[ExpiredPlans] Tentando reativar plano:', { userId, userName, planType });
    try {
      if (planType.toLowerCase() === 'alfa' && reactivationHours <= 0) {
        toast.error("Por favor, insira um número válido de horas para reativar o plano Alfa");
        return;
      }

      const response = await fetch("/api/plans/reactivate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          userId, 
          planType,
          hours: planType.toLowerCase() === 'alfa' ? reactivationHours : undefined
        }),
      });

      if (!response.ok) {
        throw new Error("Falha ao reativar plano");
      }

      console.log('[ExpiredPlans] Plano reativado com sucesso:', { userId, userName });
      toast.success(`Plano de ${userName} reativado com sucesso`);
      setReactivationHours(0);
      fetchExpiredPlans();
    } catch (error) {
      console.error("[ExpiredPlans] Erro ao reativar plano:", error);
      toast.error("Erro ao reativar plano");
    }
  };

  const calcularDiasExpirado = (endDate: string) => {
    const end = new Date(endDate);
    const hoje = new Date();
    const diff = Math.floor((hoje.getTime() - end.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return <div className="flex justify-center p-4">Carregando...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  // Log para debug
  console.log('Renderizando planos expirados:', plans);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Planos Expirados</CardTitle>
            <CardDescription>
              Lista de planos que já expiraram e precisam ser renovados
              <br />
              <small className="text-muted-foreground">
                Última atualização: {lastUpdate.toLocaleTimeString()}
              </small>
            </CardDescription>
          </div>
          <Button 
            onClick={() => {
              console.log('[ExpiredPlans] Atualizando manualmente...');
              fetchExpiredPlans();
            }}
            variant="outline"
            size="sm"
          >
            Atualizar Lista
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50">
              <TableHead>Usuário</TableHead>
              <TableHead>Tipo do Plano</TableHead>
              <TableHead>Data de Início</TableHead>
              <TableHead>Data de Término</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Dias Expirado</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  Nenhum plano expirado encontrado
                </TableCell>
              </TableRow>
            ) : (
              plans.map((plan) => (
                <TableRow key={plan.id} className="hover:bg-secondary/10">
                  <TableCell className="font-medium">{plan.userName}</TableCell>
                  <TableCell>
                    <Badge variant={plan.planType === "Premium" ? "default" : "secondary"}>
                      {plan.planType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatDateTime(plan.startDate)}
                  </TableCell>
                  <TableCell>
                    {formatDateTime(plan.endDate)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="destructive">
                      Expirado há {plan.diasExpirado} dias
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {plan.diasExpirado} dias
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {plan.planType.toLowerCase() === 'alfa' && (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="1"
                            placeholder="Horas"
                            value={reactivationHours || ''}
                            onChange={(e) => setReactivationHours(Number(e.target.value))}
                            className="w-20"
                          />
                        </div>
                      )}
                      <Button
                        onClick={() => handleReactivatePlan(plan.userId, plan.userName, plan.planType)}
                        variant="outline"
                        size="sm"
                      >
                        Reativar
                      </Button>
                      <Button
                        onClick={() => handleCancelPlan(plan.userId, plan.userName)}
                        variant="destructive"
                        size="sm"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
} 