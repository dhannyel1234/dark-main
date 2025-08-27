'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollText, Shield, CheckCircle, AlertTriangle, Info } from "lucide-react";

// Importando estilos
import "./styles.css";

export default function TermsPage() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center text-white">
      {/* Seção principal */}
      <section className="relative px-6 mt-36 md:mt-40 w-full">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-3 flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-gray-300 transition-colors duration-300">
            <ScrollText className="h-4 w-4 animate-pulse" />
            <span className="font-medium tracking-wide">Dark | Termos de Serviço</span>
          </div>
          <h2 className="mb-4 text-4xl font-bold tracking-wide text-white sm:text-5xl">
            Termos de <span className="metallic-text">Serviço</span>
          </h2>
          <p className="mb-6 text-lg text-gray-400 max-w-2xl mx-auto">
            Leia atentamente os termos e condições que regem o uso dos serviços da Dark Cloud.
          </p>
        </div>
      </section>

      {/* Separador */}
      <section className="relative px-6 pt-10 w-full">
        <div className="text-white p-4 w-full max-w-md mx-auto flex flex-col items-center backdrop-blur-sm">
          <h2 className="text-xl font-medium mb-2 text-white">
            Última atualização: 01/06/2024
          </h2>
          <Separator className="bg-gradient-to-r from-white/50 to-gray-500/50" />
        </div>
      </section>

      {/* Conteúdo dos Termos */}
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
                Bem-vindo à Dark Cloud. Estes Termos de Serviço ("Termos") regem seu acesso e uso dos serviços, aplicativos e produtos da Dark Cloud ("Serviços").
              </p>
              <p>
                Ao acessar ou utilizar nossos Serviços, você concorda com estes Termos. Se você não concordar com estes Termos, não poderá acessar ou utilizar nossos Serviços.
              </p>
            </CardContent>
          </Card>

          <Card className="metallic-card backdrop-blur-sm mb-8 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-gray-900/10 opacity-30 pointer-events-none"></div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <CheckCircle className="h-5 w-5 text-gray-400" />
                Uso dos Serviços
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300">
              <p className="mb-4">
                <strong className="text-white">1. Conta de Usuário:</strong> Para utilizar alguns de nossos Serviços, você precisará criar uma conta. Você é responsável por manter a confidencialidade de suas credenciais de login e por todas as atividades que ocorrerem em sua conta.
              </p>
              <p className="mb-4">
                <strong className="text-white">2. Uso Aceitável:</strong> Você concorda em usar nossos Serviços apenas para fins legais e de acordo com estes Termos. Você não deve usar nossos Serviços para qualquer atividade ilegal ou não autorizada.
              </p>
              <p className="mb-4">
                <strong className="text-white">3. Restrições:</strong> Você não deve:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Violar quaisquer leis aplicáveis ou regulamentos;</li>
                <li>Infringir os direitos de propriedade intelectual ou outros direitos de terceiros;</li>
                <li>Tentar acessar, interferir ou danificar qualquer aspecto dos Serviços ou sistemas relacionados;</li>
                <li>Usar os Serviços para distribuir malware, spyware ou outro código malicioso;</li>
                <li>Realizar atividades que possam sobrecarregar nossa infraestrutura.</li>
              </ul>
              <p>
                <strong className="text-white">4. Recursos Computacionais:</strong> Nossos Serviços fornecem acesso a recursos computacionais na nuvem. Você concorda em usar esses recursos de maneira responsável e de acordo com nossas políticas de uso justo.
              </p>
            </CardContent>
          </Card>

          <Card className="metallic-card backdrop-blur-sm mb-8 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-gray-900/10 opacity-30 pointer-events-none"></div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Shield className="h-5 w-5 text-gray-400" />
                Pagamentos e Assinaturas
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300">
              <p className="mb-4">
                <strong className="text-white">1. Planos e Preços:</strong> Detalhes sobre nossos planos e preços estão disponíveis em nosso site. Reservamo-nos o direito de alterar nossos preços mediante aviso prévio.
              </p>
              <p className="mb-4">
                <strong className="text-white">2. Faturamento:</strong> Para serviços pagos, você concorda em pagar todas as taxas aplicáveis. O faturamento ocorrerá de acordo com o ciclo de faturamento do plano escolhido.
              </p>
              <p className="mb-4">
                <strong className="text-white">3. Cancelamentos e Reembolsos:</strong> Você pode cancelar sua assinatura a qualquer momento. Os reembolsos serão processados de acordo com nossa política de reembolso.
              </p>
              <p>
                <strong className="text-white">4. Impostos:</strong> Os preços exibidos podem não incluir impostos aplicáveis. Você é responsável por pagar todos os impostos associados ao uso de nossos Serviços.
              </p>
            </CardContent>
          </Card>

          <Card className="metallic-card backdrop-blur-sm mb-8 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-gray-900/10 opacity-30 pointer-events-none"></div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <AlertTriangle className="h-5 w-5 text-gray-400" />
                Limitação de Responsabilidade
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300">
              <p className="mb-4">
                <strong className="text-white">1. Serviços "Como Estão":</strong> Nossos Serviços são fornecidos "como estão" e "conforme disponíveis", sem garantias de qualquer tipo, expressas ou implícitas.
              </p>
              <p className="mb-4">
                <strong className="text-white">2. Disponibilidade:</strong> Embora nos esforcemos para manter nossos Serviços disponíveis 24/7, não podemos garantir que os Serviços estarão sempre disponíveis, ininterruptos ou livres de erros.
              </p>
              <p className="mb-4">
                <strong className="text-white">3. Limitação de Danos:</strong> Em nenhuma circunstância a Dark Cloud será responsável por quaisquer danos indiretos, incidentais, especiais, punitivos ou consequentes.
              </p>
              <p>
                <strong className="text-white">4. Valor Máximo:</strong> Nossa responsabilidade total para com você por quaisquer danos não excederá o valor pago por você à Dark Cloud pelos Serviços nos últimos três meses.
              </p>
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
                <strong className="text-white">1. Modificações:</strong> Reservamo-nos o direito de modificar estes Termos a qualquer momento. As modificações entrarão em vigor após a publicação dos Termos atualizados em nosso site.
              </p>
              <p className="mb-4">
                <strong className="text-white">2. Rescisão:</strong> Podemos rescindir ou suspender seu acesso aos Serviços imediatamente, sem aviso prévio ou responsabilidade, por qualquer motivo, incluindo, sem limitação, se você violar estes Termos.
              </p>
              <p className="mb-4">
                <strong className="text-white">3. Lei Aplicável:</strong> Estes Termos serão regidos e interpretados de acordo com as leis do Brasil, sem considerar suas disposições sobre conflitos de leis.
              </p>
              <p>
                <strong className="text-white">4. Contato:</strong> Se você tiver alguma dúvida sobre estes Termos, entre em contato conosco através do email: suporte@darkcloud.store
              </p>
            </CardContent>
          </Card>

          <div className="text-center mt-12 mb-8">
            <p className="text-gray-400 mb-6">
              Ao utilizar nossos serviços, você concorda com estes Termos de Serviço e nossa Política de Privacidade.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
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