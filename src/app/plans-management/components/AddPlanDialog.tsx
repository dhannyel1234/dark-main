import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface AddPlanDialogProps {
  onSuccess: () => void;
}

export default function AddPlanDialog({ onSuccess }: AddPlanDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    userId: "",
    userName: "",
    planType: "",
    duration: "",
  });

  const validateTimeFormat = (time: string): boolean => {
    // Verifica se o formato é HH:MM
    const timeRegex = /^([0-9]{1,2}):([0-9]{2})$/;
    if (!timeRegex.test(time)) return false;

    const [hours, minutes] = time.split(":").map(Number);
    return hours >= 0 && minutes >= 0 && minutes < 60;
  };

  const validateDiscordId = (id: string): boolean => {
    // IDs do Discord são números de 17-20 dígitos
    return /^\d{17,20}$/.test(id);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      console.log('DEBUG - Iniciando submissão do formulário:', formData);

      // Validar campos obrigatórios
      if (!formData.userId || !formData.userName || !formData.planType || !formData.duration) {
        throw new Error("Por favor, preencha todos os campos");
      }

      // Validar ID do Discord
      if (!validateDiscordId(formData.userId)) {
        throw new Error("ID do Discord inválido. Deve ser um número de 17-20 dígitos");
      }

      // Verificar se o usuário já tem um plano ativo do mesmo tipo
      const checkResponse = await fetch(`/api/plans/check?userId=${formData.userId}&planType=${formData.planType}`);
      const checkData = await checkResponse.json();
      
      if (checkData.hasActivePlan) {
        throw new Error(`Usuário já possui um plano ${formData.planType.toUpperCase()} ativo`);
      }

      // Validar formato da duração
      let duration = 0;
      if (formData.planType === "alfa") {
        // Validar formato HH:MM para plano Alfa
        if (!validateTimeFormat(formData.duration)) {
          throw new Error("Formato de tempo inválido. Use HH:MM (exemplo: 02:30)");
        }
        const [hours, minutes] = formData.duration.split(":").map(Number);
        duration = hours + (minutes / 60); // Converter para horas
        
        if (duration <= 0) {
          throw new Error("A duração deve ser maior que zero");
        }

        // Log para debug
        console.log('DEBUG - Duração do plano Alfa:', {
          hours,
          minutes,
          duration,
          durationInMinutes: duration * 60
        });
      } else {
        // Validar número de dias para Beta e Omega
        const days = parseInt(formData.duration);
        if (isNaN(days) || days <= 0) {
          throw new Error("Por favor, insira um número válido de dias");
        }
        duration = days; // Manter em dias para Beta e Omega
      }

      // Log para debug
      console.log('DEBUG - Enviando plano:', {
        userId: formData.userId,
        userName: formData.userName,
        planType: formData.planType,
        duration,
        originalDuration: formData.duration
      });

      const response = await fetch("/api/plans/active", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: formData.userId,
          userName: formData.userName,
          planType: formData.planType,
          duration: duration // Enviar em horas para Alfa e em dias para Beta/Omega
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Falha ao adicionar plano");
      }

      toast.success("Plano adicionado com sucesso");
      setOpen(false);
      onSuccess();
      setFormData({ userId: "", userName: "", planType: "", duration: "" });
    } catch (error) {
      console.error("Erro ao adicionar plano:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao adicionar plano";
      toast.error(errorMessage);
      // Não fechar o diálogo em caso de erro
      // Manter os dados do formulário para que o usuário possa corrigir
    } finally {
      setLoading(false);
    }
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    if (formData.planType === "alfa") {
      // Para plano Alfa, formatar automaticamente para HH:MM
      value = value.replace(/[^\d:]/g, ""); // Remove caracteres não numéricos exceto ":"
      
      if (!value.includes(":") && value.length >= 2) {
        // Adicionar ":" automaticamente após as horas
        value = value.slice(0, 2) + ":" + value.slice(2);
      }
      
      // Limitar o comprimento total para HH:MM (5 caracteres)
      if (value.includes(":")) {
        const [hours, minutes] = value.split(":");
        if (hours && hours.length > 2) value = hours.slice(0, 2) + ":" + (minutes || "");
        if (minutes && minutes.length > 2) value = hours + ":" + minutes.slice(0, 2);
      }
    } else {
      // Para outros planos, aceitar apenas números
      value = value.replace(/[^\d]/g, "");
    }
    
    setFormData({ ...formData, duration: value });
  };

  const handleUserIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Aceitar apenas números no ID do Discord
    const value = e.target.value.replace(/[^\d]/g, "");
    setFormData({ ...formData, userId: value });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm">
          Adicionar Plano
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Novo Plano</DialogTitle>
          <DialogDescription>
            Preencha os dados abaixo para adicionar um novo plano para o usuário
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="userId" className="text-right">
              ID do Discord
            </Label>
            <Input
              id="userId"
              className="col-span-3"
              value={formData.userId}
              onChange={handleUserIdChange}
              placeholder="Ex: 123456789012345678"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="userName" className="text-right">
              Nome do Usuário
            </Label>
            <Input
              id="userName"
              className="col-span-3"
              value={formData.userName}
              onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
              placeholder="Ex: João Silva"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="planType" className="text-right">
              Tipo do Plano
            </Label>
            <Select
              value={formData.planType}
              onValueChange={(value) => setFormData({ ...formData, planType: value, duration: "" })}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione o tipo do plano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alfa">Alfa</SelectItem>
                <SelectItem value="omega">ELITE 1</SelectItem>
                <SelectItem value="beta">Prime 1</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="duration" className="text-right">
              {formData.planType === "alfa" ? "Duração (HH:MM)" : "Duração (Dias)"}
            </Label>
            <Input
              id="duration"
              className="col-span-3"
              value={formData.duration}
              onChange={handleDurationChange}
              placeholder={formData.planType === "alfa" ? "Ex: 02:30" : "Ex: 7"}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading}
          >
            {loading ? "Adicionando..." : "Adicionar Plano"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 