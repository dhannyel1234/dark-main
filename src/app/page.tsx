'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, CheckCircle, MonitorPlay, Server, Cpu, HardDrive, Star, Power } from 'lucide-react';
import Feedbacks from '@/components/feedbacks';

import Plans from '@/components/plans';
import { useEffect, useState } from 'react';
import PromotionBanner from '@/components/PromotionBanner';

export default function Home() {
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Simulação de carregamento para animação inicial
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

const [playingVideo, setPlayingVideo] = useState<string | null>(null);

const videos = [
  {
    name: "Esolher um plano",
    image: "https://i.ytimg.com/vi_webp/wHGsz7xctUI/sddefault.webp",
    description: "Primeiro você escolhe seu plano e faz a assinatura. Em seguida poderá criar a sua máquina, ligar/desligar quando quiser em nossa dashboard. Em sua maquina aparecera as informações de conexão.",
    url: "https://www.youtube.com/watch?v=wHGsz7xctUI&t=6s",
    videoId: "wHGsz7xctUI"
  },
  {
    name: "Como utilizar",
    image: "https://i.ytimg.com/vi_webp/xaVU2H6mCJg/sddefault.webp",
    description: "Na barra de pesquisa do windows pesquise RDP e abra o app de conexão remota que ira aparecer, coloque o Ip fornecido no site e clique em conectar. Em seguida coloque o usuário e senha fornecidos no site",
    url: "https://www.youtube.com/watch?v=xaVU2H6mCJg&t=87s",
    videoId: "xaVU2H6mCJg"
  },
  {
    name: "Como Jogar na maquina",
    image: "https://i.ytimg.com/vi_webp/ayI3IazcHy4/sddefault.webp",
    description: "No seu pc, acesse o site parsec.app e crie uma conta no site, em seguida basta ir para a aba Downloads aqui no site baixar o parsec e fazer o login no app com a conta que você criou no site.",
    url: "https://www.youtube.com/watch?v=ayI3IazcHy4&t=7s",
    videoId: "ayI3IazcHy4"
  }
]


  // Jogos populares disponíveis
  const popularGames = [
    { 
      name: "Fortnite", 
      image: "https://image.api.playstation.com/vulcan/ap/rnd/202503/2022/478a8a58b6abc41b9056582d1ede99d03692d4ae306d8895.jpg", 
      platform: "Epic Games",
      url: "https://www.epicgames.com/fortnite/" 
    },
    { 
      name: "GTA V", 
      image: "https://ogimg.infoglobo.com.br/in/9991682-12c-b99/FT1086A/GTA-V-big.jpg", 
      platform: "Steam",
      url: "https://store.steampowered.com/app/271590/Grand_Theft_Auto_V/" 
    },
    { 
      name: "Call of Duty: Warzone", 
      image: "https://bnetcmsus-a.akamaihd.net/cms/gallery/N2KT6ZURN6Z31668019382296.jpg", 
      platform: "Battle.net",
      url: "https://www.callofduty.com/warzone" 
    },
    { 
      name: "Dead by Daylight", 
      image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/381210/header.jpg?t=1744310903", 
      platform: "Steam",
      url: "https://store.steampowered.com/app/381210/Dead_by_Daylight/" 
    },
    { 
      name: "GOD OF WAR", 
      image: "https://image.api.playstation.com/vulcan/img/rnd/202010/2217/p3pYq0QxntZQREXRVdAzmn1w.png", 
      platform: "Steam",
      url: "https://store.steampowered.com/app/1593500/God_of_War/" 
    },
    { 
      name: "Minecraft", 
      image: "https://assets.nintendo.com/image/upload/q_auto/f_auto/ncom/software/switch/70010000000964/a28a81253e919298beab2295e39a56b7a5140ef15abdb56135655e5c221b2a3a", 
      platform: "Mojang",
      url: "https://www.minecraft.net/" 
    },
  ];
  
  const features = [
    {
      icon: <MonitorPlay className="h-5 w-5 text-[#9D86F9]" />,
      title: "Jogue em qualquer dispositivo",
      description: "Acesse sua máquina virtual de qualquer lugar, em qualquer dispositivo com conexão à internet."
    },
    {
      icon: <Cpu className="h-5 w-5 text-[#9D86F9]" />,
      title: "Hardware de alto desempenho",
      description: "Equipamentos de última geração para rodar seus jogos com gráficos impressionantes e alta taxa de quadros."
    },
    {
      icon: <Server className="h-5 w-5 text-[#9D86F9]" />,
      title: "Baixa latência",
      description: "Servidores estrategicamente posicionados para garantir a menor latência possível durante suas sessões de jogo."
    },
    {
      icon: <HardDrive className="h-5 w-5 text-[#9D86F9]" />,
      title: "Armazenamento dedicado",
      description: "Espaço de armazenamento exclusivo para instalar seus jogos favoritos e salvar seu progresso."
    }
  ];

  // Variantes para animações
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <AnimatePresence>
        {isLoaded && (
          <section className="relative w-full min-h-[85vh] flex items-center justify-center overflow-hidden pt-32">
            {/* Glow effect */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full animate-pulse" />
            
            <div className="container mx-auto px-4 py-16 flex flex-col items-center text-center z-10">
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: [0.4, 0.0, 0.2, 1] }}
                className="max-w-3xl flex justify-center mb-4 flex-col items-center"
              >

                 <div className="inline-flex items-center justify-center gap-2 text-sm text-blue-300 px-4 py-2 rounded-full mb-6 hover:bg-blue-900/40 transition-all duration-300 group border border-blue-500/20">
                <Image src="/darkcloud.png" alt="DarkCloud" width={16} height={16} className="text-blue-400 group-hover:text-blue-300 group-hover:animate-pulse" />
                <span className="group-hover:text-blue-300 transition-colors duration-300">DarkCloud</span>
              </div>


                <div className="mb-4 flex justify-center">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "6rem" }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="h-1 bg-blue-500/70 rounded-full"
                  />
                </div>
                
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-6">
                  Jogue em qualquer lugar com{" "}
                  <motion.span 
                    initial={{ opacity: 0, filter: "blur(8px)" }}
                    animate={{ opacity: 1, filter: "blur(0px)" }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600"
                  >
                    DarkCloud
                  </motion.span>
                </h1>
                
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.7 }}
                  className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed"
                >
                  Acesse uma máquina virtual de alto desempenho e jogue seus títulos favoritos em qualquer dispositivo, 
                  com gráficos impressionantes e baixa latência.
                </motion.p>
                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.9 }}
                  className="flex flex-col sm:flex-row gap-6 justify-center"
                >
                  <button 
                    onClick={() => router.push('/queue')}
                    className="px-8 py-4 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 group shadow-lg shadow-blue-700/20 text-white hover:scale-105 bg-[#4B9EFF] hover:bg-[#4B9EFF]/90"
                  >
                    Ligar VM
                    <Power className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                  </button>
                  
                  <button 
                    onClick={() => {
                      const plansSection = document.getElementById('plans');
                      if (plansSection) {
                        plansSection.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="px-8 py-4 border border-white/20 rounded-xl font-medium transition-all duration-300 text-white hover:border-blue-500/50"
                  >
                    Ver planos
                  </button>
                </motion.div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 1, delay: 1.1, ease: [0.4, 0.0, 0.2, 1] }}
                className="mt-20 relative w-full max-w-5xl mx-auto"
              >
                
                
                
            </motion.div>
            </div>
          </section>
        )}
      </AnimatePresence>

      {/* FAQ Section */}
      <section className="relative py-32 w-full overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="flex justify-center mb-4 flex-col items-center"
            >
              <div className="inline-flex items-center justify-center gap-2 text-sm text-blue-300 bg-blue-950/30 px-4 py-2 rounded-full mb-6 backdrop-blur-sm hover:bg-blue-900/40 transition-all duration-300 group border border-blue-500/20">
                <Image src="/darkcloud.png" alt="DarkCloud" width={16} height={16} className="text-blue-400 group-hover:text-blue-300 group-hover:animate-pulse" />
                <span className="group-hover:text-blue-300 transition-colors duration-300">DarkCloud | FAQ</span>
              </div>
              
              <div className="w-16 h-1 bg-blue-500/70 rounded-full"></div>
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6"
            >
              Por que escolher a{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">
                DarkCloud
              </span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-xl text-gray-300 max-w-2xl mx-auto"
            >
              Nossa plataforma oferece a melhor experiência de cloud gaming, com recursos projetados 
              para garantir desempenho, qualidade e acessibilidade.
            </motion.p>
          </div>
          
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto"
          >
            {features.map((feature, index) => (
              <motion.div 
                key={index}
                variants={itemVariants}
                className="border border-blue-500/10 rounded-lg p-3 transition-all duration-300 hover:shadow-lg hover:shadow-[#9D86F9]/20 hover:border-[#9D86F9]/30 group text-center"
                whileHover={{ y: -10 }}
              >
                <div className="w-8 h-8 rounded-lg border border-[#9D86F9]/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300 mx-auto">
                  {feature.icon}
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">{feature.title}</h3>
                <p className="text-gray-300 text-xs leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
          
          {/* Video Tutorials Section - Added in the empty space */}
          <div className="mt-24 max-w-5xl mx-auto">
            <div className="flex justify-center mb-12 flex-col items-center">
              <div className="inline-flex items-center justify-center gap-2 text-sm text-blue-300 bg-blue-950/30 px-4 py-2 rounded-full mb-6 backdrop-blur-sm hover:bg-blue-900/40 transition-all duration-300 group border border-blue-500/20">
                <Image src="/darkcloud.png" alt="DarkCloud" width={16} height={16} className="text-blue-400 group-hover:text-blue-300 group-hover:animate-pulse" />
                <span className="group-hover:text-blue-300 transition-colors duration-300">DarkCloud | Tutoriais</span>
              </div>
              
              <div className="w-16 h-1 bg-blue-500/70 rounded-full"></div>
              
              <h3 className="text-2xl font-bold text-white mb-4">Tutoriais em Vídeo</h3>
              <p className="text-gray-300 max-w-2xl mx-auto">
                Confira nossos tutoriais para aprender a configurar e utilizar sua máquina virtual na DarkCloud.
              </p>
            </div>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {videos.map((video, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ y: -10 }}
                  className="bg-gradient-to-br from-[#1A1A1A] to-black/90 backdrop-blur-sm rounded-lg overflow-hidden shadow-lg shadow-[#9D86F9]/20 hover:border-[#9D86F9]/30 group"
                >
                  <div className="relative aspect-video">
                    {playingVideo === video.videoId ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${video.videoId}?autoplay=1`}
                        title={video.name}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                      />
                    ) : (
                      <>
                        <Image
                          src={video.image}
                          alt={video.name}
                          width={640}
                          height={360}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-60"></div>
                        <button
                          onClick={() => setPlayingVideo(video.videoId)}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <div className="w-16 h-16 rounded-full bg-[#9D86F9]/30 backdrop-blur-sm border border-[#9D86F9]/40 flex items-center justify-center transform group-hover:scale-110 transition-all duration-300">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-8 h-8">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </button>
                      </>
                    )}
                  </div>
                  <div className="p-6">
                    <h4 className="text-lg font-semibold text-white mb-2">{video.name}</h4>
                    <p className="text-gray-300 text-sm leading-relaxed">{video.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Popular Games Section */}
      <section className="relative py-32 w-full overflow-hidden">
        {/* Decoration */}
        <div className="absolute top-1/4 right-0 w-64 h-64 rounded-full bg-blue-500/5 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 left-0 w-72 h-72 rounded-full bg-blue-500/5 blur-3xl animate-pulse" style={{ animationDelay: "1.5s" }}></div>
        
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="flex justify-center mb-4 flex-col items-center"
            >         
              <div className="inline-flex items-center justify-center gap-2 text-sm text-blue-300 bg-blue-950/30 px-4 py-2 rounded-full mb-6 backdrop-blur-sm hover:bg-blue-900/40 transition-all duration-300 group border border-blue-500/20">
                <Image src="/darkcloud.png" alt="DarkCloud" width={16} height={16} className="text-blue-400 group-hover:text-blue-300 group-hover:animate-pulse" />
                <span className="group-hover:text-blue-300 transition-colors duration-300">DarkCloud | Games</span>
              </div>
              
              <div className="w-16 h-1 bg-blue-500/70 rounded-full"></div>
            </motion.div>
            
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6"
            >
              Jogue seus{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">
                títulos favoritos
              </span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-xl text-gray-300 max-w-2xl mx-auto"
            >
              Acesse uma biblioteca completa de jogos populares e desfrute da melhor experiência de cloud gaming.
            </motion.p>
          </div>
          
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {popularGames.map((game, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ 
                  y: -10,
                  boxShadow: "0 15px 30px -10px rgba(59, 130, 246, 0.3)" 
                }}
                className="group relative overflow-hidden rounded-2xl border border-blue-500/10 transition-all duration-500"
              >
                <div className="aspect-video overflow-hidden">
                  <Image
                    src={game.image}
                    alt={game.name}
                    width={600}
                    height={338}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent opacity-70 group-hover:opacity-80 transition-opacity duration-300"></div>
                
                {/* Overlay with game info */}
                <div className="absolute bottom-0 left-0 right-0 p-6 transform transition-transform duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">{game.name}</h3>
                      <p className="text-sm text-gray-300">{game.platform}</p>
                    </div>
                    <a 
                      href={game.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="opacity-0 group-hover:opacity-100 bg-blue-500 hover:bg-blue-600 rounded-full p-3 flex items-center justify-center transform group-hover:scale-110 transition-all duration-300"
                    >
                      <ArrowRight className="h-5 w-5 text-white" />
                    </a>
                  </div>
                </div>
                
                {/* Hover effect - blue glow */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                  <div className="absolute inset-0 border-2 border-blue-500/50 rounded-2xl"></div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Feedbacks Section */}
      <Feedbacks />

      {/* Plans Section */}
      <Plans id="plans" />

      {/* Tecnologias de Conexão Section */}
      <section className="relative py-32 w-full overflow-hidden">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="flex justify-center mb-4 flex-col items-center"
            >         
              <div className="inline-flex items-center justify-center gap-2 text-sm text-blue-300 bg-blue-950/30 px-4 py-2 rounded-full mb-6 backdrop-blur-sm hover:bg-blue-900/40 transition-all duration-300 group border border-blue-500/20">
                <Image src="/darkcloud.png" alt="DarkCloud" width={16} height={16} className="text-blue-400 group-hover:text-blue-300 group-hover:animate-pulse" />
                <span className="group-hover:text-blue-300 transition-colors duration-300">DarkCloud | Conexões</span>
              </div>
              
              <div className="w-16 h-1 bg-blue-500/70 rounded-full"></div>
            </motion.div>
            
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6"
            >
              Nossas{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">
                Tecnologias de Conexão
              </span>
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-xl text-gray-300 max-w-2xl mx-auto"
            >
              Na DarkCloud, oferecemos ambas as tecnologias para que você tenha a melhor experiência de jogo remoto.
            </motion.p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true }}
              whileHover={{ y: -10 }}
              className="bg-gradient-to-br from-purple-950/20 to-black/70 backdrop-blur-lg border border-purple-500/10 rounded-2xl p-8 hover:shadow-lg hover:shadow-purple-500/20 hover:border-purple-500/30 transition-all duration-300"
            >
              <div className="flex items-center mb-6">
                <div className="w-14 h-14 rounded-full bg-purple-900/20 border border-purple-500/20 flex items-center justify-center mr-5">
                  <Image 
                    src="/icons/Parsec.png" 
                    alt="Parsec Logo" 
                    width={28} 
                    height={28} 
                    className="h-8 w-8"
                  />
                </div>
                <h3 className="text-2xl font-bold text-white">Parsec</h3>
              </div>
              <p className="text-gray-300 mb-6 leading-relaxed">
                O Parsec é uma tecnologia de streaming de jogos que permite acesso remoto a partir de praticamente qualquer dispositivo, incluindo navegadores web.
              </p>
              <ul className="space-y-4 mb-6">
                {[
                  "Interface amigável e intuitiva",
                  "Funciona com qualquer hardware gráfico",
                  "Acesso via navegador web",
                  "Configuração simplificada"
                ].map((item, index) => (
                  <motion.li 
                    key={index} 
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 + 0.3 }}
                    viewport={{ once: true }}
                    className="flex items-start gap-3"
                  >
                    <CheckCircle className="h-5 w-5 text-purple-400 shrink-0 mt-0.5" />
                    <span className="text-gray-300">{item}</span>
                  </motion.li>
                ))}
              </ul>
              <div className="bg-purple-950/30 border border-purple-900/30 rounded-lg p-4 mb-6">
                <p className="text-white font-medium">
                  Ideal para: Usuários que priorizam facilidade de uso e compatibilidade ampla.
                </p>
              </div>
              <a 
                href="https://parsec.app/downloads" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Parsec
              </a>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true }}
              whileHover={{ y: -10 }}
              className="bg-gradient-to-br from-blue-950/20 to-black/70 backdrop-blur-lg border border-blue-500/10 rounded-2xl p-8 hover:shadow-lg hover:shadow-blue-500/20 hover:border-blue-500/30 transition-all duration-300"
            >
              <div className="flex items-center mb-6">
                <div className="w-14 h-14 rounded-full bg-blue-900/20 border border-blue-500/20 flex items-center justify-center mr-5">
                  <Image 
                    src="/icons/Moonlight.png" 
                    alt="Moonlight Logo" 
                    width={28} 
                    height={28} 
                    className="h-8 w-8"
                  />
                </div>
                <h3 className="text-2xl font-bold text-white">Moonlight</h3>
              </div>
              <p className="text-gray-300 mb-6 leading-relaxed">
                O Moonlight é baseado no protocolo NVIDIA GameStream, oferecendo desempenho excepcional para hardware NVIDIA.
              </p>
              <ul className="space-y-4 mb-6">
                {[
                  "Latência extremamente baixa",
                  "Suporte a resoluções 4K e até 120 FPS",
                  "Melhor qualidade de imagem",
                  "Otimizado para GPUs NVIDIA"
                ].map((item, index) => (
                  <motion.li 
                    key={index} 
                    initial={{ opacity: 0, x: 10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 + 0.3 }}
                    viewport={{ once: true }}
                    className="flex items-start gap-3"
                  >
                    <CheckCircle className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                    <span className="text-gray-300">{item}</span>
                  </motion.li>
                ))}
              </ul>
              <div className="border border-blue-900/30 rounded-lg p-4 mb-6">
                <p className="text-white font-medium">
                  Ideal para: Gamers que buscam o máximo desempenho e qualidade visual.
                </p>
              </div>
              <a 
                href="https://moonlight-stream.org/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Moonlight
              </a>
            </motion.div>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="mt-16 text-center"
          >
            <div className="border border-blue-500/10 rounded-xl p-8 max-w-3xl mx-auto">
              <h3 className="text-2xl font-bold text-white mb-4">Como funciona na DarkCloud?</h3>
              <p className="text-gray-300 leading-relaxed">
                Nossos servidores já vem com ambas as tecnologias pré-configuradas. Você pode escolher qual usar de acordo com seu dispositivo e preferências.
                Nossa equipe de suporte está disponível para ajudar com qualquer configuração adicional que você possa precisar.
              </p>
            </div>
          </motion.div>
          

        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 w-full overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-1/2 left-0 w-96 h-96 rounded-full animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full animate-pulse" style={{ animationDelay: "0.5s" }}></div>
        
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="border border-blue-500/20 rounded-3xl p-10 md:p-14 shadow-xl shadow-blue-900/10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="max-w-xl">
                <h2 className="text-4xl font-bold text-white mb-6">Pronto para começar sua experiência?</h2>
                <p className="text-gray-300 mb-8 text-lg leading-relaxed">
                  Escolha um plano, configure sua máquina virtual e comece a jogar em minutos. 
                  Sem downloads, sem atualizações, sem preocupações.
                </p>
                <ul className="space-y-4 mb-10">
                  {[
                    "Configuração rápida e fácil",
                    "Suporte técnico 24/7",
                    "Cancele a qualquer momento"
                  ].map((item, index) => (
                    <motion.li 
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      viewport={{ once: true }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-blue-400" />
                      </div>
                      <span className="text-gray-300">{item}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
              
              <div className="flex-shrink-0 w-full md:w-auto">
                <motion.button 
                  onClick={() => router.push('/order')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full md:w-auto px-10 py-5 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-3 group shadow-lg shadow-blue-700/20 text-white text-lg"
                >
                  Começar agora
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}