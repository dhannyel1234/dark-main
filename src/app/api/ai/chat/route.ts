import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import AIConfigController from '@/functions/database/controllers/AIConfigController';
import { generateGeminiResponse } from '@/lib/gemini';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { message } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Mensagem não fornecida' }, { status: 400 });
    }

    // Log da mensagem recebida com timestamp
    console.log(`[${new Date().toISOString()}] Nova mensagem recebida:`, message);
    console.log(`[${new Date().toISOString()}] User ID:`, user.id);

    // Obter configurações da IA
    const configs = await AIConfigController.getAll();
    
    // Buscar especificamente o texto de treinamento
    const trainingText = await AIConfigController.get('training_text');
    
    console.log('Training text retrieved:', trainingText);
    console.log('All configs:', configs);
    
    // Criar contexto para a IA
    let context = 'Você é a Dark IA, uma assistente inteligente.';
    
    if (trainingText) {
        // Se há texto de treinamento personalizado, use-o como contexto principal
        context = trainingText;
        console.log('Using training text as context:', context);
    } else {
        // Caso contrário, use as configurações gerais
        const configContext = configs.map(c => `${c.key}: ${c.value}`).join('\n');
        if (configContext) {
            context = `Você é uma IA assistente. Use estas configurações para se comportar de acordo:\n${configContext}`;
        }
        console.log('Using default context:', context);
    }

    // Obter resposta do Gemini
    const response = await generateGeminiResponse(message, context);

    console.log(`[${new Date().toISOString()}] Resposta gerada para user ${user.id}:`, response);

    // Retornar resposta com headers para evitar cache
    return NextResponse.json({ response }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Erro no chat com IA:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}