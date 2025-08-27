'use client';

import { Copy, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import Image from 'next/image';

interface ActiveUserCardProps {
    user: any;
    onRemove: (userId: string) => void;
}

export default function ActiveUserCard({ user, onRemove }: ActiveUserCardProps) {
    const { toast } = useToast();
    const [activeTime, setActiveTime] = useState('N/A');

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({
            description: "Copiado para a área de transferência!"
        });
    };

    // Função para formatar o tempo
    const formatTime = (ms: number) => {
        const seconds = Math.floor((ms / 1000) % 60);
        const minutes = Math.floor((ms / (1000 * 60)) % 60);
        const hours = Math.floor(ms / (1000 * 60 * 60));

        const parts = [];
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

        return parts.join(' ');
    };

    // Atualizar o tempo ativo a cada segundo
    useEffect(() => {
        if (!user.activatedAt) {
            setActiveTime('N/A');
            return;
        }

        const updateTime = () => {
            const activatedAt = new Date(user.activatedAt).getTime();
            const now = new Date().getTime();
            const diff = now - activatedAt;
            setActiveTime(formatTime(diff));
        };

        // Atualizar imediatamente
        updateTime();

        // Configurar o intervalo de atualização
        const interval = setInterval(updateTime, 1000);

        // Limpar o intervalo quando o componente for desmontado
        return () => clearInterval(interval);
    }, [user.activatedAt]);

    return (
        <div className="bg-[#101117] rounded p-3 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
                <Image src={user.userImage} alt={user.userName} width={32} height={32} className="rounded-full" />
                <div>
                    <div className="font-semibold">{user.userName}</div>
                    <div className="text-sm text-gray-400">{user.userEmail}</div>
                </div>
            </div>
            <div className="grid gap-1 text-sm">
                <div className="flex justify-between">
                    <span className="text-gray-400">Máquina:</span>
                    <span>{user.machineInfo?.name}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-400">IP:</span>
                    <Button variant="ghost" size="sm" onClick={() => handleCopy(user.machineInfo?.ip)} className="h-6">
                        {user.machineInfo?.ip}
                        <Copy className="h-3 w-3 ml-1" />
                    </Button>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-400">Usuário:</span>
                    <Button variant="ghost" size="sm" onClick={() => handleCopy(user.machineInfo?.user)} className="h-6">
                        {user.machineInfo?.user}
                        <Copy className="h-3 w-3 ml-1" />
                    </Button>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-400">Senha:</span>
                    <Button variant="ghost" size="sm" onClick={() => handleCopy(user.machineInfo?.password)} className="h-6">
                        ••••••••
                        <Copy className="h-3 w-3 ml-1" />
                    </Button>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-400">Tempo ativo:</span>
                    <span>{activeTime}</span>
                </div>
                <div className="mt-2">
                    <Button 
                        variant="destructive" 
                        size="sm" 
                        className="w-full"
                        onClick={() => onRemove(user.userId)}
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remover
                    </Button>
                </div>
            </div>
        </div>
    );
} 