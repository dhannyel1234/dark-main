'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Clock, CheckCircle, AlertTriangle, Info, CreditCard } from "lucide-react";

// Importando estilos
import "./styles.css";

export default function RefundPage() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center text-white">
      {/* Seção principal */}
      <section className="relative px-6 mt-36 md:mt-40 w-full">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-3 flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-gray-300 transition-colors duration-300">
            <RefreshCw className="h-4 w-4 animate-pulse" />
            <span className="font-medium tracking-wide">Dark Cloud | Política de Reembolso</span>
          </div>
          <h2 className="mb-4 text-4xl font-bold tracking-wide text-white sm:text-5xl">
            Política de <span className="metallic-text">Reembolso</span>
          </h2>
          <p className="mb-6 text-lg text-gray-400 max-w-2xl mx-auto">
            Entenda nossa política de reembolso e como processamos solicitações de devolução.
          </p>
        </div>
      </section>

      {/* Separador */}
      <section className="relative px-6 pt-10 w-full">
        <div className="text-white p-4 w-full max-w-md mx-auto flex flex-col items-center backdrop-blur-sm">
          <h2 className="text-xl font-medium mb-2 text-white">
            Última atualização: 09/09/2025
          </h2>
          <Separator className="bg-gradient-to-r from-white/50 to-gray-500/50" />
        </div>
      </section>

      {/* Conteúdo da Política de Reembolso */}
      <section className="relative px-6 py-10 w-full">
        <div className="mx-auto max-w-4xl">
          {/* Efeito de estrelas no fundo */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="stars-small"></div>
            <div className="stars-medium"></div>
            <div className="stars-large"></div>
          </div>

          <Card className="metallic-card backdrop-blur-sm mb-8 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-gray-900/10 opacity-30 pointer-events-none"></div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Info className="h-5 w-5 text-gray-400" />
                Introdução
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300">
              <p className="mb-4">
                A Dark Cloud está comprometida em fornecer serviços de qualidade e satisfação do cliente. Esta Política de Reembolso descreve as condições e procedimentos para solicitação de reembolsos em nossos serviços.
              </p>
              <p>
                Entendemos que às vezes as circunstâncias podem mudar, e queremos garantir que você tenha uma experiência positiva conosco, mesmo quando precisar solicitar um reembolso.
              </p>
            </CardContent>
          </Card>

          <Card className="metallic-card backdrop-blur-sm mb-8 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-gray-900/10 opacity-30 pointer-events-none"></div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <CheckCircle className="h-5 w-5 text-gray-400" />
                Direito de Arrependimento
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300">
              <p className="mb-4">
                <strong className="text-white">Período de 7 dias:</strong> Nos termos do Código de Defesa do Consumidor (art. 49), o cliente pode solicitar cancelamento em até <strong className="text-white">7 dias após a contratação</strong>, desde que a máquina <strong className="text-white">não tenha sido ativada ou utilizada</strong>.
              </p>
              <p className="mb-4">
                <strong className="text-white">Importante:</strong> Após a ativação, o valor pago <strong className="text-white">não será reembolsado</strong>, por se tratar de recurso de consumo imediato em nuvem.
              </p>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mt-4">
                <p className="text-blue-200 text-sm">
                  <strong>⚠️ Atenção:</strong> O direito de arrependimento só se aplica se a máquina virtual não foi ativada ou utilizada. Uma vez ativada, considera-se que o serviço foi consumido.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="metallic-card backdrop-blur-sm mb-8 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-gray-900/10 opacity-30 pointer-events-none"></div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <CheckCircle className="h-5 w-5 text-green-400" />
                Casos de Reembolso Aceitos
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300">
              <p className="mb-4">
                Reembolsos (totais ou parciais) só serão concedidos nos seguintes casos:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li><strong className="text-white">Cobrança duplicada ou incorreta</strong>;</li>
                <li><strong className="text-white">Falhas técnicas diretamente em nossa plataforma</strong> que impeçam o uso do serviço e não sejam solucionadas.</li>
              </ul>
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mt-4">
                <p className="text-green-200 text-sm">
                  <strong>✅ Importante:</strong> Estes são os únicos casos em que reembolsos são garantidos. Outras situações serão avaliadas individualmente.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="metallic-card backdrop-blur-sm mb-8 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-gray-900/10 opacity-30 pointer-events-none"></div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                Casos Sem Direito a Reembolso
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300">
              <p className="mb-4">
                Não haverá reembolso nas seguintes situações:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Uso parcial ou total da máquina virtual;</li>
                <li>Problemas ocasionados por <strong className="text-white">fatores externos</strong>, incluindo manutenções ou falhas da Microsoft Azure ou de outros fornecedores de infraestrutura;</li>
                <li>Suspensão por <strong className="text-white">uso abusivo, excessivo ou ilegal</strong> (mineração, ataques, atividades proibidas).</li>
              </ul>
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mt-4">
                <p className="text-red-200 text-sm">
                  <strong>❌ Importante:</strong> Problemas com fornecedores externos (como Azure) não são de nossa responsabilidade e não geram direito a reembolso.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="metallic-card backdrop-blur-sm mb-8 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-gray-900/10 opacity-30 pointer-events-none"></div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <CreditCard className="h-5 w-5 text-gray-400" />
                Processo de Solicitação
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300">
              <p className="mb-4">
                <strong className="text-white">1. Como Solicitar:</strong> Para solicitar um reembolso, entre em contato conosco através de:
              </p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>Email: equipedark8@gmail.com</li>
                  <li>Discord: <a href="https://discord.com/invite/K8wraT7Jx2" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors duration-300">https://discord.com/invite/K8wraT7Jx2</a></li>
                  <li>Através do painel de suporte em nossa plataforma</li>
                </ul>
              <p className="mb-4">
                <strong className="text-white">2. Informações Necessárias:</strong> Ao solicitar um reembolso, forneça:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Número da transação ou ID da cobrança;</li>
                <li>Email associado à conta;</li>
                <li>Motivo da solicitação de reembolso;</li>
                <li>Data da compra e do cancelamento (se aplicável).</li>
              </ul>
              <p>
                <strong className="text-white">3. Tempo de Resposta:</strong> Responderemos à sua solicitação em até 48 horas úteis.
              </p>
            </CardContent>
          </Card>

          <Card className="metallic-card backdrop-blur-sm mb-8 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-gray-900/10 opacity-30 pointer-events-none"></div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Clock className="h-5 w-5 text-gray-400" />
                Processamento e Prazos
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300">
              <p className="mb-4">
                <strong className="text-white">1. Aprovação:</strong> Uma vez aprovado, o reembolso será processado imediatamente.
              </p>
              <p className="mb-4">
                <strong className="text-white">2. Tempo de Processamento:</strong> O tempo para o reembolso aparecer em sua conta depende do método de pagamento:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Cartão de crédito: 5-10 dias úteis</li>
                <li>PIX: 1-3 dias úteis</li>
                <li>Boleto bancário: 10-15 dias úteis</li>
                <li>Carteira digital: 3-7 dias úteis</li>
              </ul>
              <p>
                <strong className="text-white">3. Notificação:</strong> Você receberá uma confirmação por email assim que o reembolso for processado.
              </p>
            </CardContent>
          </Card>

          <Card className="metallic-card backdrop-blur-sm mb-8 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-gray-900/10 opacity-30 pointer-events-none"></div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <RefreshCw className="h-5 w-5 text-blue-400" />
                Compensação Alternativa
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300">
              <p className="mb-4">
                Em situações excepcionais de indisponibilidade ou instabilidade do serviço (incluindo manutenções programadas da Azure), poderemos, <strong className="text-white">a nosso critério</strong>, oferecer <strong className="text-white">créditos ou tempo adicional de uso</strong> em substituição ao reembolso financeiro.
              </p>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mt-4">
                <p className="text-blue-200 text-sm">
                  <strong>💡 Importante:</strong> Esta é uma alternativa ao reembolso financeiro e será oferecida apenas em casos excepcionais, a critério da Dark Cloud.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="metallic-card backdrop-blur-sm mb-8 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-gray-900/10 opacity-30 pointer-events-none"></div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Info className="h-5 w-5 text-gray-400" />
                Disposições Gerais
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300">
              <p className="mb-4">
                <strong className="text-white">1. Modificações:</strong> Reservamo-nos o direito de modificar esta Política de Reembolso a qualquer momento. As modificações entrarão em vigor após a publicação da política atualizada em nosso site.
              </p>
              <p className="mb-4">
                <strong className="text-white">2. Casos Especiais:</strong> Casos especiais serão avaliados individualmente pela nossa equipe de suporte, considerando as circunstâncias específicas.
              </p>
              <p className="mb-4">
                <strong className="text-white">3. Lei Aplicável:</strong> Esta política será regida pelas leis do Brasil e está sujeita à jurisdição dos tribunais brasileiros.
              </p>
              <p>
                <strong className="text-white">4. Contato:</strong> Para dúvidas sobre esta política ou para solicitar um reembolso, entre em contato conosco através do email: equipedark8@gmail.com
              </p>
            </CardContent>
          </Card>

          <div className="text-center mt-12 mb-8">
            <p className="text-gray-400 mb-6">
              Se você tiver dúvidas sobre nossa Política de Reembolso ou precisar solicitar um reembolso, entre em contato conosco.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/terms">
                <Button variant="outline" className="metallic-button">
                  Termos de Serviço
                </Button>
              </Link>
              <Link href="/privacy">
                <Button variant="outline" className="metallic-button">
                  Política de Privacidade
                </Button>
              </Link>
              <Link href="/">
                <Button className="metallic-button metallic-glow">
                  Voltar para Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Elemento flutuante decorativo */}
      <div className="fixed bottom-10 right-10 w-24 h-24 opacity-20 pointer-events-none animate-float">
        <div className="w-full h-full rounded-full bg-gradient-to-tr from-white to-gray-500 blur-xl"></div>
      </div>
    </div>
  );
}
