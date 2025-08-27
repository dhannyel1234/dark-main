'use client';

import { createClient } from "@/utils/supabase/client";
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from "react";
import Link from 'next/link';
import { toast } from "sonner";
import Image from "next/image";
import { validateCPF, validateEmail } from '@/utils/validators';
import PlanCard from '@/components/plans/PlanCard';

import { CheckCircle, XCircle } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

import "./styles.css";

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

interface Cobranca {
    brCode: string;
    qrCodeImage: string;
}

interface Gateway {
    name: string;
    provider: string;
    confirmation_type: 'webhook' | 'polling';
    polling_interval_seconds: number | null;
}

type CustomerFormData = {
    customerName: string;
    customerDocument: string;
    customerBirthDate: string;
    customerPhone: string;
    customerEmail: string;
    termsAccepted: boolean;
};

type FormErrors = {
    [K in keyof CustomerFormData]?: string;
};


function OrderPageComponent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Estados do fluxo
    const [isLoading, setLoading] = useState(true);
    const [paymentsEnabled, setPaymentsEnabled] = useState(true);
    const [step, setStep] = useState<'selection' | 'form' | 'gateway-selection' | 'payment'>('selection');
    const [paymentId, setPaymentId] = useState<string | null>(null);
    const [cobranca, setCobranca] = useState<Cobranca | null>(null);

    // Estados dos dados
    const [activeGateways, setActiveGateways] = useState<Gateway[]>([]);
    const [allPlans, setAllPlans] = useState<Plan[]>([]);
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
    const [selectedGateway, setSelectedGateway] = useState<Gateway | null>(null);

    // Estados do formulário
    const [customerForm, setCustomerForm] = useState<CustomerFormData>({
        customerName: '',
        customerDocument: '',
        customerBirthDate: '',
        customerPhone: '',
        customerEmail: '',
        termsAccepted: false,
    });
    const [documentType, setDocumentType] = useState<'cpf' | 'cnpj'>('cpf');
    const [formErrors, setFormErrors] = useState<FormErrors>({});

    // Estados de UI
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        const initialFetch = async () => {
            setLoading(true);
            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    // Detectar URL de produção corretamente
                    const isProduction = location.hostname === 'darkcloud.store';
                    const redirectUrl = isProduction 
                        ? 'https://darkcloud.store/order'
                        : `${location.origin}/order`;
                    return supabase.auth.signInWithOAuth({ provider: 'discord', options: { redirectTo: redirectUrl } });
                }
                setCustomerForm(prev => ({ ...prev, customerEmail: user.email || '' }));

                const [plansRes, statusRes] = await Promise.all([
                    fetch('/api/plans'),
                    fetch('/api/settings/payment-status')
                ]);

                const statusData = await statusRes.json();
                setPaymentsEnabled(statusData.enabled);

                if (plansRes.ok) {
                    const plansData = await plansRes.json();
                    setAllPlans(Array.isArray(plansData) ? plansData : []);

                    const planIdFromUrl = searchParams.get('planId');
                    if (planIdFromUrl && plansData.some((p: Plan) => p.id === planIdFromUrl)) {
                        setSelectedPlanId(planIdFromUrl);
                    } else if (plansData.length > 0) {
                        setSelectedPlanId(plansData[0].id);
                    }
                } else {
                    // Se a API de planos falhar, define como um array vazio para evitar o crash
                    setAllPlans([]);
                    console.error("Falha ao buscar planos:", await plansRes.text());
                    toast.error("Não foi possível carregar os planos disponíveis.");
                }

            } catch (error) {
                setErrorMessage("Erro ao carregar dados da página. Tente novamente.");
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        initialFetch();
    }, [searchParams]);

    const selectedPlan = allPlans.find(p => p.id === selectedPlanId);

    const handlePlanSelection = async () => {
        if (!selectedPlan) {
            toast.error("Selecione um plano para continuar.");
            return;
        }
        setIsProcessing(true);
        try {
            const response = await fetch('/api/payment/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    planId: selectedPlan.id,
                    finalPrice: selectedPlan.price,
                }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Falha ao iniciar o pagamento.');

            setPaymentId(data.paymentId);
            setStep('form');
        } catch (error) {
            toast.error("Erro", { description: (error as Error).message });
        } finally {
            setIsProcessing(false);
        }
    };

    const validateForm = () => {
        const errors: FormErrors = {};
        if (!customerForm.customerName.trim()) errors.customerName = "Nome é obrigatório.";
        
        const doc = customerForm.customerDocument.replace(/\D/g, '');
        if (!doc) {
            errors.customerDocument = "Documento é obrigatório.";
        } else if (documentType === 'cpf') {
            if (!validateCPF(doc)) {
                errors.customerDocument = "CPF inválido.";
            }
        } else if (documentType === 'cnpj') {
            if (doc.length !== 14) {
                errors.customerDocument = "CNPJ deve ter 14 dígitos.";
            }
        }

        if (!customerForm.customerEmail.trim()) {
            errors.customerEmail = "E-mail é obrigatório.";
        } else if (!validateEmail(customerForm.customerEmail)) {
            errors.customerEmail = "Formato de e-mail inválido.";
        }

        if (!customerForm.termsAccepted) errors.termsAccepted = "Você deve aceitar os termos.";
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsProcessing(true);
        try {
            const response = await fetch('/api/gateways');
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Não foi possível carregar os métodos de pagamento.');
            
            setActiveGateways(data);
            setStep('gateway-selection');
        } catch (error) {
            toast.error("Erro", { description: (error as Error).message });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleConfirmPayment = async (gatewayProvider: string) => {
        const gateway = activeGateways.find(g => g.provider === gatewayProvider);
        if (!gateway) return;
        
        setSelectedGateway(gateway);
        setIsProcessing(true);
        try {
            const response = await fetch('/api/payment/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentId, ...customerForm, selectedGateway: gatewayProvider }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Falha ao confirmar pagamento.');

            setCobranca(data.cobranca);
            setStep('payment');
        } catch (error) {
            toast.error("Erro", { description: (error as Error).message });
        } finally {
            setIsProcessing(false);
        }
    };

    // Efeito para iniciar o polling
    useEffect(() => {
        if (step !== 'payment' || !paymentId || !selectedGateway) return;

        if (selectedGateway.confirmation_type !== 'polling') return;

        const interval = setInterval(async () => {
            try {
                const response = await fetch(`/api/payment/status?paymentId=${paymentId}`);
                const data = await response.json();
                if (data.status === 'paid') {
                    clearInterval(interval);
                    toast.success("Pagamento confirmado!", { description: "Seu plano foi ativado." });
                    router.push('/dashboard'); // Redireciona para o dashboard
                }
            } catch (error) {
                console.error("Erro no polling:", error);
            }
        }, (selectedGateway.polling_interval_seconds || 30) * 1000);

        return () => clearInterval(interval);
    }, [step, paymentId, selectedGateway, router]);

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen"><p>Carregando...</p></div>;
    }

    if (!paymentsEnabled) {
        return (
            <AlertDialog open={true}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Pagamentos Indisponíveis</AlertDialogTitle>
                        <AlertDialogDescription>
                            No momento, as compras no site estão desabilitadas. Por favor, entre em contato com o suporte para mais informações.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Link href="/" className="text-center"><Button variant="outline">Voltar para a página inicial</Button></Link>
                </AlertDialogContent>
            </AlertDialog>
        );
    }

    return (
        <div className="min-h-screen">
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-6xl mx-auto fade-in">
                {step === 'selection' && (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h1 className="text-3xl font-bold mb-2">Selecione seu Plano</h1>
                            <p className="text-muted-foreground">Escolha o plano ideal para suas necessidades</p>
                        </div>
                        
                        <div className="plan-grid gap-4 grid">
                            {allPlans.map(plan => (
                                <PlanCard
                                    key={plan.id}
                                    plan={plan}
                                    isSelected={selectedPlanId === plan.id}
                                    onSelect={setSelectedPlanId}
                                />
                            ))}
                        </div>
                        
                        <div className="flex justify-center">
                            <Button 
                                onClick={handlePlanSelection} 
                                disabled={isProcessing || !selectedPlanId} 
                                size="lg"
                            >
                                {isProcessing ? "Processando..." : "Continuar"}
                            </Button>
                        </div>
                    </div>
                )}

                {step === 'form' && selectedPlan && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-center text-xl">Informações de Cobrança</CardTitle>
                            <p className="text-center text-muted-foreground">Plano: {selectedPlan.name} - R$ {Number(selectedPlan.price).toFixed(2)}</p>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleFormSubmit} className="space-y-4">
                                <Input placeholder="Nome Completo" value={customerForm.customerName} onChange={e => setCustomerForm({...customerForm, customerName: e.target.value})} />
                                {formErrors.customerName && <p className="text-red-500 text-xs">{formErrors.customerName}</p>}
                                <RadioGroup defaultValue="cpf" onValueChange={(value: 'cpf' | 'cnpj') => setDocumentType(value)} className="flex space-x-4 mb-2">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="cpf" id="cpf" />
                                        <Label htmlFor="cpf">CPF</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="cnpj" id="cnpj" />
                                        <Label htmlFor="cnpj">CNPJ</Label>
                                    </div>
                                </RadioGroup>
                                <Input
                                    placeholder={documentType === 'cpf' ? 'Digite seu CPF' : 'Digite seu CNPJ'}
                                    value={customerForm.customerDocument}
                                    onChange={e => setCustomerForm({...customerForm, customerDocument: e.target.value})}
                                    maxLength={documentType === 'cpf' ? 14 : 18}
                                />
                                {formErrors.customerDocument && <p className="text-red-500 text-xs">{formErrors.customerDocument}</p>}
                                <Input type="date" placeholder="Data de Nascimento" value={customerForm.customerBirthDate} onChange={e => setCustomerForm({...customerForm, customerBirthDate: e.target.value})} />
                                <Input placeholder="Telefone (Opcional)" value={customerForm.customerPhone} onChange={e => setCustomerForm({...customerForm, customerPhone: e.target.value})} />
                                <Input placeholder="E-mail de cobrança" type="email" value={customerForm.customerEmail} onChange={e => setCustomerForm({...customerForm, customerEmail: e.target.value})} />
                                {formErrors.customerEmail && <p className="text-red-500 text-xs">{formErrors.customerEmail}</p>}
                                
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="terms" checked={customerForm.termsAccepted} onCheckedChange={checked => setCustomerForm({...customerForm, termsAccepted: !!checked})} />
                                    <label htmlFor="terms" className="text-sm text-muted-foreground">Eu li e aceito os <Link href="/terms" className="underline">termos de serviço</Link>.</label>
                                </div>
                                {formErrors.termsAccepted && <p className="text-red-500 text-xs">{formErrors.termsAccepted}</p>}

                                <Button type="submit" disabled={isProcessing} className="w-full">
                                    {isProcessing ? "Gerando Pagamento..." : "Ir para Pagamento"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {step === 'gateway-selection' && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-center text-xl">Selecione o Método de Pagamento</CardTitle>
                            <p className="text-center text-muted-foreground">Escolha por onde você prefere pagar.</p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {activeGateways.length > 0 ? (
                                activeGateways.map(gateway => (
                                    <Button key={gateway.provider} onClick={() => handleConfirmPayment(gateway.provider)} disabled={isProcessing} className="w-full">
                                        {isProcessing ? "Aguarde..." : `Pagar com ${gateway.name}`}
                                    </Button>
                                ))
                            ) : (
                                <p>Nenhum método de pagamento disponível no momento.</p>
                            )}
                        </CardContent>
                    </Card>
                )}

                {step === 'payment' && cobranca && (
                     <Card className="text-center">
                        <CardHeader>
                            <CardTitle className="text-2xl">Pagamento PIX</CardTitle>
                            <p className="text-muted-foreground">Escaneie o QR Code ou copie o código para pagar.</p>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center space-y-4">
                            <Image src={cobranca.qrCodeImage} alt="QR Code PIX" width={256} height={256} className="border rounded-lg" />
                            <div className="w-full">
                                <Input readOnly value={cobranca.brCode} className="text-center" />
                                <Button onClick={() => { navigator.clipboard.writeText(cobranca.brCode); toast.success("Código PIX copiado!"); }} className="w-full mt-2">
                                    Copiar Código
                                </Button>
                            </div>
                            <p className="text-sm text-primary animate-pulse">Aguardando confirmação de pagamento...</p>
                            <p className="text-xs text-muted-foreground">Você pode fechar esta página. A ativação será automática.</p>
                        </CardContent>
                    </Card>
                )}
                </div>
            </div>
        </div>
    );
}

export default function Order() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <OrderPageComponent />
        </Suspense>
    );
}