import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = 'AIzaSyAYsLUnXpWku00q9fXQVtKRx4gZsINWKds';
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export async function generateGeminiResponse(message: string, context?: string) {
  try {
    const finalMessage = context ? `${context}\n\n${message}` : message;
    
    console.log('=== GEMINI DEBUG ===');
    console.log('Original message:', message);
    console.log('Context received:', context);
    console.log('Final message to Gemini:', finalMessage);
    console.log('==================');
    
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: finalMessage,
    });
    
    console.log('Gemini response:', response.text);
    
    return response.text;
  } catch (error) {
    console.error('Erro ao gerar resposta:', error);
    throw error;
  }
}