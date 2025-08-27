'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/utils/supabase/client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type Profile = {
    id: string;
    email: string | undefined;
    discord_id: string;
    profile: {
        discord_username: string;
        admin_level: 'user' | 'admin' | 'owner';
    } | null;
};

export default function PermissionsTab() {
    const { toast } = useToast();
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            try {
                const response = await fetch('/api/admin/users');
                if (!response.ok) throw new Error('Falha ao buscar usuários');
                const data = await response.json();
                setProfiles(data || []);
            } catch (error) {
                toast({ title: 'Erro ao buscar usuários', description: (error as Error).message, variant: 'destructive' });
            }
            setLoading(false);
        };

        fetchUsers();
    }, [toast]);
    const handleLevelChange = async (userId: string, newLevel: 'user' | 'admin' | 'owner') => {
        setUpdatingId(userId);
        const response = await fetch('/api/admin/set-level', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, level: newLevel }),
        });

        const result = await response.json();

        if (response.ok) {
            toast({ title: 'Sucesso', description: `Permissão de ${result.profile.discord_username} atualizada para ${newLevel}.` });
            setProfiles(profiles.map(p => p.id === userId ? { ...p, admin_level: newLevel } : p));
        } else {
            toast({ title: 'Erro', description: result.error || 'Não foi possível atualizar a permissão.', variant: 'destructive' });
        }
        setUpdatingId(null);
    };

    if (loading) {
        return <div>Carregando perfis...</div>;
    }

    const filteredProfiles = profiles.filter(user => {
        const term = searchTerm.toLowerCase();
        const idMatch = user.id.toLowerCase().includes(term);
        const discordIdMatch = user.discord_id?.toLowerCase().includes(term);
        const emailMatch = user.email?.toLowerCase().includes(term);
        return idMatch || discordIdMatch || emailMatch;
    });

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Gerenciamento de Permissões</h2>
            <p className="text-gray-400">
                Aqui você pode visualizar e alterar o nível de permissão de todos os usuários do sistema.
            </p>
            <div className="max-w-sm">
                <Input
                    placeholder="Pesquisar por ID, ID Discord ou Email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-gray-800 border-gray-700"
                />
            </div>
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>ID Usuário</TableHead>
                            <TableHead>ID Discord</TableHead>
                            <TableHead className="w-[200px]">Nível de Permissão</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredProfiles.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>{user.email}</TableCell>
                                <TableCell className="text-gray-400">{user.id}</TableCell>
                                <TableCell className="text-gray-400">{user.discord_id}</TableCell>
                                <TableCell>
                                    <Select
                                        value={user.profile?.admin_level || 'user'}
                                        onValueChange={(value: 'user' | 'admin' | 'owner') => handleLevelChange(user.id, value)}
                                        disabled={updatingId === user.id}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione o nível" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="user">Usuário</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                            <SelectItem value="owner">Owner</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}