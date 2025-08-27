'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FormattedText } from '@/components/ui/formatted-text'
import { ArrowLeft, Send, Bot, User, MessageCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'
import { User as SupabaseUser } from '@supabase/supabase-js'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface UserProfile {
  avatar_url?: string
  discord_username?: string
  full_name?: string
}

export default function DarkIAPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Scroll automático para o final do chat
  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }

  useEffect(() => {
    // Pequeno delay para garantir que o DOM foi atualizado
    const timer = setTimeout(() => {
      scrollToBottom()
    }, 100)
    return () => clearTimeout(timer)
  }, [messages])

  // Scroll para o final quando o componente é montado
  useEffect(() => {
    scrollToBottom()
  }, [])

  // Inicializar com mensagem de boas-vindas
  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        content: 'Olá! Sou o assistente virtual da Dark Cloud Gaming. Como posso ajudá-lo hoje?'
      }
    ])
  }, [])

  const handleLogin = async () => {
    const supabase = createClient()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || location.origin
    const redirectUrl = `${siteUrl}/api/auth/callback`

    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: redirectUrl,
      },
    })
  }

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      console.log('User data:', user)
      
      if (user) {
        setUser(user)
        
        // Buscar perfil do usuário
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('avatar_url, discord_username, full_name')
          .eq('id', user.id)
          .single()
        
        console.log('Profile data:', profile)
        console.log('Profile error:', error)
        console.log('User metadata:', user.user_metadata)
        
        if (profile) {
          setUserProfile(profile)
        } else {
          // Se não há profile na tabela, usar dados do user_metadata
          const fallbackProfile = {
            avatar_url: user.user_metadata?.avatar_url,
            discord_username: user.user_metadata?.user_name || user.user_metadata?.full_name,
            full_name: user.user_metadata?.full_name
          }
          console.log('Using fallback profile:', fallbackProfile)
          setUserProfile(fallbackProfile)
        }
      }
      
      setAuthLoading(false)
    }
    
    fetchUser()
  }, [])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    try {
      setIsLoading(true)
      const userMessage = { role: 'user' as const, content: input }
      setMessages(prev => [...prev, userMessage])
      setInput('')

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      })

      if (!response.ok) {
        throw new Error('Falha ao enviar mensagem')
      }

      const data = await response.json()
      const assistantMessage = { role: 'assistant' as const, content: data.response }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Erro no chat:', error)
      toast.error('Erro ao enviar mensagem')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleContactSupport = () => {
    const supportMessage = {
      role: 'assistant' as const,
      content: 'Entendo que você precisa de atendimento personalizado. Clique no botão abaixo para falar diretamente com nossa equipe de suporte via WhatsApp.'
    }
    setMessages(prev => [...prev, supportMessage])
  }

  if (authLoading) {
    return (
      <>
        <style jsx global>{`
          body {
            background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
            min-height: 100vh;
          }
          main {
            background: transparent !important;
          }
        `}</style>
        
        <div className="min-h-screen bg-transparent flex items-center justify-center">
          <div className="text-white">Carregando...</div>
        </div>
      </>
    )
  }

  if (!user) {
    return (
      <>
        <style jsx global>{`
          body {
            background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
            min-height: 100vh;
          }
          main {
            background: transparent !important;
          }
        `}</style>
        
        <div className="min-h-screen bg-transparent">
          {/* Header */}
          <div className="border-b border-gray-800 bg-black/20 backdrop-blur-sm">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.back()}
                  className="text-white hover:bg-white/10"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <Bot className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-white">Dark IA</h1>
                    <p className="text-sm text-gray-400">Assistente Virtual da Dark Cloud Gaming</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Login Required */}
          <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
            <Card className="w-full max-w-md mx-4 bg-black/40 backdrop-blur-sm border-gray-800">
              <div className="p-6 text-center">
                <Bot className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Dark IA</h2>
                <p className="text-gray-400 mb-6">
                  Faça login com sua conta Discord para acessar o chat da Dark IA
                </p>
                <Button
                  onClick={handleLogin}
                  className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white"
                >
                  <svg
                    className="h-5 w-5 mr-2"
                    viewBox="0 0 71 55"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z" />
                  </svg>
                  Entrar com Discord
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <style jsx global>{`
        body {
          background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
          min-height: 100vh;
        }
        main {
          background: transparent !important;
        }
      `}</style>
      
      <div className="min-h-screen bg-transparent">


        {/* Chat Container */}
        <div className="container mx-auto px-4 pt-16 pb-6 max-w-4xl">
          <Card className="h-[80vh] bg-black/40 backdrop-blur-sm border-gray-800 flex flex-col">
            <ScrollArea ref={scrollAreaRef} className="flex-grow p-4">
              <div className="space-y-4">

                
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg backdrop-blur-sm border-2 ${
                        message.role === 'user'
                          ? 'bg-gray-800/30 text-white border-yellow-500/50 shadow-lg shadow-yellow-500/20'
                          : 'bg-gray-800/30 text-gray-200 border-blue-500/50 shadow-lg shadow-blue-500/20'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {message.role === 'user' ? (
                          <>
                            {userProfile?.avatar_url ? (
                              <img 
                                src={userProfile.avatar_url} 
                                alt="Avatar" 
                                className="w-5 h-5 rounded-full"
                              />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white">
                                {userProfile?.discord_username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                              </div>
                            )}
                            <span className="font-semibold text-white">
                              {userProfile?.discord_username || userProfile?.full_name || 'Você'}
                            </span>
                          </>
                        ) : (
                          <>
                            <Bot className="w-5 h-5 text-blue-500" />
                            <span className="font-semibold text-blue-500">Dark IA</span>
                          </>
                        )}
                      </div>
                      <FormattedText text={message.content} className="text-sm leading-relaxed" />
                      {message.role === 'assistant' && message.content.includes('atendimento personalizado') && (
                        <div className="mt-3">
                          <a
                            href="https://wa.me/5511911967089?text=Olá%2C%20preciso%20de%20um%20atendimento%20especializado%20da%20Dark%20Cloud%20Store"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200"
                          >
                            <MessageCircle className="h-4 w-4" />
                            Atendimento Real
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                      <div className="animate-pulse text-gray-200">Digitando...</div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-gray-800">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite sua mensagem..."
                  disabled={isLoading}
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500"
                />
                <Button onClick={handleSend} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Send className="h-4 w-4" />
                </Button>
                <Button 
                  onClick={handleContactSupport} 
                  disabled={isLoading} 
                  variant="outline" 
                  className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700 hover:border-gray-500"
                  title="Falar com atendente"
                >
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}