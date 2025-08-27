'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <motion.div
          animate={{ 
            scale: [1, 1.05, 1],
            rotate: [0, -2, 2, 0]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            repeatType: "reverse"
          }}
          className="mx-auto mb-8"
        >
          <Image 
            src="/darkcloud.png" 
            alt="Dark Cloud" 
            width={150} 
            height={150}
            className="mx-auto"
          />
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-4xl font-bold mb-4"
        >
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">Página  não</span> encontrada
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-muted-foreground mb-8"
        >
          O conteúdo que você está procurando <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">não  existe ou foi movido.</span>
        </motion.p>
        
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link href="/" className="px-6 py-3 rounded-lg bg-blue-500/40 text-white font-medium hover:bg-blue-500/60 transition-colors">
            Voltar para o início
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
