'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

export default function MaintenancePage() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full pt-24">
      <AnimatePresence>
        {isLoaded && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center text-center max-w-3xl px-4"
          >
            {/* Logo com animação de rotação */}
            <motion.div 
              className="mb-8 relative w-32 h-32"
              animate={{ rotate: 360 }}
              transition={{ 
                duration: 8,
                ease: "linear",
                repeat: Infinity,
                repeatType: "loop"
              }}
            >
              <Image 
                src="/darkcloud.png" 
                alt="Dark Logo" 
                fill
                style={{ objectFit: 'contain' }}
                priority
              />
            </motion.div>
            
            {/* Título */}
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">
              Em Manutenção
            </h1>
            
            {/* Mensagem */}
            <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mb-12">
              Estamos trabalhando para melhorar sua experiência. Voltaremos em breve com novidades incríveis!
            </p>
            
            {/* Botão do Discord */}
            <motion.a 
              href="https://discord.gg/5buEfNDUB4" 
              target="_blank" 
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-3 text-white text-lg"
            >
              Acesse nosso Discord
            </motion.a>
            
            {/* Status */}
            <div className="mt-12 p-4 rounded-lg">
              <p className="text-gray-300">
                Status: <span className="text-yellow-400 font-medium">Manutenção em Andamento</span>
              </p>
              <p className="text-gray-300 mt-1">
                Retorno estimado: <span className="text-green-400 font-medium">Em breve</span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}