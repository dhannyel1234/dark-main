import { NextRequest } from 'next/server';
import { User } from '@supabase/supabase-js';

interface WebhookParams {
    title: string;
    description?: string;
    user: User;
    request: NextRequest;
    color?: number;
    fields?: { name: string; value: string; inline?: boolean }[];
}

export async function sendSecurityWebhook({
    title,
    description,
    user,
    request,
    color = 0xFF0000, // Vermelho padrão para alertas de segurança
    fields = [],
}: WebhookParams) {
    const webhookUrl = process.env.DISCORD_WEBHOOK_SECURITY;
    if (!webhookUrl) {
        console.warn("DISCORD_WEBHOOK_SECURITY não está definido. Pulando envio de webhook.");
        return;
    }

    try {
        const now = new Date();
        const brazilTime = new Intl.DateTimeFormat('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        }).format(now);

        const defaultFields = [
            {
                name: "👤 Usuário",
                value: `${user.email || 'N/A'} (${user.id})`,
                inline: true
            },
            {
                name: "🌐 Rota",
                value: request.nextUrl.pathname,
                inline: true
            },
            {
                name: "⏰ Horário",
                value: brazilTime,
                inline: true
            },
            {
                name: "🌍 IP",
                value: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'N/A',
                inline: true
            }
        ];

        const embed = {
            title: `⚠️ ${title}`,
            description: description || "Uma atividade de segurança foi detectada.",
            color,
            fields: [...defaultFields, ...fields],
            timestamp: now.toISOString()
        };

        await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ embeds: [embed] })
        });
    } catch (error) {
        console.error('Erro ao enviar webhook de segurança para o Discord:', error);
    }
}