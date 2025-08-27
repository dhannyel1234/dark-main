'use client';

import { motion } from 'framer-motion';
import { CheckCircle, Package } from 'lucide-react';

interface Plan {
    id: string;
    name: string;
    price: number | string;
    duration_days: number | null;
    duration_type: 'days' | 'hours';
    limited_session: boolean;
    saves_files: boolean;
    has_queue: boolean;
    description: string | null;
    highlight_color: string | null;
    stock: number;
    provisioning_type?: string;
    individual_stock?: number;
}

interface PlanCardProps {
    plan: Plan;
    isSelected: boolean;
    onSelect: (planId: string) => void;
}

const getCardClasses = (color: string | null, isSelected: boolean) => {
    const base = 'bg-gray-800 border-2 transition-all duration-200 hover:shadow-lg';
    
    if (isSelected) {
        if (color === 'yellow') {
            return `${base} border-yellow-500 shadow-yellow-500/20`;
        }
        return `${base} border-blue-500 shadow-blue-500/20`;
    }
    
    return `${base} border-gray-700 hover:border-gray-600`;
};

export default function PlanCard({ plan, isSelected, onSelect }: PlanCardProps) {
    const cardClasses = getCardClasses(plan.highlight_color, isSelected);
    const getDurationText = (days: number, type: 'days' | 'hours') => {
        if (type === 'days') {
            return days === 1 ? 'dia' : 'dias';
        } else {
            return days === 1 ? 'hora' : 'horas';
        }
    };
    const period = plan.duration_days ? `/ ${plan.duration_days} ${getDurationText(plan.duration_days, plan.duration_type)}` : '/ hora';
    const priceColor = plan.highlight_color === 'yellow' ? 'text-yellow-400' : 'text-blue-400';

    return (
        <motion.div
            onClick={() => onSelect(plan.id)}
            className={`${cardClasses} rounded-lg cursor-pointer p-6 relative`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
        >
            {/* Badge do nome do plano */}
            <div className="absolute top-4 right-4">
                <span className={`px-2 py-1 text-xs font-medium rounded ${plan.highlight_color === 'yellow' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {plan.name}
                </span>
            </div>
            
            {/* Preço */}
            <div className="mb-4">
                <div className="text-2xl font-bold text-white">
                    <span className={priceColor}>R${Number(plan.price).toFixed(2)}</span>
                    <span className="text-sm text-gray-400 font-normal ml-1">{period}</span>
                </div>
                {plan.description && (
                    <p className="text-gray-400 text-sm mt-1">{plan.description}</p>
                )}
            </div>
                
            {/* Características */}
            <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-400 shrink-0" />
                    <span className="text-gray-300 text-xs">
                        {plan.limited_session ? 'Sessão Limitada' : 'Sessão Ilimitada'}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-400 shrink-0" />
                    <span className="text-gray-300 text-xs">
                        {plan.saves_files ? 'Salva Arquivos' : 'Não Salva Arquivos'}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-400 shrink-0" />
                    <span className="text-gray-300 text-xs">
                        {plan.has_queue ? 'Com Fila' : 'Sem Fila'}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-400 shrink-0" />
                    <span className="text-gray-300 text-xs">Parsec + Moonlight</span>
                </div>
            </div>

            {/* Estoque e seleção */}
            <div className="flex items-center justify-between">
                <div className="flex items-center text-gray-400 text-sm">
                    <Package className="w-4 h-4 mr-1" />
                    <span>Estoque: <span className={`font-bold ${plan.stock > 0 ? 'text-green-400' : 'text-red-400'}`}>{plan.stock || 0}</span></span>
                </div>
                
                {isSelected ? (
                    <div className="flex items-center text-green-400 text-sm">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        <span>Selecionado</span>
                    </div>
                ) : (
                    plan.stock === 0 && (
                        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">Esgotado</span>
                    )
                )}
            </div>
        </motion.div>
    );
}