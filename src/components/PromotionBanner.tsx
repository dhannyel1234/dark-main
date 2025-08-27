'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const PROMO_START = new Date();
const PROMO_DURATION_DAYS = 7;
const PROMO_END = new Date(PROMO_START.getTime() + PROMO_DURATION_DAYS * 24 * 60 * 60 * 1000);

function getTimeRemaining(endDate: Date) {
  const total = endDate.getTime() - new Date().getTime();
  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));
  return { total, days, hours, minutes, seconds };
}

export default function PromotionBanner() {
  const [timeLeft, setTimeLeft] = useState({ total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTimeLeft(getTimeRemaining(PROMO_END));
    
    const timer = setInterval(() => {
      setTimeLeft(getTimeRemaining(PROMO_END));
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  if (!mounted || timeLeft.total <= 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full flex justify-center z-50"
    >
      <div className="flex flex-col md:flex-row gap-6 w-full max-w-2xl mb-2">
        {/* Card 1 */}
        <div className="flex-1 border border-yellow-400 rounded-xl px-8 py-3 shadow-lg flex flex-col items-center justify-center mb-0 bg-transparent">
          <span className="font-bold text-2xl text-yellow-400 mb-1 mt-1">Oferta Especial!</span>
          <span className="text-white text-center">Descontos exclusivos nos planos por tempo limitado.</span>
        </div>
        {/* Card 2 */}
        <div className="flex-1 border border-yellow-400 rounded-xl px-8 py-3 shadow-lg flex flex-col items-center relative mb-0 bg-transparent">
          <span className="absolute -top-4 left-8 bg-yellow-400 text-[#0B101C] text-xs font-bold px-4 py-1 rounded-full border border-yellow-300 shadow">Promoção</span>
          <div className="flex gap-4 text-2xl font-mono text-yellow-400 mb-2 mt-2">
            <span><b>{timeLeft.days}</b>d</span>:
            <span><b>{String(timeLeft.hours).padStart(2, '0')}</b>h</span>:
            <span><b>{String(timeLeft.minutes).padStart(2, '0')}</b>m</span>:
            <span><b>{String(timeLeft.seconds).padStart(2, '0')}</b>s</span>
          </div>
          <span className="text-xs text-yellow-200 mt-1">Promoção válida por 7 dias.</span>
        </div>
      </div>
    </motion.div>
  );
} 