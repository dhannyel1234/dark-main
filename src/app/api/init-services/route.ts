import { NextResponse } from 'next/server';
import { initializePlanExpirationService } from '@/lib/plan-expiration-service';

let isInitialized = false;

export async function GET() {
  if (!isInitialized) {
    initializePlanExpirationService();
    isInitialized = true;
    return NextResponse.json({ status: 'Serviços inicializados com sucesso' });
  }
  return NextResponse.json({ status: 'Serviços já estão inicializados' });
} 