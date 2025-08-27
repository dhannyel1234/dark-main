'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Eye, Info, Database, AlertTriangle } from "lucide-react";

// Importando estilos
import "./styles.css";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center text-white">
      {/* Seção principal */}
      <section className="relative px-6 mt-36 md:mt-40 w-full">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-3 flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-gray-300 transition-colors duration-300">
            <Lock className="h-4 w-4 animate-pulse" />
            <span className="font-medium tracking-wide">Dark Cloud | Política de Privacidade</span>
          </div>
          <h2 className="mb-4 text-4xl font-bold tracking-wide text-white sm:text-5xl">
            Política de <span className="metallic-text">Privacidade</span>
          </h2>
          <p className="mb-6 text-lg text-gray-400 max-w-2xl mx-auto">
            Saiba como coletamos, usamos e protegemos suas informações pessoais na Dark Cloud.
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

      {/* Conteúdo da Política de Privacidade */}
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
                A Dark Cloud ("nós", "nosso" ou "nossa") está comprometida em proteger sua privacidade. Esta Política de Privacidade explica como coletamos, usamos, divulgamos e protegemos suas informações pessoais quando você utiliza nossos serviços, aplicativos e website ("Serviços").
              </p>
              <p>
                Ao acessar ou utilizar nossos Serviços, você concorda com a coleta e uso de informações de acordo com esta política. Se você não concordar com esta política, por favor, não utilize nossos Serviços.
              </p>
            </CardContent>
          </Card>

          <Card className="metallic-card backdrop-blur-sm mb-8 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-gray-900/10 opacity-30 pointer-events-none"></div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Database className="h-5 w-5 text-gray-400" />
                Informações que Coletamos
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300">
              <p className="mb-4">
                <strong className="text-white">1. Informações Pessoais:</strong> Podemos coletar informações pessoais que você nos fornece diretamente, como nome, endereço de e-mail, número de telefone, endereço de cobrança e informações de pagamento quando você se registra em nossa plataforma, cria uma conta ou adquire nossos serviços.
              </p>
              <p className="mb-4">
                <strong className="text-white">2. Informações de Uso:</strong> Coletamos informações sobre como você interage com nossos Serviços, incluindo:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Dados de acesso e logs, como endereço IP, tipo de navegador, páginas visitadas e tempo gasto;</li>
                <li>Informações sobre o dispositivo, como tipo de dispositivo, sistema operacional e identificadores únicos;</li>
                <li>Dados de desempenho e uso das máquinas virtuais;</li>
                <li>Informações sobre suas preferências e configurações.</li>
              </ul>
              <p>
                <strong className="text-white">3. Cookies e Tecnologias Semelhantes:</strong> Utilizamos cookies e tecnologias semelhantes para coletar informações sobre sua atividade, navegador e dispositivo. Você pode gerenciar suas preferências de cookies através das configurações do seu navegador.
              </p>
            </CardContent>
          </Card>

          <Card className="metallic-card backdrop-blur-sm mb-8 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-gray-900/10 opacity-30 pointer-events-none"></div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Eye className="h-5 w-5 text-gray-400" />
                Como Usamos Suas Informações
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300">
              <p className="mb-4">
                Utilizamos as informações coletadas para:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Fornecer, manter e melhorar nossos Serviços;</li>
                <li>Processar transações e enviar notificações relacionadas à sua conta e serviços;</li>
                <li>Personalizar sua experiência e fornecer conteúdo e ofertas relevantes;</li>
                <li>Monitorar e analisar tendências, uso e atividades relacionadas aos nossos Serviços;</li>
                <li>Detectar, prevenir e resolver problemas técnicos, fraudes e atividades ilegais;</li>
                <li>Cumprir obrigações legais e regulatórias.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="metallic-card backdrop-blur-sm mb-8 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-gray-900/10 opacity-30 pointer-events-none"></div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Shield className="h-5 w-5 text-gray-400" />
                Compartilhamento de Informações
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300">
              <p className="mb-4">
                Podemos compartilhar suas informações pessoais nas seguintes circunstâncias:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li><strong className="text-white">Provedores de Serviços:</strong> Compartilhamos informações com terceiros que nos auxiliam na operação de nossos Serviços, como processadores de pagamento, serviços de hospedagem e suporte ao cliente;</li>
                <li><strong className="text-white">Parceiros de Negócios:</strong> Podemos compartilhar informações com parceiros de negócios para oferecer produtos ou serviços conjuntos;</li>
                <li><strong className="text-white">Conformidade Legal:</strong> Podemos divulgar informações quando acreditamos, de boa fé, que a divulgação é necessária para cumprir uma obrigação legal, proteger nossos direitos, sua segurança ou a de outros;</li>
                <li><strong className="text-white">Transações Corporativas:</strong> Em caso de fusão, aquisição ou venda de ativos, suas informações podem ser transferidas como parte dessa transação.</li>
              </ul>
              <p>
                Não vendemos suas informações pessoais a terceiros para fins de marketing.
              </p>
            </CardContent>
          </Card>

          <Card className="metallic-card backdrop-blur-sm mb-8 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-gray-900/10 opacity-30 pointer-events-none"></div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Lock className="h-5 w-5 text-gray-400" />
                Segurança de Dados
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300">
              <p className="mb-4">
                A segurança de suas informações é importante para nós. Implementamos medidas técnicas, administrativas e físicas projetadas para proteger suas informações pessoais contra acesso não autorizado, divulgação, alteração e destruição.
              </p>
              <p className="mb-4">
                No entanto, nenhum método de transmissão pela Internet ou método de armazenamento eletrônico é 100% seguro. Portanto, não podemos garantir sua segurança absoluta.
              </p>
              <p>
                Você é responsável por manter a confidencialidade de suas credenciais de conta e por restringir o acesso ao seu dispositivo.
              </p>
            </CardContent>
          </Card>

          <Card className="metallic-card backdrop-blur-sm mb-8 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-gray-900/10 opacity-30 pointer-events-none"></div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <AlertTriangle className="h-5 w-5 text-gray-400" />
                Seus Direitos e Escolhas
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300">
              <p className="mb-4">
                Dependendo da sua localização, você pode ter certos direitos em relação às suas informações pessoais, incluindo:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Acessar, corrigir ou excluir suas informações pessoais;</li>
                <li>Restringir ou opor-se ao processamento de suas informações;</li>
                <li>Solicitar a portabilidade de seus dados;</li>
                <li>Retirar seu consentimento a qualquer momento (quando o processamento for baseado no consentimento).</li>
              </ul>
              <p>
                Para exercer esses direitos, entre em contato conosco através do email: privacidade@darkcloud.store
              </p>
            </CardContent>
          </Card>

          <Card className="metallic-card backdrop-blur-sm mb-8 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-gray-900/10 opacity-30 pointer-events-none"></div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Info className="h-5 w-5 text-gray-400" />
                Alterações nesta Política
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300">
              <p className="mb-4">
                Podemos atualizar esta Política de Privacidade periodicamente para refletir mudanças em nossas práticas ou por outros motivos operacionais, legais ou regulatórios.
              </p>
              <p>
                Notificaremos você sobre quaisquer alterações materiais publicando a nova Política de Privacidade em nosso site e, quando apropriado, enviando um aviso para o endereço de e-mail associado à sua conta.
              </p>
            </CardContent>
          </Card>

          <div className="text-center mt-12 mb-8">
            <p className="text-gray-400 mb-6">
              Se você tiver dúvidas sobre esta Política de Privacidade, entre em contato conosco através do email: privacidade@darkcloud.store
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/terms">
                <Button variant="outline" className="metallic-button">
                  Termos de Serviço
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
      <div className="fixed bottom-10 left-10 w-24 h-24 opacity-20 pointer-events-none animate-float">
        <div className="w-full h-full rounded-full bg-gradient-to-tr from-white to-gray-500 blur-xl"></div>
      </div>
    </div>
  );
}