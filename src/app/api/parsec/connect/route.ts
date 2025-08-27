import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * API para conectar-se a uma máquina virtual via Parsec
 * Esta API recebe as credenciais do Parsec e o ID da máquina
 * e inicia uma conexão remota usando o protocolo Parsec
 */
export async function POST(req: NextRequest) {
    try {
        // Verificar autenticação do usuário
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json(
                {
                    error: "Conta não autenticada.",
                    support: "@sb4z7"
                },
                { status: 401 }
            );
        };

        // Obter dados da requisição
        const { email, password, machineId, machineIp } = await req.json();
        
        if (!email || !password || !machineId || !machineIp) {
            return NextResponse.json(
                {
                    error: "Parâmetros obrigatórios ausentes",
                    support: "@sb4z7"
                },
                { status: 400 }
            );
        };

        // Aqui seria implementada a integração real com a API do Parsec
        // Como a API oficial do Parsec não está disponível publicamente para este tipo de integração,
        // estamos retornando uma resposta simulada com as informações necessárias para o cliente
        // iniciar a conexão via protocolo parsec://

        // Na implementação real, seria necessário:
        // 1. Autenticar no Parsec com as credenciais fornecidas
        // 2. Obter um token de sessão
        // 3. Iniciar uma conexão com a máquina específica

        // Gerar URL de conexão do Parsec (formato: parsec://peer_id=PEER_ID)
        // Em uma implementação real, o peer_id seria obtido da API do Parsec
        const parsecUrl = `parsec://peer_id=${machineId}&server=${machineIp}`;

        return NextResponse.json({
            success: true,
            connectionUrl: parsecUrl,
            message: "Dados de conexão gerados com sucesso",
            // Incluir informações adicionais que podem ser úteis para o cliente
            machineInfo: {
                id: machineId,
                ip: machineIp
            }
        }, { status: 200 });

    } catch (err) {
        console.error("Erro ao conectar via Parsec:", err);
        return NextResponse.json(
            {
                error: "Erro ao processar a conexão Parsec",
                message: err instanceof Error ? err.message : "Erro desconhecido",
                support: '@sb4z7'
            },
            { status: 500 }
        );
    };
};