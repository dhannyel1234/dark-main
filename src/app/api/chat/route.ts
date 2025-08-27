import { NextRequest, NextResponse } from 'next/server';
import { generateGeminiResponse } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Mensagem é obrigatória' },
        { status: 400 }
      );
    }

    // Contexto para a Dark IA
    const context = `Você é a Dark IA, uma assistente virtual inteligente e prestativa da Dark Cloud Gaming. 
Você deve:
- Ser amigável e profissional
- Ajudar com questões sobre cloud gaming, tecnologia e suporte geral
- Responder em português brasileiro
- Ser concisa mas informativa
- Manter o foco em ajudar o usuário

Se perguntarem sobre a Dark Cloud, explique que é uma plataforma de cloud gaming que permite jogar jogos em qualquer dispositivo.`;

    const response = await generateGeminiResponse(message, context);

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Erro na API do chat:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}