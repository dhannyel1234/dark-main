import EfiPay from 'sdk-node-apis-efi';
import path from 'path';

// Configurar o caminho do certificado
const certPath = path.join(process.cwd(), process.env.EFI_CERT_PATH!);

const options = {
  client_id: process.env.EFI_CLIENT_ID!,
  client_secret: process.env.EFI_CLIENT_SECRET!,
  certificate: certPath,
  sandbox: false,
  validateMtls: false // Desabilitar validação MTLS temporariamente
};

console.log('DEBUG - Opções EFI:', {
  temClientId: !!options.client_id,
  temClientSecret: !!options.client_secret,
  certPath,
  sandbox: options.sandbox
});

const efipay = new EfiPay(options);

export async function criarCobrancaPix({
  valor,
  descricao,
  cpf,
  cnpj,
  nome,
}: {
  valor: number;
  descricao: string;
  cpf?: string;
  cnpj?: string;
  nome?: string;
}) {
  try {
    // Monta o payload da cobrança
    const devedorPayload = () => {
       if (!nome) return {}; // Se não há nome, não há devedor
       if (cpf) return { devedor: { cpf, nome } };
       if (cnpj) return { devedor: { cnpj, nome } };
       return {};
    }

    const data = {
      calendario: { expiracao: 3600 },
      valor: { original: valor.toFixed(2) },
      chave: process.env.EFI_PIX_KEY!,
      solicitacaoPagador: descricao,
      ...devedorPayload(),
    };

    console.log('DEBUG - Tentando criar cobrança com:', {
      valor: valor.toFixed(2),
      chave: process.env.EFI_PIX_KEY,
      temCertificado: !!process.env.EFI_CERT_PATH
    });

    // Cria a cobrança
    const charge = await efipay.pixCreateImmediateCharge({}, data);
    const txid = charge.txid;
    const locId = charge.loc.id;

    // Gera o código e imagem do QR Code
    const qrcode = await efipay.pixGenerateQRCode({ id: locId });

    return {
      txid,
      brCode: qrcode.qrcode,
      qrCodeImage: qrcode.imagemQrcode,
      valor,
    };
  } catch (error) {
    console.error('DEBUG - Erro ao criar cobrança:', error);
    throw error;
  }
}
