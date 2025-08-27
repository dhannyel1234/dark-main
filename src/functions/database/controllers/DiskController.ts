import { createClient } from '@/utils/supabase/server';

export interface UserDisk {
    id: string;
    created_at: string;
    updated_at: string;
    user_id: string;
    disk_name: string;
    azure_disk_id?: string;
    azure_snapshot_id?: string;
    status: 'available' | 'in_use' | 'maintenance' | 'reserved';
    size_gb: number;
    disk_type: string;
    last_used_at?: string;
    created_by_admin?: string;
    notes?: string;
}

export interface DiskVM {
    id: string;
    created_at: string;
    updated_at: string;
    name: string;
    azure_vm_id?: string;
    azure_vm_name?: string;
    location: string;
    vm_size: string;
    resource_group: string;
    status: 'available' | 'occupied' | 'maintenance' | 'offline';
    public_ip?: string;
    private_ip?: string;
    username: string;
    password: string;
    max_concurrent_users: number;
    current_users: number;
    last_maintenance_at?: string;
}

export interface DiskSession {
    id: string;
    created_at: string;
    updated_at: string;
    user_id: string;
    user_disk_id: string;
    vm_id: string;
    plan_id: number;
    status: 'active' | 'completed' | 'expired' | 'terminated';
    session_duration_minutes: number;
    started_at: string;
    expires_at: string;
    ended_at?: string;
    warning_10min_sent: boolean;
    warning_5min_sent: boolean;
    warning_1min_sent: boolean;
    last_activity_at?: string;
    termination_reason?: string;
}

