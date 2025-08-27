'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Loader2, Copy, Check, AlertCircle } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import Image from 'next/image';

interface PaymentData {
  success?: boolean;
  charge?: {
    id: string;
    status: string;
    value: number;
    correlationID: string;
    expiresDate: string;
    expiresIn: number;
  };
  pix?: {
    brCode: string;
    qrCodeImage: string;
    paymentUrl: string;
    pixKey: string;
  };
  status: 'loading' | 'success' | 'error';
  message?: string;
  error?: string;
  details?: any;
}

const planValues: Record<string, number> = {
  alfa: 4.97,
  prime1: 69.97,
  elite1: 129.97,
  prime: 79.97,
  plus: 99.97,
  elite: 149.97,
};

export default function BasicPaymentPage() {
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan');
  const [paymentData, setPaymentData] = useState<PaymentData>({ status: 'loading' });
  const [copied, setCopied] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [isPaid, setIsPaid] = useState(false);

  useEffect(() => {
    const fetchPayment = async () => {
      try {
        console.log('🔄 Iniciando pagamento para o plano:', plan);
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            // Lógica para lidar com usuário não logado, talvez redirecionar
            console.error("Usuário não logado, não é possível criar pagamento.");
            return;
        }
        const value = plan ? planValues[plan.toLowerCase()] : undefined;
        const response = await fetch('/api/payment/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ planType: plan, value, userId: user.id }),
        });

        const data = await response.json();
        console.log('📡 Resposta da API:', data);

        if (!response.ok) {
          const errorMessage = data.error || data.message || 'Erro ao processar pagamento';
          console.log('❌ Erro na resposta:', errorMessage);
          throw new Error(errorMessage);
        }

        if (data.success) {
          const cobranca = data.cobranca || {};
          setPaymentId(cobranca.custom_id || '');
          setPaymentData({
            status: 'success',
            pix: {
              brCode: cobranca.brCode,
              qrCodeImage: cobranca.qrCodeImage,
              paymentUrl: cobranca.paymentUrl || '',
              pixKey: cobranca.pixKey || '',
            },
            charge: {
              id: cobranca.txid,
              status: cobranca.status,
              value: cobranca.valor,
              correlationID: cobranca.custom_id,
              expiresDate: '',
              expiresIn: 3600,
            },
            ...data
          });
          return;
        } else {
          const errorMessage = data.error || data.message || 'Erro desconhecido';
          console.log('❌ Sucesso falso:', errorMessage);
          throw new Error(errorMessage);
        }
      } catch (error) {
        console.log('❌ Erro no pagamento:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erro ao processar pagamento';
        setPaymentData({
          status: 'error',
          message: errorMessage
        });
      }
    };

    if (plan) {
      fetchPayment();
    }
  }, [plan]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (paymentId && paymentData.status === 'success' && !isPaid) {
      interval = setInterval(async () => {
        const res = await fetch(`/api/payment/get?id=${paymentId}`);
        const data = await res.json();
        if (data && data.pix && data.pix.status === 'CONCLUIDA') {
          setIsPaid(true);
        }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [paymentId, paymentData.status, isPaid]);

  useEffect(() => {
    if (isPaid) {
      // Verificar se é um plano premium
      const premiumPlans = ['elite', 'prime', 'plus'];
      const isPremiumPlan = plan && premiumPlans.includes(plan.toLowerCase());
      
      // Redirecionar com base no tipo do plano
      if (isPremiumPlan) {
        window.location.href = 'https://app.darkcloud.store/';
      } else {
        window.location.href = '/queue';
      }
    }
  }, [isPaid, plan]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.log('Erro ao copiar:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500">Erro</h1>
          <p className="text-gray-300">Plano não especificado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-gray-900/50 backdrop-blur-lg rounded-2xl p-8 border border-gray-700/30"
      >
        <h1 className="text-2xl font-bold text-white mb-4 text-center">
          Pagamento do Plano {plan.charAt(0).toUpperCase() + plan.slice(1)}
        </h1>

        {paymentData.status === 'loading' && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            <p className="mt-4 text-gray-300">Processando pagamento...</p>
          </div>
        )}

        {paymentData.status === 'success' && paymentData.pix && (
          <div className="space-y-6">
            {/* Informações da cobrança */}
            {paymentData.charge && (
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <h3 className="text-lg font-medium text-white mb-2">
                  Detalhes da Cobrança
                </h3>
                <div className="space-y-2 text-sm text-gray-300">
                  <p><strong>Valor:</strong> {formatCurrency(paymentData.charge.value)}</p>
                  <p><strong>Status:</strong> <span className="text-green-500">{paymentData.charge.status}</span></p>
                  <p><strong>Expira em:</strong> {plan.toLowerCase() === 'alfa' ? '1h' : plan.toLowerCase() === 'beta' ? '1 semana' : ''}</p>
                </div>
              </div>
            )}

            {/* QR Code */}
            {paymentData.pix.qrCodeImage && (
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2">
                  <Image src={paymentData.pix.qrCodeImage} alt="QR Code" width={200} height={200} />
                </div>
                <p className="mt-2 text-sm text-gray-400">
                  Escaneie o QR Code para pagar
                </p>
              </div>
            )}

            {/* Link de pagamento */}
            {paymentData.pix.paymentUrl && (
              <div className="space-y-2">
                <p className="text-sm text-gray-300">
                  Ou use o link de pagamento:
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={paymentData.pix.paymentUrl}
                    readOnly
                    className="flex-1 bg-gray-800 text-gray-300 text-xs p-2 rounded border border-gray-600"
                  />
                  <button
                    onClick={() => copyToClipboard(paymentData.pix!.paymentUrl)}
                    className="p-2 bg-blue-600 hover:bg-blue-500 rounded transition-colors"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-white" />
                    ) : (
                      <Copy className="h-4 w-4 text-white" />
                    )}
                  </button>
                </div>
                <a
                  href={paymentData.pix.paymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg transition-colors"
                >
                  Pagar Online
                </a>
              </div>
            )}

            {/* Código PIX */}
            {paymentData.pix.brCode && (
              <div className="space-y-2">
                <p className="text-sm text-gray-300">
                  Código PIX (copie e cole no seu app):
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={paymentData.pix.brCode}
                    readOnly
                    className="flex-1 bg-gray-800 text-gray-300 text-xs p-2 rounded border border-gray-600 font-mono"
                  />
                  <button
                    onClick={() => copyToClipboard(paymentData.pix!.brCode)}
                    className="p-2 bg-blue-600 hover:bg-blue-500 rounded transition-colors"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-white" />
                    ) : (
                      <Copy className="h-4 w-4 text-white" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Instruções */}
            <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
              <h3 className="text-lg font-medium text-white mb-2">
                Instruções:
              </h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Escolha uma das opções de pagamento acima
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Após o pagamento, você receberá um e-mail de confirmação
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Seu plano será ativado automaticamente
                </li>
              </ul>
            </div>

            {/* ID da cobrança */}
            {paymentData.charge?.id && (
              <div className="text-center text-xs text-gray-500">
                ID da cobrança: {paymentData.charge.id}
              </div>
            )}
          </div>
        )}

        {paymentData.status === 'error' && (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-500 mb-2">{paymentData.message}</p>
            {paymentData.details && (
              <details className="text-xs text-gray-400 mt-2">
                <summary className="cursor-pointer">Detalhes do erro</summary>
                <pre className="mt-2 text-left bg-gray-800 p-2 rounded overflow-auto">
                  {JSON.stringify(paymentData.details, null, 2)}
                </pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
} 