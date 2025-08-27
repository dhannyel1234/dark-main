import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

class UsersController {
    async findAll() {
        const supabase = createAdminClient();

        // Busca todos os usuários da tabela auth.users (sem paginação para garantir que pegue todos)
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers({
            page: 1,
            perPage: 1000 // Aumenta o limite para pegar mais usuários
        });
        if (authError) throw authError;

        // Busca todos os perfis da tabela public.profiles
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('*');
        if (profilesError) throw profilesError;

        // Busca todos os planos de usuário ativos para verificar quem é assinante
        const { data: activeUserPlans, error: plansError } = await supabase
            .from('user_plans')
            .select('user_id')
            .eq('status', 'active');
        if (plansError) throw plansError;
        const subscriberIds = new Set(activeUserPlans.map(p => p.user_id));

        // Mapeia os perfis para um acesso mais rápido
        const profilesMap = new Map(profiles.map(p => [p.id, p]));

        // Combina os dados
        const combinedUsers = authUsers.users.map(user => {
            const profile = profilesMap.get(user.id);
            return {
                id: user.id,
                email: user.email,
                // O ID do Discord geralmente está no user_metadata
                discord_id: user.user_metadata?.provider_id || user.user_metadata?.sub || user.id,
                full_name: user.user_metadata?.full_name || user.user_metadata?.name,
                username: user.user_metadata?.preferred_username || user.user_metadata?.username,
                profile: profile ? {
                    username: profile.username,
                    full_name: profile.full_name,
                    avatar_url: profile.avatar_url,
                    admin_level: profile.admin_level,
                    website: profile.website,
                    created_at: profile.created_at,
                    updated_at: profile.updated_at
                } : null,
                has_active_plan: subscriberIds.has(user.id),
                created_at: user.created_at,
                last_sign_in_at: user.last_sign_in_at,
                providers: user.identities?.map(identity => identity.provider) || []
            };
        });

        return combinedUsers;
    }

    async findAllPaginated(page: number = 1, limit: number = 50, searchTerm: string = '') {
        const supabase = createAdminClient();

        console.log(`📄 Buscando usuários - Página ${page}, Limite ${limit}, Pesquisa: "${searchTerm}"`);

        // Se tem termo de pesquisa, precisamos buscar TODOS os usuários para filtrar
        if (searchTerm) {
            return await this.searchUsersPaginated(page, limit, searchTerm);
        }

        // Busca usuários com paginação normal
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers({
            page,
            perPage: limit
        });
        if (authError) throw authError;

        // Para contar o total, precisamos fazer uma busca sem limite
        const { data: allAuthUsers, error: countError } = await supabase.auth.admin.listUsers({
            page: 1,
            perPage: 1000 // Máximo permitido
        });
        if (countError) throw countError;

        // Busca todos os perfis (não há paginação na tabela profiles)
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('*');
        if (profilesError) throw profilesError;

        // Busca todos os planos de usuário ativos
        const { data: activeUserPlans, error: plansError } = await supabase
            .from('user_plans')
            .select('user_id')
            .eq('status', 'active');
        if (plansError) throw plansError;
        const subscriberIds = new Set(activeUserPlans.map(p => p.user_id));

        // Mapeia os perfis para um acesso mais rápido
        const profilesMap = new Map(profiles.map(p => [p.id, p]));

        // Combina os dados da página atual
        const combinedUsers = authUsers.users.map(user => {
            const profile = profilesMap.get(user.id);
            return {
                id: user.id,
                email: user.email,
                discord_id: user.user_metadata?.provider_id || user.user_metadata?.sub || user.id,
                full_name: user.user_metadata?.full_name || user.user_metadata?.name,
                username: user.user_metadata?.preferred_username || user.user_metadata?.username,
                profile: profile ? {
                    username: profile.username,
                    full_name: profile.full_name,
                    avatar_url: profile.avatar_url,
                    admin_level: profile.admin_level,
                    website: profile.website,
                    created_at: profile.created_at,
                    updated_at: profile.updated_at
                } : null,
                has_active_plan: subscriberIds.has(user.id),
                created_at: user.created_at,
                last_sign_in_at: user.last_sign_in_at,
                providers: user.identities?.map(identity => identity.provider) || []
            };
        });

        const totalUsers = allAuthUsers.users.length;
        const totalPages = Math.ceil(totalUsers / limit);

        console.log(`📊 Resultado: ${combinedUsers.length} usuários na página ${page} de ${totalPages}`);

        return {
            users: combinedUsers,
            pagination: {
                currentPage: page,
                totalPages,
                totalUsers,
                usersPerPage: limit,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1
            }
        };
    }

    async findByEmail(email: string) {
        const supabase = createAdminClient();
        
        console.log(`🔍 Buscando usuário por email: ${email}`);
        
        // Buscar no auth.users por email
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
        if (authError) {
            console.error('❌ Erro ao buscar auth users:', authError);
            throw authError;
        }
        
        const authUser = authUsers.users.find(u => u.email === email);
        console.log(`📧 Usuário encontrado no auth.users:`, authUser ? 'SIM' : 'NÃO');
        if (authUser) {
            console.log(`👤 Auth User ID: ${authUser.id}`);
            console.log(`📅 Criado em: ${authUser.created_at}`);
            console.log(`🔑 Último login: ${authUser.last_sign_in_at}`);
        }
        
        // Buscar profile se encontrou o usuário
        if (authUser) {
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authUser.id)
                .single();
                
            console.log(`👤 Profile encontrado:`, profile ? 'SIM' : 'NÃO');
            if (profileError) {
                console.log(`❌ Erro no profile: ${profileError.message}`);
            }
            
            return { authUser, profile, profileError };
        }
        
