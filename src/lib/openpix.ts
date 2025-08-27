import axios from 'axios';

const OPENPIX_API_URL = 'https://api.openpix.com.br/api/v1';

const api = axios.create({
  baseURL: OPENPIX_API_URL,
  headers: {
    'Authorization': 'Q2xpZW50X0lkXzQzYzVhM2VkLTc0MjktNDkyMS1iOTgwLWJmYWIyNDc4ZGZjNzpDbGllbnRfU2VjcmV0X0pHZnJ1bW1zVWhxbEpJZUMrUy9vL3l2S1hUVmhqQk5rYTlCVXFldXRQZDg9',
    'Content-Type': 'application/json'
  }
});

export interface CreateChargeData {
  correlationID: string;
  value: number;
  comment: string;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
    taxID?: string;
  };
}

export async function createCharge(data: CreateChargeData) {
  try {
    const response = await api.post('/charge', {
      correlationID: data.correlationID,
      value: data.value,
      comment: data.comment,
      customer: data.customer || undefined
    });

    return response.data;
  } catch (error) {
    console.error('Erro ao criar cobrança OpenPix:', error);
    throw error;
  }
}

export async function getCharge(correlationID: string) {
  try {
    const response = await api.get(`/charge/${correlationID}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar cobrança OpenPix:', error);
    throw error;
  }
}

// Função para formatar o token corretamente
function formatarTokenOpenPix(token: string | undefined): string | null {
  if (!token) return null;
  
  // Se já tem "Basic", retorna como está
  if (token.startsWith('Basic ')) {
    return token;
  }
  
  // Se não tem "Basic", adiciona o prefixo
  return `Basic ${token}`;
}

// Função para verificar se o token é apenas Client ID
function verificarTokenOpenPix(token: string | undefined): { tipo: string; mensagem: string } {
  if (!token) {
    return { tipo: 'vazio', mensagem: 'Token não configurado' };
  }
  
  // Se tem "Basic", verifica o conteúdo
  if (token.startsWith('Basic ')) {
    const conteudo = token.replace('Basic ', '');
    if (conteudo.startsWith('Client_Id_') && conteudo.includes(':')) {
      return { tipo: 'appid_completo', mensagem: 'AppID completo detectado' };
    } else if (conteudo.startsWith('Client_Id_') && !conteudo.includes(':')) {
      return { tipo: 'client_id_apenas', mensagem: 'Apenas Client ID detectado - precisa do AppID completo' };
    }
  } else {
    // Se não tem "Basic"
    if (token.startsWith('Client_Id_') && token.includes(':')) {
      return { tipo: 'appid_sem_basic', mensagem: 'AppID completo sem Basic - será formatado automaticamente' };
    } else if (token.startsWith('Client_Id_') && !token.includes(':')) {
      return { tipo: 'client_id_apenas', mensagem: 'Apenas Client ID detectado - precisa do AppID completo' };
    }
  }
  
  return { tipo: 'desconhecido', mensagem: 'Formato de token desconhecido' };
}

export async function testarTokensOpenPix() {
  // Verificar o token atual primeiro
  const tokenAtual = process.env.OPENPIX_APP_ID;
  const verificacao = verificarTokenOpenPix(tokenAtual);
  
  console.log('🔍 Verificação do token atual:');
  console.log('Tipo:', verificacao.tipo);
  console.log('Mensagem:', verificacao.mensagem);
  
  if (verificacao.tipo === 'client_id_apenas') {
    console.log('❌ PROBLEMA DETECTADO: Você está usando apenas o Client ID!');
    console.log('📋 Para resolver:');
    console.log('1. Acesse o painel da OpenPix');
    console.log('2. Vá em "Configurações" > "API"');
    console.log('3. Copie o "AppID" completo (não apenas o Client ID)');
    console.log('4. O AppID deve começar com "Client_Id_" e conter ":" seguido do Client Secret');
    console.log('5. Atualize a variável OPENPIX_APP_ID no arquivo .env.local');
  }
  
  const tokens = [
    // Token com Basic já formatado
    'Basic Q2xpZW50X0lkXzQzYzVhM2VkLTc0MjktNDkyMS1iOTgwLWJmYWIyNDc4ZGZjNzpDbGllbnRfU2VjcmV0X2M2NWM1RjdtUktUd3gyMVZxdkQ0OCtWbTVzUWZFSU1obnN6aG1QTGRITTg9',
    // Token sem Basic (será formatado automaticamente)
    formatarTokenOpenPix(process.env.OPENPIX_APP_ID),
    formatarTokenOpenPix(process.env.NEXT_PUBLIC_OPENPIX_TOKEN),
    // Testar com o Client ID atual
    'Basic ' + btoa('Client_Id_43c5a3ed-7429-4921-b980-bfab2478dcf7:Client_Secret_XXXXX'),
    // Token de sandbox da OpenPix para teste
    'Basic Q2xpZW50X0lkX2FiY2RlZjEyMzQ1Njc4OTBhYmNkZWYxMjM0NTY3ODkwOjpDbGllbnRfU2VjcmV0X2FiY2RlZjEyMzQ1Njc4OTBhYmNkZWYxMjM0NTY3ODkw',
    // Adicione outros tokens aqui se tiver
  ].filter(Boolean); // Remove valores null/undefined

  console.log('🧪 Testando múltiplos tokens...');
  console.log('📋 Tokens disponíveis:', tokens.length);
  
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (!token) {
      console.log(`⏭️ Token ${i + 1}: vazio, pulando...`);
      continue;
    }
    
    console.log(`\n🔑 Testando token ${i + 1}:`, token);
    
    try {
      const res = await fetch('https://api.openpix.com.br/api/v1/charge', {
        method: 'POST',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          correlationID: `teste-${Date.now()}-${i}`,
          value: 100,
          comment: 'Teste de token',
          customer: {
            name: 'teste',
            email: 'teste@teste.com',
          },
        }),
      });

      console.log(`📡 Status do token ${i + 1}:`, res.status);
      
      if (res.status === 200) {
        const data = await res.json();
        console.log(`✅ Token ${i + 1} FUNCIONOU!`, data);
        return token;
      } else if (res.status === 401) {
        console.log(`❌ Token ${i + 1} inválido`);
      } else {
        const errorText = await res.text();
        console.log(`⚠️ Token ${i + 1} erro ${res.status}:`, errorText);
      }
    } catch (error) {
      console.log(`❌ Token ${i + 1} erro de conexão:`, error);
    }
  }
  
  console.log('❌ Nenhum token funcionou!');
  return null;
}

export async function testarConexaoOpenPix() {
  const token = process.env.OPENPIX_API_KEY!;
  
  console.log("🔍 Testando conexão com OpenPix...");
  console.log("🔑 Token:", token);
  
  const response = await fetch("https://api.openpix.com.br/api/v1/charge", {
    method: "POST",
    headers: {
      "Authorization": token,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      correlationID: `teste-${Date.now()}`,
      value: 100,
      comment: "Teste de conexão",
      customer: {
        name: "Teste",
        email: "teste@exemplo.com"
      }
    })
  });

  console.log("📊 Status do teste:", response.status);
  
  if (response.status === 401) {
    console.error("❌ Token inválido!");
    return false;
  }
  
  if (response.ok) {
    console.log("✅ Conexão bem-sucedida!");
    return true;
  }
  
  console.error("❌ Erro na conexão:", response.status);
  return false;
}

// Função simples para criar cobrança na OpenPix
export async function criarCobrancaOpenPix(user: any, plan: any, value?: number) {
  // Usar a variável pública para garantir leitura em qualquer ambiente
  const appId = process.env.NEXT_PUBLIC_OPENPIX_APP_ID;
  
  if (!appId) {
    throw new Error('NEXT_PUBLIC_OPENPIX_APP_ID não configurado no arquivo .env.local');
  }

  // Calcular valor em centavos
  const finalValue = value || Math.round(plan.priceValue * 100);

  console.log('🔍 Criando cobrança OpenPix:', {
    user: user.name || user.email,
    plan: plan.name,
    value: finalValue,
    appId: appId.substring(0, 20) + '...'
  });

  try {
    const response = await fetch("https://api.openpix.com.br/api/v1/charge", {
      method: "POST",
      headers: {
        "Authorization": appId,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        correlationID: `compra-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        value: finalValue,
        comment: `Plano ${plan.name}`,
        customer: {
          name: user.name || user.email || "Cliente",
          email: user.email || "cliente@exemplo.com"
        }
      })
    });

    console.log('📡 Status da resposta:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro na API OpenPix:', errorText);
      throw new Error(`Erro na API OpenPix (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.charge) {
      throw new Error("Resposta inválida da OpenPix - charge não encontrada");
    }

    console.log('✅ Cobrança criada com sucesso:', {
      chargeId: data.charge.id,
      qrCodeImage: data.charge.qrCodeImage ? 'Disponível' : 'Não disponível'
    });

    return data;

  } catch (error) {
    console.error('❌ Erro ao criar cobrança:', error);
    throw error;
  }
} 