'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Check, Copy, ExternalLink, AlertCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface PaymentClientProps {
  searchParams: {
    id?: string;
  };
}

export default function PaymentClient({ searchParams }: PaymentClientProps) {
  const [paymentData, setPaymentData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [copied, setCopied] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchPayment = async () => {
      if (!searchParams.id) {
        setError("Cobrança não encontrada");
        return;
      }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/payment/get?id=${searchParams.id}`);
        const data = await res.json();
        
        if (!res.ok || !data || !data.brCode || !data.qrCodeImage) {
          setError("Cobrança não encontrada");
          return;
        }

        setPaymentData(data);
        
        // Verificar se é um plano premium
        const premiumPlans = ['elite', 'prime', 'plus'];
        const isPremiumPlan = data.planType && premiumPlans.includes(data.planType.toLowerCase());
        
        if (isPremiumPlan) {
          setRedirectUrl('https://app.darkcloud.store/');
        }
      } catch (error) {
        console.error('Erro ao buscar cobrança:', error);
        setError("Erro ao processar pagamento");
      }
    };

    fetchPayment();
  }, [searchParams.id]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (searchParams.id && paymentData && !isPaid) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/payment/get?id=${searchParams.id}`);
          const data = await res.json();
          
          if (data && data.pix && data.pix.status === 'CONCLUIDA') {
            setIsPaid(true);
            
            // Se é um plano premium, redirecionar após alguns segundos
            if (data.isPremiumPlan && data.redirectUrl) {
              setTimeout(() => {
                window.location.href = data.redirectUrl;
              }, 3000);
            }
          }
        } catch (error) {
          console.error('Erro ao verificar pagamento:', error);
        }
      }, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [searchParams.id, paymentData, isPaid]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Erro ao copiar:', error);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Erro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button asChild className="w-full">
              <Link href="/">Voltar para o início</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!paymentData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Carregando...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isPaid) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-green-600 flex items-center gap-2">
              <Check className="h-5 w-5" />
              Pagamento Confirmado!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Seu pagamento foi processado com sucesso!
            </p>
            
            {redirectUrl ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-500">
                  Você será redirecionado automaticamente em alguns segundos...
                </p>
                <Button asChild className="w-full">
                  <a href={redirectUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Acessar Agora
                  </a>
                </Button>
              </div>
            ) : (
              <Button asChild className="w-full">
                <Link href="/queue">Acessar Fila</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-center">Pagamento via Pix</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* QR Code */}
          <div className="flex flex-col items-center">
            <div className="bg-white p-4 rounded-lg border">
              <Image
                src={paymentData.qrCodeImage}
                alt="QR Code Pix"
                width={250}
                height={250}
                sizes="(max-width: 768px) 100vw, 250px"
                className="mx-auto"
              />
            </div>
            <p className="mt-2 text-sm text-gray-600 text-center">
              Escaneie o QR Code para pagar
            </p>
          </div>

          {/* Valor */}
          <div className="text-center">
            <p className="text-sm text-gray-600">Valor a pagar:</p>
            <p className="text-2xl font-bold">
              R$ {(paymentData.price || 0).toFixed(2)}
            </p>
          </div>

          {/* Copiar código Pix */}
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Ou copie o código Pix:</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={paymentData.brCode}
                readOnly
                className="flex-1 bg-gray-50 text-gray-700 text-xs p-2 rounded border border-gray-300"
              />
              <Button
                onClick={() => copyToClipboard(paymentData.brCode)}
                variant="outline"
                size="sm"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Instruções */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Instruções:</h4>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. Abra o app do seu banco</li>
              <li>2. Escolha pagar via Pix</li>
              <li>3. Escaneie o QR Code ou cole o código</li>
              <li>4. Confirme o pagamento</li>
            </ol>
          </div>

          {/* Status do pagamento */}
          <div className="text-center">
            <Badge variant="secondary">
              Aguardando pagamento...
            </Badge>
          </div>

          {/* Voltar */}
          <Button variant="outline" asChild className="w-full">
            <Link href="/">Voltar para o início</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 