const diskController = {
    // ===== USER DISKS =====
    
    async createUserDisk(data: Omit<UserDisk, 'id' | 'created_at' | 'updated_at'>): Promise<UserDisk> {
        const supabase = await createClient();
        const { data: disk, error } = await supabase
            .from('user_disks')
            .insert(data)
            .select()
            .single();

        if (error) throw new Error(`Erro ao criar disco: ${error.message}`);
        return disk;
    },

    async getUserDisks(userId: string): Promise<UserDisk[]> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('user_disks')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw new Error(`Erro ao buscar discos do usuário: ${error.message}`);
        return data || [];
    },

    async getUserDiskById(diskId: string): Promise<UserDisk | null> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('user_disks')
            .select('*')
            .eq('id', diskId)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw new Error(`Erro ao buscar disco: ${error.message}`);
        }
        return data;
    },

    async updateUserDisk(diskId: string, updates: Partial<UserDisk>): Promise<UserDisk> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('user_disks')
            .update(updates)
            .eq('id', diskId)
            .select()
            .single();

        if (error) throw new Error(`Erro ao atualizar disco: ${error.message}`);
        return data;
    },

    async deleteUserDisk(diskId: string): Promise<void> {
        const supabase = await createClient();
        const { error } = await supabase
            .from('user_disks')
            .delete()
            .eq('id', diskId);

        if (error) throw new Error(`Erro ao deletar disco: ${error.message}`);
    },

    async getAllUserDisks(): Promise<UserDisk[]> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('user_disks')
            .select(`
                *,
                profiles!user_disks_user_id_fkey(discord_username, avatar_url),
                created_by_admin:profiles!user_disks_created_by_admin_fkey(discord_username)
            `)
            .order('created_at', { ascending: false });

        if (error) throw new Error(`Erro ao buscar todos os discos: ${error.message}`);
        return data || [];
    },

    // ===== DISK VMS =====

    async createDiskVM(data: Omit<DiskVM, 'id' | 'created_at' | 'updated_at' | 'current_users'>): Promise<DiskVM> {
        const supabase = await createClient();
        const { data: vm, error } = await supabase
            .from('disk_vms')
            .insert({ ...data, current_users: 0 })
            .select()
            .single();

        if (error) throw new Error(`Erro ao criar VM: ${error.message}`);
        return vm;
    },

    async getDiskVMs(): Promise<DiskVM[]> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('disk_vms')
            .select('*')
            .order('name');

        if (error) throw new Error(`Erro ao buscar VMs: ${error.message}`);
        return data || [];
    },

    async getAvailableDiskVMs(): Promise<DiskVM[]> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('disk_vms')
            .select('*')
            .eq('status', 'available')
            .order('current_users'); // Prioriza VMs com menos usuários

        if (error) throw new Error(`Erro ao buscar VMs disponíveis: ${error.message}`);
        return data || [];
    },

    async getDiskVMById(vmId: string): Promise<DiskVM | null> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('disk_vms')
            .select('*')
            .eq('id', vmId)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw new Error(`Erro ao buscar VM: ${error.message}`);
        }
        return data;
    },

    async updateDiskVM(vmId: string, updates: Partial<DiskVM>): Promise<DiskVM> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('disk_vms')
            .update(updates)
            .eq('id', vmId)
            .select()
            .single();

        if (error) throw new Error(`Erro ao atualizar VM: ${error.message}`);
        return data;
    },

    async deleteDiskVM(vmId: string): Promise<void> {
        const supabase = await createClient();
        const { error } = await supabase
            .from('disk_vms')
            .delete()
            .eq('id', vmId);

        if (error) throw new Error(`Erro ao deletar VM: ${error.message}`);
    },

    // ===== DISK SESSIONS =====

    async createDiskSession(data: {
        user_id: string;
        user_disk_id: string;
        vm_id: string;
        plan_id: number;
        session_duration_minutes: number;
    }): Promise<DiskSession> {
        const supabase = await createClient();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + (data.session_duration_minutes * 60 * 1000));

        const sessionData = {
            ...data,
            status: 'active' as const,
            started_at: now.toISOString(),
            expires_at: expiresAt.toISOString(),
            warning_10min_sent: false,
            warning_5min_sent: false,
            warning_1min_sent: false,
            last_activity_at: now.toISOString()
        };

        const { data: session, error } = await supabase
            .from('disk_sessions')
            .insert(sessionData)
            .select()
            .single();

        if (error) throw new Error(`Erro ao criar sessão: ${error.message}`);

        // Atualizar status do disco para 'in_use'
        await diskController.updateUserDisk(data.user_disk_id, { 
            status: 'in_use',
            last_used_at: now.toISOString()
        });

        return session;
    },

    async getUserActiveSessions(userId: string): Promise<DiskSession[]> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('disk_sessions')
            .select(`
                *,
                user_disks(disk_name, status),
                disk_vms(name, public_ip, username, password),
                plans(name, session_duration_minutes)
            `)
            .eq('user_id', userId)
            .eq('status', 'active')
            .order('started_at', { ascending: false });

        if (error) throw new Error(`Erro ao buscar sessões ativas: ${error.message}`);
        return data || [];
    },

    async getDiskSessionById(sessionId: string): Promise<DiskSession | null> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('disk_sessions')
            .select(`
                *,
                user_disks(disk_name, status),
                disk_vms(name, public_ip, username, password),
                plans(name, session_duration_minutes),
                profiles(discord_username, avatar_url)
            `)
            .eq('id', sessionId)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw new Error(`Erro ao buscar sessão: ${error.message}`);
        }
        return data;
    },

    async endDiskSession(sessionId: string, reason?: string): Promise<DiskSession> {
        const supabase = await createClient();
        const session = await diskController.getDiskSessionById(sessionId);
        if (!session) {
            throw new Error('Sessão não encontrada');
        }

        const { data, error } = await supabase
            .from('disk_sessions')
            .update({
                status: 'completed',
                ended_at: new Date().toISOString(),
                termination_reason: reason
            })
            .eq('id', sessionId)
            .select()
            .single();

        if (error) throw new Error(`Erro ao finalizar sessão: ${error.message}`);

        // Libertar o disco
        await diskController.updateUserDisk(session.user_disk_id, { 
            status: 'available' 
        });

        return data;
    },

    async getExpiredSessions(): Promise<DiskSession[]> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('disk_sessions')
            .select('*')
            .eq('status', 'active')
            .lt('expires_at', new Date().toISOString());

        if (error) throw new Error(`Erro ao buscar sessões expiradas: ${error.message}`);
        return data || [];
    },

    async getSessionsNeedingWarnings(): Promise<{
        warning10min: DiskSession[];
        warning5min: DiskSession[];
        warning1min: DiskSession[];
    }> {
        const supabase = await createClient();
        const now = new Date();
        const in10min = new Date(now.getTime() + (10 * 60 * 1000));
        const in5min = new Date(now.getTime() + (5 * 60 * 1000));
        const in1min = new Date(now.getTime() + (1 * 60 * 1000));

        // Sessões que precisam de aviso de 10 minutos
        const { data: warning10min, error: error10 } = await supabase
            .from('disk_sessions')
            .select('*')
            .eq('status', 'active')
            .eq('warning_10min_sent', false)
            .lt('expires_at', in10min.toISOString());

        // Sessões que precisam de aviso de 5 minutos
        const { data: warning5min, error: error5 } = await supabase
            .from('disk_sessions')
            .select('*')
            .eq('status', 'active')
            .eq('warning_5min_sent', false)
            .lt('expires_at', in5min.toISOString());

        // Sessões que precisam de aviso de 1 minuto
        const { data: warning1min, error: error1 } = await supabase
            .from('disk_sessions')
            .select('*')
            .eq('status', 'active')
            .eq('warning_1min_sent', false)
            .lt('expires_at', in1min.toISOString());

        if (error10 || error5 || error1) {
            throw new Error('Erro ao buscar sessões que precisam de avisos');
        }

        return {
            warning10min: warning10min || [],
            warning5min: warning5min || [],
            warning1min: warning1min || []
        };
    },

    async markWarningAsSent(sessionId: string, warningType: '10min' | '5min' | '1min'): Promise<void> {
        const supabase = await createClient();
        const updateField = `warning_${warningType}_sent`;
        
        const { error } = await supabase
            .from('disk_sessions')
            .update({ [updateField]: true })
            .eq('id', sessionId);

        if (error) throw new Error(`Erro ao marcar aviso como enviado: ${error.message}`);
    },

    async getAllActiveSessions(): Promise<DiskSession[]> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('disk_sessions')
            .select(`
                *,
                user_disks(disk_name, status),
                disk_vms(name, public_ip),
                plans(name),
                profiles(discord_username, avatar_url)
            `)
            .eq('status', 'active')
            .order('started_at', { ascending: false });

        if (error) throw new Error(`Erro ao buscar todas as sessões ativas: ${error.message}`);
        return data || [];
    },

    async updateSessionActivity(sessionId: string): Promise<void> {
        const supabase = await createClient();
        const { error } = await supabase
            .from('disk_sessions')
            .update({ last_activity_at: new Date().toISOString() })
            .eq('id', sessionId);

        if (error) throw new Error(`Erro ao atualizar atividade da sessão: ${error.message}`);
    },

    // ===== STATISTICS =====

    async getDiskStatistics(): Promise<{
        totalDisks: number;
        availableDisks: number;
        disksInUse: number;
        totalVMs: number;
        availableVMs: number;
        occupiedVMs: number;
        activeSessions: number;
    }> {
        const supabase = await createClient();
        const [disksStats, vmsStats, sessionsStats] = await Promise.all([
            supabase.from('user_disks').select('status'),
            supabase.from('disk_vms').select('status'),
            supabase.from('disk_sessions').select('status').eq('status', 'active')
        ]);

        const disksData = disksStats.data || [];
        const vmsData = vmsStats.data || [];
        const sessionsData = sessionsStats.data || [];

        return {
            totalDisks: disksData.length,
            availableDisks: disksData.filter(d => d.status === 'available').length,
            disksInUse: disksData.filter(d => d.status === 'in_use').length,
            totalVMs: vmsData.length,
            availableVMs: vmsData.filter(v => v.status === 'available').length,
            occupiedVMs: vmsData.filter(v => v.status === 'occupied').length,
            activeSessions: sessionsData.length
        };
    }
};

export default diskController;