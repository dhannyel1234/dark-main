'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cookie, Info, Shield, Settings, Clock, AlertTriangle } from "lucide-react";

// Importando estilos locais
import "./styles.css";

export default function CookiesPolicyPage() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center text-white">
      {/* Seção principal */}
      <section className="relative px-6 mt-36 md:mt-40 w-full">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-3 flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-gray-300 transition-colors duration-300">
            <Cookie className="h-4 w-4 animate-pulse" />
            <span className="font-medium tracking-wide">Dark Cloud | Política de Cookies</span>
          </div>
          <h2 className="mb-4 text-4xl font-bold tracking-wide text-white sm:text-5xl">
            Política de <span className="metallic-text">Cookies</span>
          </h2>
          <p className="mb-6 text-lg text-gray-400 max-w-2xl mx-auto">
            Saiba como utilizamos cookies e tecnologias semelhantes para melhorar sua experiência.
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

      {/* Conteúdo */}
      <section className="relative px-6 py-10 w-full">
        <div className="mx-auto max-w-4xl">
          {/* Efeito de estrelas no fundo */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="stars-small"></div>
            <div className="stars-medium"></div>
            <div className="stars-large"></div>
          </div>

          {/* Introdução */}
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
                Esta Política de Cookies explica o que são cookies, como os utilizamos em nossa plataforma, os tipos de cookies que usamos, como você pode gerenciar suas preferências e informações adicionais sobre privacidade.
              </p>
              <p>
                Ao continuar navegando em nossa plataforma, você concorda com o uso de cookies conforme descrito nesta política.
              </p>
            </CardContent>
          </Card>

          {/* O que são cookies */}
          <Card className="metallic-card backdrop-blur-sm mb-8 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-gray-900/10 opacity-30 pointer-events-none"></div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Cookie className="h-5 w-5 text-gray-400" />
                O que são Cookies?
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300">
              <p className="mb-4">
                Cookies são pequenos arquivos de texto armazenados no seu dispositivo quando você visita um website. Eles ajudam a lembrar suas preferências, aprimorar sua experiência e possibilitar certas funcionalidades.
              </p>
              <p>
                Utilizamos também tecnologias semelhantes, como pixels e armazenamento local do navegador, para fins semelhantes aos dos cookies.
              </p>
            </CardContent>
          </Card>

          {/* Tipos de cookies que usamos */}
          <Card className="metallic-card backdrop-blur-sm mb-8 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-gray-900/10 opacity-30 pointer-events-none"></div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Shield className="h-5 w-5 text-gray-400" />
                Tipos de Cookies que Utilizamos
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300">
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li><strong className="text-white">Cookies Essenciais:</strong> Necessários para o funcionamento do site e para que você possa navegar e usar recursos básicos.</li>
                <li><strong className="text-white">Cookies de Desempenho:</strong> Coletam informações sobre como os usuários interagem com o site, ajudando-nos a melhorar o desempenho e a usabilidade.</li>
                <li><strong className="text-white">Cookies de Funcionalidade:</strong> Permitem lembrar preferências e personalizações (como idioma, tema e configurações).</li>
                <li><strong className="text-white">Cookies de Analytics:</strong> Ajudam a entender o uso da plataforma por meio de dados agregados e anônimos.</li>
                <li><strong className="text-white">Cookies de Marketing:</strong> Utilizados para oferecer conteúdo e ofertas relevantes, eventualmente em parceria com terceiros.</li>
              </ul>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mt-4">
                <p className="text-blue-200 text-sm">
                  <strong>ℹ️ Nota:</strong> Não utilizamos cookies para armazenar informações sensíveis, como senhas ou dados de pagamento.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Como gerenciar cookies */}
          <Card className="metallic-card backdrop-blur-sm mb-8 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-gray-900/10 opacity-30 pointer-events-none"></div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Settings className="h-5 w-5 text-gray-400" />
                Como Gerenciar suas Preferências
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300">
              <p className="mb-4">
                Você pode gerenciar e excluir cookies diretamente nas configurações do seu navegador. Observe que a remoção ou bloqueio de alguns cookies pode afetar a funcionalidade do site.
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Gerenciar cookies no Chrome</li>
                <li>Gerenciar cookies no Firefox</li>
                <li>Gerenciar cookies no Safari</li>
                <li>Gerenciar cookies no Edge</li>
              </ul>
              <p>
                Também podemos disponibilizar um painel de preferências de cookies em nossa plataforma quando aplicável.
              </p>
            </CardContent>
          </Card>

          {/* Retenção */}
          <Card className="metallic-card backdrop-blur-sm mb-8 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-gray-900/10 opacity-30 pointer-events-none"></div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Clock className="h-5 w-5 text-gray-400" />
                Retenção e Validade dos Cookies
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300">
              <p className="mb-4">
                O tempo de permanência de um cookie no seu dispositivo varia de acordo com sua finalidade. Alguns são removidos ao fechar o navegador (cookies de sessão), enquanto outros permanecem por mais tempo (cookies persistentes).
              </p>
              <p>
                Procuramos definir tempos de retenção razoáveis e alinhados às melhores práticas de privacidade.
              </p>
            </CardContent>
          </Card>

          {/* Mais informações */}
          <Card className="metallic-card backdrop-blur-sm mb-8 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-gray-900/10 opacity-30 pointer-events-none"></div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <AlertTriangle className="h-5 w-5 text-gray-400" />
                Mais Informações e Contato
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300">
              <p className="mb-4">
                Para mais detalhes sobre como tratamos seus dados pessoais, consulte nossa <Link href="/privacy" className="text-blue-400 hover:text-blue-300 transition-colors duration-300">Política de Privacidade</Link>.
              </p>
              <p>
                Em caso de dúvidas sobre esta Política de Cookies, entre em contato pelo email: <a href="mailto:equipedark8@gmail.com" className="text-blue-400 hover:text-blue-300 transition-colors duration-300">equipedark8@gmail.com</a>.
              </p>
            </CardContent>
          </Card>

          <div className="text-center mt-12 mb-8">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/privacy">
                <Button variant="outline" className="metallic-button">
                  Política de Privacidade
                </Button>
              </Link>
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
      <div className="fixed bottom-10 right-10 w-24 h-24 opacity-20 pointer-events-none animate-float">
        <div className="w-full h-full rounded-full bg-gradient-to-tr from-white to-gray-500 blur-xl"></div>
      </div>
    </div>
  );
}
