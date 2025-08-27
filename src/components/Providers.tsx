'use client';

import { useEffect } from 'react';
import initializePlanChecker from '@/lib/plan-checker-initializer';

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Inicializar plan checker
    initializePlanChecker();
    
    // Inicializar serviços
    fetch('/api/init-services')
      .then(response => response.json())
      .then(data => console.log('Status dos serviços:', data.status))
      .catch(error => console.error('Erro ao inicializar serviços:', error));
  }, []);

  return (
    <>
      {children}
    </>
  );
}