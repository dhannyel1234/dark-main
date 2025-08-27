'use client';

import { RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface QueueCardProps {
    title: string;
    color: 'blue' | 'green' | 'yellow';
    waiting: number;
    active: any[];
    loading: boolean;
    onRefresh: () => void;
    onNext: () => void;
}

const colorMap = {
    blue: {
        title: 'text-blue-400',
        button: 'bg-blue-600 hover:bg-blue-700'
    },
    green: {
        title: 'text-green-400',
        button: 'bg-green-600 hover:bg-green-700'
    },
    yellow: {
        title: 'text-yellow-400',
        button: 'bg-yellow-600 hover:bg-yellow-700'
    }
};

export default function QueueCard({
    title,
    color,
    waiting,
    active,
    loading,
    onRefresh,
    onNext
}: QueueCardProps) {
    const colors = colorMap[color];

    return (
        <div className="bg-[#151823] rounded-lg p-4 border border-gray-800">
            <div className="flex justify-between items-center mb-4">
                <h3 className={`text-xl font-bold ${colors.title}`}>{title}</h3>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={onRefresh}
                    disabled={loading}
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
            </div>
            <div className="flex flex-col gap-2 mb-4">
                <span className="text-gray-300">
                    Aguardando: <span className="font-bold">{waiting}</span>
                </span>
                <span className="text-gray-300">
                    Ativos: <span className="font-bold">{active.length}</span>
                </span>
            </div>
            <Button
                className={`${colors.button} text-white w-full`}
                onClick={onNext}
                disabled={loading || waiting === 0}
            >
                {loading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                    'Próximo da fila'
                )}
            </Button>
        </div>
    );
} 