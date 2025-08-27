import { NextRequest, NextResponse } from 'next/server';
import { createCharge } from '@/lib/openpix';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { value, planName, customerData } = body;

    if (!value || !planName) {
      return NextResponse.json(
        { error: 'Valor e nome do plano são obrigatórios' },
        { status: 400 }
      );
    }

    const correlationID = uuidv4();
    
    const chargeData = {
      correlationID,
      value: value * 100, // Convertendo para centavos
      comment: `Pagamento do plano ${planName}`,
      customer: customerData
    };

    const charge = await createCharge(chargeData);

    return NextResponse.json(charge);
  } catch (error) {
    console.error('Erro ao criar cobrança:', error);
    return NextResponse.json(
      { error: 'Erro ao criar cobrança' },
      { status: 500 }
    );
  }
} 