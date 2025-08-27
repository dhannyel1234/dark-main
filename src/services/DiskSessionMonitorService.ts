import diskController from '@/functions/database/controllers/DiskController';

class DiskSessionMonitorService {
    private intervalId: NodeJS.Timeout | null = null;
    private readonly CHECK_INTERVAL = 60 * 1000; // 1 minuto

    start() {
        if (this.intervalId) {
            console.log('DiskSessionMonitorService já está rodando');
            return;
        }

        console.log('Iniciando DiskSessionMonitorService...');
        this.intervalId = setInterval(() => {
            this.checkSessions();
        }, this.CHECK_INTERVAL);

        // Executar imediatamente na primeira vez
        this.checkSessions();
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            console.log('DiskSessionMonitorService parado');
        }
    }

    private async checkSessions() {
        try {
            await Promise.all([
                this.checkExpiredSessions(),
                this.sendWarnings()
            ]);
        } catch (error) {
            console.error('Erro no monitoramento de sessões:', error);
        }
    }

    private async checkExpiredSessions() {
        try {
            const expiredSessions = await diskController.getExpiredSessions();
            
            for (const session of expiredSessions) {
                console.log(`Finalizando sessão expirada: ${session.id}`);
                
                await diskController.endDiskSession(session.id, 'Sessão expirada automaticamente');
                
                // Log da sessão expirada
                console.log(`Sessão ${session.id} do usuário ${session.user_id} expirada e finalizada`);
            }

            if (expiredSessions.length > 0) {
                console.log(`${expiredSessions.length} sessões expiradas finalizadas`);
            }
        } catch (error) {
            console.error('Erro ao verificar sessões expiradas:', error);
        }
    }

    private async sendWarnings() {
        try {
            const warnings = await diskController.getSessionsNeedingWarnings();
            
            // Avisos de 10 minutos
            for (const session of warnings.warning10min) {
                await this.sendWarningNotification(session, '10 minutos');
                await diskController.markWarningAsSent(session.id, '10min');
            }

            // Avisos de 5 minutos
            for (const session of warnings.warning5min) {
                await this.sendWarningNotification(session, '5 minutos');
                await diskController.markWarningAsSent(session.id, '5min');
            }

            // Avisos de 1 minuto
            for (const session of warnings.warning1min) {
                await this.sendWarningNotification(session, '1 minuto');
                await diskController.markWarningAsSent(session.id, '1min');
            }

            const totalWarnings = warnings.warning10min.length + warnings.warning5min.length + warnings.warning1min.length;
            if (totalWarnings > 0) {
                console.log(`${totalWarnings} avisos de sessão enviados`);
            }
        } catch (error) {
            console.error('Erro ao enviar avisos:', error);
        }
    }

    private async sendWarningNotification(session: any, timeRemaining: string) {
        try {
            // Log do aviso (pode ser expandido para outros tipos de notificação)
            console.log(`Aviso para sessão ${session.id}: expira em ${timeRemaining} (${new Date(session.expires_at).toLocaleString('pt-BR')})`);
            
            // Aqui você pode implementar:
            // 1. Discord webhook
            // 2. Email
            // 3. Push notification
            // 4. SMS
            // 5. WebSocket para notificação em tempo real
            
        } catch (error) {
            console.error(`Erro ao enviar aviso para sessão ${session.id}:`, error);
        }
    }

    // Método para verificar status do serviço
    getStatus() {
        return {
            running: this.intervalId !== null,
            checkInterval: this.CHECK_INTERVAL,
            lastCheck: new Date().toISOString()
        };
    }

    // Método para forçar verificação manual
    async forceCheck() {
        console.log('Verificação manual de sessões iniciada...');
        await this.checkSessions();
        console.log('Verificação manual concluída');
    }
}

const diskSessionMonitorService = new DiskSessionMonitorService();
export default diskSessionMonitorService;