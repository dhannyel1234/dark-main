'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

interface Config {
  _id: string;
  key: string;
  value: string;
}

interface AIConfigPageProps {
  initialConfigs: Config[];
}

export default function AIConfigPage({ initialConfigs = [] }: AIConfigPageProps) {
  const [configs, setConfigs] = useState<Config[]>(initialConfigs);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const handleSave = async () => {
    try {
      if (!newKey || !newValue) {
        toast.error('Preencha todos os campos');
        return;
      }

      const response = await fetch('/api/ai/config/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: newKey, value: newValue }),
      });

      if (!response.ok) {
        throw new Error('Falha ao salvar configuração');
      }

      const newConfig = await response.json();
      setConfigs([...configs, newConfig]);
      setNewKey('');
      setNewValue('');
      toast.success('Configuração salva com sucesso');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar configuração');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Configuração da IA</h1>

      <Card className="p-4 mb-6">
        <h2 className="text-xl mb-4">Adicionar Nova Configuração</h2>
        <div className="space-y-4">
          <div>
            <label className="block mb-2">Chave</label>
            <Input
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder="Ex: nome_ia"
            />
          </div>
          <div>
            <label className="block mb-2">Valor</label>
            <Input
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="Ex: DarkIA"
            />
          </div>
          <Button onClick={handleSave}>Salvar Configuração</Button>
        </div>
      </Card>

      <div className="grid gap-4">
        <h2 className="text-xl">Configurações Atuais</h2>
        {configs.map((config) => (
          <Card key={config._id} className="p-4">
            <div className="font-semibold">{config.key}</div>
            <div className="text-gray-600">{config.value}</div>
          </Card>
        ))}
      </div>
    </div>
  );
} 