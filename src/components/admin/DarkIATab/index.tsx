'use client';

import { useState, useEffect } from 'react';
import { Brain, Save, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function DarkIATab() {
    const { toast } = useToast();
    const [aiTrainingText, setAiTrainingText] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    // Carregar texto salvo ao montar o componente
    useEffect(() => {
        loadTrainingText();
    }, []);

    const loadTrainingText = async () => {
        try {
            setIsLoading(true);
            
            // Carregar o texto de treinamento da API
            const response = await fetch('/api/ai/config/get?key=training_text');
            if (response.ok) {
                const data = await response.json();
                setAiTrainingText(data.value || '');
                
                // Carregar data do último salvamento
                const lastSavedResponse = await fetch('/api/ai/config/get?key=training_text_last_saved');
                if (lastSavedResponse.ok) {
                    const lastSavedData = await lastSavedResponse.json();
                    if (lastSavedData.value) {
                        setLastSaved(new Date(lastSavedData.value));
                    }
                }
            }
        } catch (error) {
            toast({
                title: 'Erro',
                description: 'Não foi possível carregar o texto de treinamento.',
                variant: 'destructive'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const saveTrainingText = async () => {
        try {
            setIsSaving(true);
            
            // Salvar o texto de treinamento na API
            const response = await fetch('/api/ai/config/set', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    key: 'training_text',
                    value: aiTrainingText
                })
            });
            
            if (!response.ok) {
                throw new Error('Falha ao salvar');
            }
            
            // Salvar data do último salvamento
            const now = new Date();
            await fetch('/api/ai/config/set', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    key: 'training_text_last_saved',
                    value: now.toISOString()
                })
            });
            
            setLastSaved(now);
            
            toast({
                title: 'Sucesso',
                description: 'Texto de treinamento salvo com sucesso!',
            });
        } catch (error) {
            toast({
                title: 'Erro',
                description: 'Não foi possível salvar o texto de treinamento.',
                variant: 'destructive'
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleTextChange = (value: string) => {
        setAiTrainingText(value);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-400">Carregando...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card className="bg-[#151823] border-gray-800">
                <CardHeader>
                    <div className="flex items-center space-x-2">
                        <Brain className="w-6 h-6 text-blue-400" />
                        <CardTitle className="text-white">Treinamento da Dark IA</CardTitle>
                    </div>
                    <CardDescription className="text-gray-400">
                        Configure o comportamento e personalidade da Dark IA editando o texto abaixo. 
                        As alterações são exibidas em tempo real e podem ser salvas quando necessário.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="training-text" className="text-sm font-medium text-gray-300">
                            Texto de Treinamento
                        </label>
                        <Textarea
                            id="training-text"
                            placeholder="Digite aqui as instruções e personalidade que a Dark IA deve seguir..."
                            value={aiTrainingText}
                            onChange={(e) => handleTextChange(e.target.value)}
                            className="min-h-[400px] bg-[#0a0b0f] border-gray-700 text-white placeholder-gray-500 resize-none"
                            disabled={isSaving}
                        />
                    </div>
                    
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            {lastSaved ? (
                                <span>Último salvamento: {lastSaved.toLocaleString('pt-BR')}</span>
                            ) : (
                                <span>Nenhum salvamento ainda</span>
                            )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                onClick={loadTrainingText}
                                disabled={isSaving || isLoading}
                                className="text-gray-300 border-gray-600 hover:bg-gray-700"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Recarregar
                            </Button>
                            
                            <Button
                                onClick={saveTrainingText}
                                disabled={isSaving || !aiTrainingText.trim()}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                {isSaving ? (
                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4 mr-2" />
                                )}
                                {isSaving ? 'Salvando...' : 'Salvar'}
                            </Button>
                        </div>
                    </div>
                    
                    <div className="text-xs text-gray-500 mt-4">
                        <p>💡 Dica: O texto será usado para treinar a personalidade e comportamento da Dark IA.</p>
                        <p>Caracteres: {aiTrainingText.length}</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}