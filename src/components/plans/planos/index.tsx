'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

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
    // Assumindo que as 'specs' virão do backend no futuro. Por agora, usaremos um placeholder.
    specs: string[];
    highlight_color: string | null;
    url: string;
}

// Função para gerar classes de estilo com base na cor de destaque
const getHighlightClasses = (color: string | null) => {
    if (color === 'yellow') {
        return {
            border: 'border-yellow-500/80',
            hoverBorder: 'hover:border-yellow-500/80',
            shadow: 'hover:shadow-yellow-500/20',
            bg: 'bg-yellow-400/20 border-yellow-500/40',
            text: 'text-yellow-300',
            priceText: 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-700',
            button: 'bg-yellow-500 hover:bg-yellow-400 text-gray-900 border border-yellow-600 shadow-yellow-300/30',
            glow: 'bg-yellow-400/20',
        };
    }
    // Cor padrão (azul)
    return {
        border: 'border-gray-700/30',
        hoverBorder: 'hover:border-blue-500/20',
        shadow: 'hover:shadow-blue-500/10',
        bg: 'bg-black/40 border-gray-700/50',
        text: 'text-gray-300',
        priceText: 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-white',
        button: 'bg-blue-600 hover:bg-blue-500 text-white',
        glow: 'bg-blue-500/10',
    };
};


interface PlanosProps {
    onHoverChange: (index: number | null) => void;
    hoveredIndex: number | null;
}

const Planos = ({ onHoverChange, hoveredIndex }: PlanosProps) => {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    // O estado local de hover é substituído pelas props

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const response = await fetch('/api/plans');
                if (!response.ok) throw new Error('Failed to fetch plans');
                const data = await response.json();
                // Gerar specs dinamicamente baseado nas características do plano
                const formattedData = data.map((plan: any) => {
                    const specs = [
                        "450 JOGOS STEAM",
                        "SERVIDOR BR",
                        plan.limited_session ? "SESSÃO LIMITADA" : "SESSÃO ILIMITADA",
                        plan.saves_files ? "SALVA OS ARQUIVOS" : "NÃO SALVA OS ARQUIVOS",
                        "CONTÉM SPOT",
                        plan.has_queue ? "FILA DE MÁQUINAS" : "SEM FILA",
                        "4 NÚCLEOS"
                    ];
                    
                    return {
                        ...plan,
                        specs,
                        url: `/order?planId=${plan.id}`
                    };
                });
                setPlans(formattedData);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchPlans();
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[400px] w-full rounded-2xl" />)}
            </div>
        );
    }

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
            {plans.map((plan, index) => {
                const styles = getHighlightClasses(plan.highlight_color);
                const getDurationText = (days: number, type: 'days' | 'hours') => {
                    if (type === 'days') {
                        return days === 1 ? 'dia' : 'dias';
                    } else {
                        return days === 1 ? 'hora' : 'horas';
                    }
                };
                const period = plan.duration_days ? `/ ${plan.duration_days} ${getDurationText(plan.duration_days, plan.duration_type)}` : '/ hora';

                return (
                    <motion.div
                        key={plan.id}
                        variants={itemVariants}
                        onMouseEnter={() => onHoverChange(index)}
                        onMouseLeave={() => onHoverChange(null)}
                        className={`relative rounded-2xl overflow-hidden transition-all duration-500 bg-gradient-to-br from-gray-900/30 to-black/70 backdrop-blur-md border ${styles.border} ${styles.hoverBorder} hover:shadow-lg ${styles.shadow}`}
                        whileHover={{ y: -5 }}
                    >
                        <div className="absolute top-0 left-0 p-3">
                            <div className={`inline-flex items-center justify-center rounded-full px-3 py-1 backdrop-blur-sm ${styles.bg}`}>
                                <span className={`text-xs font-medium ${styles.text}`}>{plan.name}</span>
                            </div>
                        </div>
                        
                        <div className="relative p-8 pt-12">
                            {hoveredIndex === index && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.5 }}
                                    className={`absolute -top-10 -right-10 w-20 h-20 rounded-full blur-xl ${styles.glow}`}
                                />
                            )}
                            
                            <div className="mb-4 relative">
                                <h3 className="text-3xl font-bold text-white mb-1">
                                    <span className={styles.priceText}>R${Number(plan.price).toFixed(2)}</span>
                                    <span className="text-sm text-gray-400 font-normal ml-1">{period}</span>
                                </h3>
                                <p className="text-gray-300 text-sm">{plan.description}</p>
                            </div>
                            
                            <ul className="space-y-2 mb-6">
                                {plan.specs.map((spec, specIndex) => (
                                    <li key={specIndex} className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-gray-400 shrink-0" />
                                        <span className="text-gray-300 text-sm">{spec}</span>
                                    </li>
                                ))}
                            </ul>
                            
                            <div className="pt-2">
                                <a href={plan.url} className={`block w-full text-center py-3 rounded-lg font-semibold transition-colors mt-8 ${styles.button}`}>
                                    Comprar Agora
                                </a>
                            </div>
                        </div>
                    </motion.div>
                )
            })}
        </motion.div>
    );
};

export default Planos;