        return { authUser: null, profile: null, profileError: null };
    }

    async searchUsersPaginated(page: number, limit: number, searchTerm: string) {
        const supabase = createAdminClient();
        
        console.log(`🔍 Pesquisa paginada: "${searchTerm}" - Página ${page}`);
        
        // Buscar TODOS os usuários para fazer a filtragem (limitado a 1000)
        const { data: allAuthUsers, error: authError } = await supabase.auth.admin.listUsers({
            page: 1,
            perPage: 1000
        });
        if (authError) throw authError;

        // Busca todos os perfis
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('*');
        if (profilesError) throw profilesError;

        // Busca todos os planos de usuário ativos
        const { data: activeUserPlans, error: plansError } = await supabase
            .from('user_plans')
            .select('user_id')
            .eq('status', 'active');
        if (plansError) throw plansError;
        const subscriberIds = new Set(activeUserPlans.map(p => p.user_id));

        // Mapeia os perfis
        const profilesMap = new Map(profiles.map(p => [p.id, p]));

        // Combina e filtra TODOS os usuários
        const allCombinedUsers = allAuthUsers.users.map(user => {
            const profile = profilesMap.get(user.id);
            return {
                id: user.id,
                email: user.email,
                discord_id: user.user_metadata?.provider_id || user.user_metadata?.sub || user.id,
                full_name: user.user_metadata?.full_name || user.user_metadata?.name,
                username: user.user_metadata?.preferred_username || user.user_metadata?.username,
                profile: profile ? {
                    username: profile.username,
                    full_name: profile.full_name,
                    avatar_url: profile.avatar_url,
                    admin_level: profile.admin_level,
                    website: profile.website,
                    created_at: profile.created_at,
                    updated_at: profile.updated_at
                } : null,
                has_active_plan: subscriberIds.has(user.id),
                created_at: user.created_at,
                last_sign_in_at: user.last_sign_in_at,
                providers: user.identities?.map(identity => identity.provider) || []
            };
        });

        // Filtra por termo de pesquisa
        const term = searchTerm.toLowerCase();
        const filteredUsers = allCombinedUsers.filter(user => {
            const idMatch = user.id.toLowerCase().includes(term);
            const discordIdMatch = user.discord_id?.toLowerCase().includes(term);
            const emailMatch = user.email?.toLowerCase().includes(term);
            const usernameMatch = user.profile?.username?.toLowerCase().includes(term) || 
                                  user.username?.toLowerCase().includes(term);
            const fullNameMatch = user.profile?.full_name?.toLowerCase().includes(term) || 
                                  user.full_name?.toLowerCase().includes(term);
            
            return idMatch || discordIdMatch || emailMatch || usernameMatch || fullNameMatch;
        });

        // Aplicar paginação nos resultados filtrados
        const totalUsers = filteredUsers.length;
        const totalPages = Math.ceil(totalUsers / limit);
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

        console.log(`📊 Pesquisa resultado: ${paginatedUsers.length} usuários na página ${page} de ${totalPages} (total filtrado: ${totalUsers})`);

        return {
            users: paginatedUsers,
            pagination: {
                currentPage: page,
                totalPages,
                totalUsers,
                usersPerPage: limit,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1
            }
        };
    }

    async searchUsersByPartialEmail(partialEmail: string) {
        const supabase = createAdminClient();
        
        console.log(`🔍 Buscando usuários com email similar a: ${partialEmail}`);
        
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers({
            page: 1,
            perPage: 1000
        });
        if (authError) throw authError;
        
        const matchingUsers = authUsers.users.filter(u => 
            u.email?.toLowerCase().includes(partialEmail.toLowerCase())
        );
        
        console.log(`📧 Encontrados ${matchingUsers.length} usuários com email similar`);
        
        return matchingUsers.map(user => ({
            id: user.id,
            email: user.email,
            created_at: user.created_at,
            last_sign_in_at: user.last_sign_in_at,
            discord_username: user.user_metadata?.preferred_username || user.user_metadata?.username
        }));
    }

    async assignPlan(userId: string, planId: string) {
        const supabase = createAdminClient();
        // Lógica para buscar o plano e atribuir ao usuário
        // ... (Esta lógica precisaria ser implementada com base no seu schema)
        console.log(`Atribuindo plano ${planId} ao usuário ${userId}`);
        return { success: true };
    }

    async assignMachine(userId: string, machineName: string) {
        const supabase = createAdminClient();
        // Lógica para buscar a máquina e atribuir ao usuário
        // ... (Esta lógica precisaria ser implementada com base no seu schema)
        console.log(`Atribuindo máquina ${machineName} ao usuário ${userId}`);
        return { success: true };
    }
}

const usersController = new UsersController();
export default usersController;