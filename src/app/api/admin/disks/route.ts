import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/middleware';
import diskController from '@/functions/database/controllers/DiskController';
import { AuthHybrid } from '@/lib/auth-hybrid';

export async function GET(req: NextRequest) {
    try {
        const user = await AuthHybrid.getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
        }
        const isAdmin = await AuthHybrid.isAdmin(user.id);

        if (!isAdmin) {
            console.warn(`Tentativa de acesso não autorizada - Admin Disks: ${user.id}`);
            return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type') || 'all';
        const userId = searchParams.get('userId');

        let data;

        switch (type) {
            case 'user-disks':
                if (userId) {
                    data = await diskController.getUserDisks(userId);
                } else {
                    data = await diskController.getAllUserDisks();
                }
                break;
            case 'vms':
                data = await diskController.getDiskVMs();
                break;
            case 'sessions':
                data = await diskController.getAllActiveSessions();
                break;
            case 'statistics':
                data = await diskController.getDiskStatistics();
                break;
            default:
                data = {
                    userDisks: await diskController.getAllUserDisks(),
                    vms: await diskController.getDiskVMs(),
                    activeSessions: await diskController.getAllActiveSessions(),
                    statistics: await diskController.getDiskStatistics()
                };
        }

        return NextResponse.json(data, { status: 200 });

    } catch (error) {
        console.error('Erro na API admin/disks:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor', message: error instanceof Error ? error.message : 'Erro desconhecido' },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await AuthHybrid.getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
        }
        const isAdmin = await AuthHybrid.isAdmin(user.id);

        if (!isAdmin) {
            console.warn(`Tentativa de criação não autorizada - Admin Disks: ${user.id}`);
            return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 403 });
        }

        const body = await req.json();
        const { type, ...data } = body;

        let result;

        switch (type) {
            case 'user-disk':
                // Se não foi especificado um snapshot, usar o padrão configurado
                if (!data.azure_snapshot_id) {
                    const defaultSnapshot = process.env.AZURE_MACHINE_SNAPSHOT_ID_WIN11;
                    if (defaultSnapshot) {
                        data.azure_snapshot_id = defaultSnapshot;
                        if (!data.notes) {
                            data.notes = `Disco criado pelo admin a partir do snapshot padrão: ${defaultSnapshot}`;
                        }
                    }
                }
                
                result = await diskController.createUserDisk({
                    ...data,
                    created_by_admin: user.id
                });
                break;
            case 'vm':
                result = await diskController.createDiskVM(data);
                break;
            default:
                return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });
        }

        return NextResponse.json(result, { status: 201 });

    } catch (error) {
        console.error('Erro ao criar recurso:', error);
        return NextResponse.json(
            { error: 'Erro ao criar recurso', message: error instanceof Error ? error.message : 'Erro desconhecido' },
            { status: 500 }
        );
    }
}

export async function PUT(req: NextRequest) {
    try {
        const user = await AuthHybrid.getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
        }
        const isAdmin = await AuthHybrid.isAdmin(user.id);

        if (!isAdmin) {
            console.warn(`Tentativa de atualização não autorizada - Admin Disks: ${user.id}`);
            return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 403 });
        }

        const body = await req.json();
        const { type, id, ...updates } = body;

        let result;

        switch (type) {
            case 'user-disk':
                result = await diskController.updateUserDisk(id, updates);
                break;
            case 'vm':
                result = await diskController.updateDiskVM(id, updates);
                break;
            case 'session-end':
                result = await diskController.endDiskSession(id, updates.reason);
                break;
            default:
                return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });
        }

        return NextResponse.json(result, { status: 200 });

    } catch (error) {
        console.error('Erro ao atualizar recurso:', error);
        return NextResponse.json(
            { error: 'Erro ao atualizar recurso', message: error instanceof Error ? error.message : 'Erro desconhecido' },
            { status: 500 }
        );
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const user = await AuthHybrid.getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
        }
        const isAdmin = await AuthHybrid.isAdmin(user.id);

        if (!isAdmin) {
            console.warn(`Tentativa de exclusão não autorizada - Admin Disks: ${user.id}`);
            return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type');
        const id = searchParams.get('id');

        if (!type || !id) {
            return NextResponse.json({ error: 'Parâmetros obrigatórios: type e id' }, { status: 400 });
        }

        switch (type) {
            case 'user-disk':
                await diskController.deleteUserDisk(id);
                break;
            case 'vm':
                await diskController.deleteDiskVM(id);
                break;
            default:
                return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });
        }

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error) {
        console.error('Erro ao deletar recurso:', error);
        return NextResponse.json(
            { error: 'Erro ao deletar recurso', message: error instanceof Error ? error.message : 'Erro desconhecido' },
            { status: 500 }
        );
    }
}