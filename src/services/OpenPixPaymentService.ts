import axios from 'axios';

const OPENPIX_API_URL = 'https://api.openpix.com.br/api/v1';

export interface OpenPixChargeData {
  correlationID: string;
  value: number; // Valor em centavos
  comment: string;
  customer?: {
    name: string;
    email: string;
    phone?: string;
    taxID?: string; // CPF/CNPJ
  };
}

export interface OpenPixCharge {
  correlationID: string;
  pixQrCode: string;
  qrCodeImage: string;
  value: number;
  status: string;
  transactionID: string;
}

export class OpenPixPaymentService {
  private appId: string;
  private api: any;

  constructor() {
    this.appId = process.env.OPENPIX_APP_ID!;
    
    if (!this.appId) {
      throw new Error('OPENPIX_APP_ID não configurado nas variáveis de ambiente');
    }

    this.api = axios.create({
      baseURL: OPENPIX_API_URL,
      headers: {
        'Authorization': this.appId.startsWith('Basic ') ? this.appId : `Basic ${this.appId}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async criarCobrancaPix({
    valor,
    descricao,
    cpf,
    cnpj,
    nome,
    email
  }: {
    valor: number;
    descricao: string;
    cpf?: string;
    cnpj?: string;
    nome?: string;
    email?: string;
  }): Promise<{ txid: string; brCode: string; qrCodeImage: string; valor: number }> {
    try {
      const correlationID = `darkcloud_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const chargeData: OpenPixChargeData = {
        correlationID,
        value: Math.round(valor * 100), // Converter para centavos
        comment: descricao,
      };

      // Adicionar dados do cliente se fornecidos
      if (nome || email || cpf || cnpj) {
        chargeData.customer = {
          name: nome || 'Cliente',
          email: email || 'cliente@darkcloud.store',
          taxID: cpf || cnpj
        };
      }

      console.log('🔍 Criando cobrança OpenPix:', {
        correlationID,
        value: chargeData.value,
        customer: chargeData.customer?.name
      });

      const response = await this.api.post('/charge', chargeData);
      
      if (!response.data || !response.data.charge) {
        throw new Error('Resposta inválida da API OpenPix');
      }

      const charge = response.data.charge;

      return {
        txid: charge.correlationID,
        brCode: charge.brCode,
        qrCodeImage: charge.qrCodeImage,
        valor: valor
      };

    } catch (error: any) {
      console.error('❌ Erro ao criar cobrança OpenPix:', error.response?.data || error.message);
      
      if (error.response?.status === 401) {
        throw new Error('Token OpenPix inválido. Verifique a configuração OPENPIX_APP_ID');
      }
      
      if (error.response?.status === 400) {
        throw new Error(`Dados inválidos: ${error.response.data?.message || 'Verifique os dados enviados'}`);
      }

      throw new Error(`Erro na API OpenPix: ${error.message}`);
    }
  }

  async consultarCobranca(correlationID: string) {
    try {
      const response = await this.api.get(`/charge/${correlationID}`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao consultar cobrança OpenPix:', error.response?.data || error.message);
      throw error;
    }
  }

  async testarConexao(): Promise<boolean> {
    try {
      console.log('🧪 Testando conexão OpenPix...');
      
      const testCharge = await this.criarCobrancaPix({
        valor: 1, // R$ 0,01
        descricao: 'Teste de conexão DarkCloud',
        nome: 'Teste',
        email: 'teste@darkcloud.store'
      });

      console.log('✅ Teste de conexão OpenPix bem-sucedido!');
      return true;

    } catch (error) {
      console.error('❌ Teste de conexão OpenPix falhou:', error);
      return false;
    }
  }
}

// Instância singleton
export const openPixService = new OpenPixPaymentService();

// Função helper para manter compatibilidade
export async function criarCobrancaPix(data: {
  valor: number;
  descricao: string;
  cpf?: string;
  cnpj?: string;
  nome?: string;
  email?: string;
}) {
  return openPixService.criarCobrancaPix(data);
}