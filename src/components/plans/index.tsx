'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Server, RefreshCcw } from 'lucide-react';
import Planos from './planos';
import Renovacao from './renovação';
import Image from 'next/image';
import PromotionBanner from '../PromotionBanner';

interface PlansProps {
  id?: string;
}

const Plans = ({ id }: PlansProps = {}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'plans' | 'renewal'>('plans');
  
  return (
    <section className="relative py-24 w-full overflow-hidden" id={id}>
      {/* Efeito de luz pulsante no fundo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-blue-600/5 blur-3xl animate-pulse -z-10" />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-3xl animate-pulse -z-10" style={{ animationDelay: "1s" }} />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-3xl animate-pulse -z-10" style={{ animationDelay: "1.5s" }} />
      
      {/* Linhas diagonais decorativas */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div 
            key={i}
            className="absolute h-px bg-gradient-to-r from-transparent via-blue-500/10 to-transparent transform -rotate-45"
            style={{
              top: `${20 * i}%`,
              left: '-10%',
              right: '-10%',
            }}
          />
        ))}
      </div>
      
      <div className="relative z-10 container mx-auto px-4 max-w-5xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center gap-2 text-sm text-blue-300 bg-blue-950/30 px-4 py-2 rounded-full mb-6 backdrop-blur-sm hover:bg-blue-900/40 transition-all duration-300 group border border-blue-500/20">
            <div className="flex items-center gap-2">
              <Image src="/darkcloud.png" alt="DarkCloud" width={16} height={16} className="text-blue-400 group-hover:text-blue-300 group-hover:animate-pulse" />
              <h1 className="text-lg font-bold">DarkCloud</h1>
            </div>
          </div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="mb-6 text-4xl font-bold tracking-tight text-white"
          >
            Escolha o <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">plano ideal</span> para você
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-lg text-gray-300 max-w-2xl mx-auto"
          >
            Oferecemos diferentes configurações para atender às suas necessidades de jogo, 
            desde títulos casuais até os mais exigentes.
          </motion.p>
          
          <div className="flex justify-center gap-4 mt-8 mb-8">
            <button
              onClick={() => setActiveTab('plans')}
              className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 ${activeTab === 'plans' ? 'bg-blue-600 text-white' : 'bg-blue-950/30 text-gray-300 hover:bg-blue-900/40'}`}
            >
              <Server className="h-4 w-4" />
              <span>Novos Planos</span>
            </button>
            <button
              onClick={() => setActiveTab('renewal')}
              className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 ${activeTab === 'renewal' ? 'bg-blue-600 text-white' : 'bg-blue-950/30 text-gray-300 hover:bg-blue-900/40'}`}
            >
              <RefreshCcw className="h-4 w-4" />
              <span>Renovação</span>
            </button>
          </div>

          <PromotionBanner />
        </motion.div>

        {activeTab === 'plans' && <Planos onHoverChange={setHoveredIndex} hoveredIndex={hoveredIndex} />}
        {activeTab === 'renewal' && <Renovacao onHoverChange={setHoveredIndex} hoveredIndex={hoveredIndex} />}
        
        {/* Mensagem de garantia */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          viewport={{ once: true }}
          className="mt-10 text-center"
        >
          <div className="bg-blue-950/20 backdrop-blur-sm border border-blue-500/10 rounded-lg px-6 py-4 max-w-3xl mx-auto">
            <p className="text-gray-300">
              <span className="text-blue-400 font-medium">Planos Premium:</span> Todos os planos Prime, Elite e Plus incluem suporte prioritário e garantia de disponibilidade 24/7.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Plans;
