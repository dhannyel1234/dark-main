'use client';

import { Star, UserCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';

const feedbacks = [
    {
      avatarUrl: "https://images-ext-1.discordapp.net/external/rtI4Gj8ahDOL5ok8eZOjYute_0PWP8jXYtttydT7Ui8/%3Fsize%3D2048/https/cdn.discordapp.com/avatars/295581943297474560/96ea80b9ae86bc2761b7ac3bcacba5b6.png?format=webp&quality=lossless&width=505&height=505",
      name: "Rafasymon223",
      date: "13/05/2025",
      testimonial: "Entrega imediata da máquina, precisei de uma ajuda na madrugada, e o cidadão me atendeu com boa vontade, atendimento 10/10 sem dúvidas.",
      game: "🤍",
      link: "https://discord.com/channels/608503464443772938/1057382812489097247/1371706319144222851"
    },
    {
      avatarUrl: "https://images-ext-1.discordapp.net/external/v9DIZVje6ZHUabPpzvs4fbuKOueMDGUQ0PuLm2tDjFs/%3Fsize%3D2048/https/cdn.discordapp.com/avatars/692431990128902155/c3d47ccb3e4e481a7f28cdb7b3632660.png?format=webp&quality=lossless",
      name: "Rzw'4m",
      date: "11/05/2025",
      testimonial: "O desempenho dessa máquina é excelente, todo o suporte é perfeito, sem delay nenhum na maquina e um ótimo desempenho em jogos !",
      game: "🤍",
      link: "https://discord.com/channels/608503464443772938/1057382812489097247/1371004565000028200"
    },
    {
      avatarUrl: "https://images-ext-1.discordapp.net/external/ZKVXPDdQxbb6Z4l25auu1bGc0uBgt5pJAFK73-KDouo/%3Fsize%3D2048/https/cdn.discordapp.com/avatars/270314886859456512/40fd1cf04209b7f3c057020f4a303c5e.png?format=webp&quality=lossless&width=505&height=505",
      name: "Suuna",
      date: "16/05/2025",
      testimonial: "Máquina boa, sem delay, sem queda no desempenho, principalmente caso utilize para trabalhar com Photoshop ou edição de vídeo, para jogos, as vezes dá uma queda de FPS, mas nada muito gritante.",
      game: "🤍",
      link: "https://discord.com/channels/608503464443772938/1057382812489097247/1373027273585987686"
    }
];

export default function Feedbacks() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  return (
    <section className="relative py-24 w-full overflow-hidden">
      <div className="relative z-10 container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center gap-2 text-sm text-blue-300 bg-blue-950/30 px-4 py-2 rounded-full mb-6 backdrop-blur-sm hover:bg-blue-900/40 transition-all duration-300 group border border-blue-500/20">
            <div className="flex items-center gap-2">
              <Image src="/darkcloud.png" alt="DarkCloud" width={16} height={16} className="text-blue-400 group-hover:text-blue-300 group-hover:animate-pulse" />
              <h1 className="text-lg font-bold">DarkCloud</h1>
            </div>
          </div>
          
          <h2 className="mb-6 text-4xl font-bold tracking-tight text-white">
            O que nossos <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-[#9D86F9]">clientes</span> dizem
          </h2>
          
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Veja as experiências reais de quem já está aproveitando o poder do cloud gaming com a DarkCloud.
          </p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 gap-8"
        >
          {feedbacks.map((feedback, index) => (
            <motion.div 
              key={index}
              variants={itemVariants}
              className="bg-gradient-to-br from-blue-950/10 to-black/80 backdrop-blur-md border border-blue-500/10 rounded-2xl p-6 transition-all duration-300 
                hover:border-[#9D86F9]/30 hover:shadow-lg hover:shadow-[#9D86F9]/10 group"
            >
              {/* Testimonial Header */}
              <div className="flex items-start gap-5">
                <div className="shrink-0">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-blue-900/50 group-hover:border-[#9D86F9]/50 transition-all duration-300 shadow-md">
                    <Image 
                      src={feedback.avatarUrl} 
                      alt={feedback.name} 
                      className="w-full h-full object-cover"
                      width={56}
                      height={56}
                    />
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Image src={feedback.avatarUrl} alt={feedback.name} width={32} height={32} className="rounded-full" />
                      <div>
                        <h3 className="font-medium">{feedback.name}</h3>
                        <p className="text-sm text-gray-500">{feedback.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex px-3 py-1 rounded-full text-xs bg-blue-900/30 text-[#9D86F9] border border-[#9D86F9]/30">
                        {feedback.game}
                      </span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            className="h-4 w-4 fill-[#9D86F9] text-[#9D86F9]" 
                            fill="currentColor"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <span className="absolute -top-3 -left-2 text-4xl text-[#9D86F9]/30">"</span>
                    <p className="text-gray-300 relative z-10 pl-4">
                      {feedback.testimonial}
                    </p>
                    <span className="absolute -bottom-5 -right-2 text-4xl text-[#9D86F9]/30">"</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
