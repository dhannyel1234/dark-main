'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center relative overflow-hidden bg-black">
      {/* Fundo com o mesmo estilo da landing page */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-blue-500/5 blur-3xl animate-pulse" />
      <div className="absolute top-1/4 right-0 w-64 h-64 rounded-full bg-blue-500/5 blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 left-0 w-72 h-72 rounded-full bg-blue-500/5 blur-3xl animate-pulse" style={{ animationDelay: "1.5s" }}></div>
      
      {/* Header com logo */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-md border-b border-white/5">
        <div className="container mx-auto flex justify-between items-center py-4 px-6">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Image src="/darkcloud.png" width={32} height={32} alt="DarkCloud Logo" sizes="32px" />
            </Link>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/" className="text-white hover:text-blue-400 transition-colors duration-200">Início</Link>
            <Link href="/#plans" className="text-white hover:text-blue-400 transition-colors duration-200">Assinatura</Link>
            <Link href="https://discord.gg/darkcloud" className="text-white hover:text-blue-400 transition-colors duration-200 flex items-center gap-1">
              Discord
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17l9.2-9.2M17 17V7H7" />
              </svg>
            </Link>
            <Link href="/faq" className="text-white hover:text-blue-400 transition-colors duration-200">FAQ</Link>
          </div>
        </div>
      </div>
      
      <div className="z-10 text-center px-6 mt-20">
        {/* Logo grande */}
        <div className="flex justify-center mb-12">
          <Image src="/darkcloud.png" width={120} height={120} alt="DarkCloud Logo" className="mb-4" sizes="120px" />
          <span className="sr-only">DARKCLOUD</span>
        </div>
        
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-2">
          <span className="text-blue-400">Página não</span> encontrada
        </h1>
        
        <p className="text-gray-300 max-w-md mx-auto mb-10 text-lg">
          O conteúdo que você está procurando não existe ou foi movido.
        </p>
        
        <Link 
          href="/" 
          className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-8 rounded-md transition-all duration-300"
        >
          Voltar para o início
        </Link>
      </div>
    </main>
  );
}
