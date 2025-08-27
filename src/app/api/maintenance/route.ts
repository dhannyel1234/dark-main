import { NextRequest, NextResponse } from 'next/server';
import MaintenanceController from '@/functions/database/controllers/MaintenanceController';
import AdminController from '@/functions/database/controllers/AdminController';

// GET - Obter status de manutenção
export async function GET() {
    try {
        const maintenance = await MaintenanceController.getStatus();
        return NextResponse.json(maintenance);
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao obter status de manutenção' }, { status: 500 });
    }
}

// POST - Atualizar status de manutenção (apenas para administradores)
export async function POST(request: NextRequest) {
    try {
        const { status, userId } = await request.json();
        
        // Verifica se o usuário é administrador
        const admin = await AdminController.findProfileById(userId);
        if (!admin) {
            return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 403 });
        }
        
        // Valida o status (deve ser 0 ou 1)
        if (status !== 0 && status !== 1) {
            return NextResponse.json({ error: 'Status inválido. Use 0 para desativar ou 1 para ativar a manutenção' }, { status: 400 });
        }
        
        const maintenance = await MaintenanceController.updateStatus(status);
        return NextResponse.json(maintenance);
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao atualizar status de manutenção' }, { status: 500 });
    }
}