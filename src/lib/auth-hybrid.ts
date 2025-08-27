import { createClient } from '@/utils/supabase/server';
import { NextRequest } from 'next/server';

export interface AuthenticatedUser {
  id: string;
  email?: string;
  user_metadata?: any;
  profile?: {
    id: string;
    username?: string;
    full_name?: string;
    avatar_url?: string;
    admin_level: 'owner' | 'admin' | 'user';
  };
}

/**
 * Authentication utility that uses Supabase for auth and profile data
 */
export class AuthHybrid {
  /**
   * Authenticate user and get profile data via Supabase
   */
  static async getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
    try {
      const supabase = await createClient();
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        return null;
      }

      // Get profile data via Supabase
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      return {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata,
        profile: profile ? {
          id: profile.id,
          username: profile.discord_username || undefined,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || undefined,
          avatar_url: profile.avatar_url || undefined,
          admin_level: profile.admin_level || 'user',
        } : {
          id: user.id,
          admin_level: 'user' as const,
        },
      };
    } catch (error) {
      console.error('Error in getAuthenticatedUser:', error);
      return null;
    }
  }

  /**
   * Check if user is admin (admin or owner)
   */
  static async isAdmin(userId?: string): Promise<boolean> {
    try {
      if (!userId) {
        const user = await this.getAuthenticatedUser();
        if (!user) return false;
        userId = user.id;
      }

      const supabase = await createClient();
      const { data: profile } = await supabase
        .from('profiles')
        .select('admin_level')
        .eq('id', userId)
        .single();

      return profile?.admin_level === 'admin' || profile?.admin_level === 'owner';
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  /**
   * Check if user is owner
   */
  static async isOwner(userId?: string): Promise<boolean> {
    try {
      if (!userId) {
        const user = await this.getAuthenticatedUser();
        if (!user) return false;
        userId = user.id;
      }

      const supabase = await createClient();
      const { data: profile } = await supabase
        .from('profiles')
        .select('admin_level')
        .eq('id', userId)
        .single();

      return profile?.admin_level === 'owner';
    } catch (error) {
      console.error('Error checking owner status:', error);
      return false;
    }
  }

  /**
   * Ensure user profile exists in our database (sync from Supabase auth)
   */
  static async ensureProfile(user: any): Promise<void> {
    try {
      const supabase = await createClient();
      
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!existingProfile) {
        await supabase
          .from('profiles')
          .insert({
            id: user.id,
            discord_username: user.user_metadata?.preferred_username || user.user_metadata?.username,
            avatar_url: user.user_metadata?.avatar_url,
            admin_level: 'user',
            updated_at: new Date().toISOString(),
          });
      }
    } catch (error) {
      console.error('Error ensuring profile:', error);
    }
  }

  /**
   * Send security webhook for malicious access attempts
   */
  static async sendSecurityWebhook(request: NextRequest, user: AuthenticatedUser, action: string) {
    const webhookUrl = process.env.DISCORD_WEBHOOK_SECURITY;
    if (!webhookUrl) return;

    try {
      const now = new Date();
      const brazilTime = new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      }).format(now);

      const embed = {
        title: "⚠️ Tentativa de Acesso Malicioso Detectada",
        description: `Tentativa de acesso não autorizado: ${action}`,
        color: 0xFF0000,
        fields: [
          { name: "👤 Usuário", value: `${user.profile?.full_name || 'N/A'} (${user.id})`, inline: true },
          { name: "🌐 Rota", value: request.nextUrl.pathname, inline: true },
          { name: "⏰ Horário", value: brazilTime, inline: true },
          { name: "🌍 IP", value: request.headers.get('x-forwarded-for') || 'N/A', inline: true }
        ],
        timestamp: now.toISOString()
      };

      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] })
      });
    } catch (error) {
      console.error('Erro ao enviar webhook de segurança:', error);
    }
  }
}