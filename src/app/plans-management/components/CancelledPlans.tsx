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
  cancelDate: string;
  cancelReason: string;
}

// Adicionar função de formatação de data
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

export default function CancelledPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reactivationHours, setReactivationHours] = useState<number>(0);
  const [removingPlan, setRemovingPlan] = useState<string | null>(null);

  useEffect(() => {
    fetchCancelledPlans();
  }, []);

  const fetchCancelledPlans = async () => {
    try {
      const response = await fetch("/api/plans/cancelled");
      if (!response.ok) {
        throw new Error("Falha ao carregar planos cancelados");
      }
      const data = await response.json();
      setPlans(data);
      setError(null);
    } catch (err) {
      setError("Erro ao carregar planos cancelados");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePlan = async (userId: string, userName: string, planType: string) => {
    try {
      setRemovingPlan(userId);
      const response = await fetch("/api/plans/remove", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          userId,
          planType: planType.toLowerCase() 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Falha ao remover plano permanentemente");
      }

      toast.success(`Plano ${planType} de ${userName} removido permanentemente`);
      await fetchCancelledPlans();
    } catch (error) {
      console.error("Erro ao remover plano:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao remover plano permanentemente");
    } finally {
      setRemovingPlan(null);
    }
  };

  const handleReactivatePlan = async (userId: string, userName: string, planType: string) => {
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

      toast.success(`Plano de ${userName} reativado com sucesso`);
      setReactivationHours(0); // Reset do valor
      fetchCancelledPlans(); // Recarrega a lista
    } catch (error) {
      console.error("Erro ao reativar plano:", error);
      toast.error("Erro ao reativar plano");
    }
  };

  const getRemainingTime = (planType: string, endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffInHours = Math.max(0, (end.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (planType.toLowerCase() === 'alfa') {
      return null; // Retornamos null pois agora vamos mostrar o input
    } else {
      const days = Math.ceil(diffInHours / 24);
      return `${days} dias`;
    }
  };

  if (loading) {
    return <div className="flex justify-center p-4">Carregando...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Planos Cancelados</CardTitle>
            <CardDescription>Lista de planos que foram cancelados pelos usuários ou pelo sistema</CardDescription>
          </div>
          <Button 
            onClick={() => fetchCancelledPlans()}
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
              <TableHead>Data de Cancelamento</TableHead>
              <TableHead>Motivo do Cancelamento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map((plan) => (
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
                  {formatDateTime(plan.cancelDate)}
                </TableCell>
                <TableCell>{plan.cancelReason}</TableCell>
                <TableCell>
                  <Badge variant="secondary">Cancelado</Badge>
                </TableCell>
                <TableCell className="space-x-2">
                  <div className="flex gap-2">
                    {plan.planType.toLowerCase() === 'alfa' && (
                      <Input
                        type="number"
                        placeholder="Horas"
                        className="w-20"
                        value={reactivationHours}
                        onChange={(e) => setReactivationHours(Number(e.target.value))}
                      />
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          Remover
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover Plano</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja remover permanentemente o plano de {plan.userName}?
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRemovePlan(plan.userId, plan.userName, plan.planType)}
                            disabled={removingPlan === plan.userId}
                            className={removingPlan === plan.userId ? "opacity-50 cursor-not-allowed" : ""}
                          >
                            {removingPlan === plan.userId ? (
                              <>
                                <span className="animate-spin mr-2">⌛</span>
                                Removendo...
                              </>
                            ) : (
                              "Remover"
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReactivatePlan(plan.userId, plan.userName, plan.planType)}
                    >
                      Reativar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
} 