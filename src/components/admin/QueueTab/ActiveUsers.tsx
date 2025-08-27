import { RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import ActiveUserCard from './ActiveUserCard';
import { useToast } from "@/hooks/use-toast";

interface ActiveUsersProps {
    alphaUsers: any[];
    betaUsers: any[];
    omegaUsers: any[];
    onRefresh: () => void;
}

export default function ActiveUsers({ alphaUsers, betaUsers, omegaUsers, onRefresh }: ActiveUsersProps) {
    const { toast } = useToast();

    const handleRemove = async (userId: string) => {
        try {
            const response = await fetch('/api/queue/admin/deactivate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });

            const data = await response.json();
            
            if (data.success) {
                toast({
                    title: 'Sucesso!',
                    description: 'Usuário removido com sucesso!',
                });
                onRefresh(); // Atualiza a lista após remover
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

    const renderQueueSection = (title: string, users: any[], titleColor: string) => (
        <div className="space-y-4">
            <h3 className={`text-lg font-semibold ${titleColor}`}>{title}</h3>
            <div className="flex flex-wrap gap-4">
                {users.length > 0 ? (
                    users.map(user => (
                        <div key={user.userId} className="flex-1 min-w-[300px] max-w-[400px]">
                            <ActiveUserCard user={user} onRemove={handleRemove} />
                        </div>
                    ))
                ) : (
                    <span className="text-gray-500">Nenhum usuário ativo</span>
                )}
            </div>
        </div>
    );

    return (
        <div className="bg-[#151823] p-6 rounded-lg border border-gray-800 mt-6 space-y-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Usuários Ativos</h2>
                <Button 
                    variant="outline" 
                    size="sm"
                    onClick={onRefresh}
                    className="text-gray-400 hover:text-white"
                >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Atualizar
                </Button>
            </div>
            {renderQueueSection("Fila Alfa", alphaUsers, "text-blue-400")}
            {renderQueueSection("Prime 1", betaUsers, "text-green-400")}
            {renderQueueSection("ELITE 1", omegaUsers, "text-yellow-400")}
        </div>
    );
} 