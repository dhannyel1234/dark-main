import { NextRequest, NextResponse } from 'next/server';
import paymentController from '@/functions/database/controllers/PaymentController';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customId, name, email, checked_all, machine_created } = body;

    if (!customId) {
      return NextResponse.json(
        {
          message: 'Custom ID not defined',
          support: '@known.js'
        },
        { status: 400 }
      );
    }

    const updates = {
      plan: name,
      email,
      checked_all,
      machine_created
    };

    // Remove chaves com valor undefined para não atualizar campos desnecessariamente
    Object.keys(updates).forEach(key => updates[key as keyof typeof updates] === undefined && delete updates[key as keyof typeof updates]);

    const update = await paymentController.update(customId, updates);

    return NextResponse.json({ success: true, update }, { status: 200 });

  } catch (err) {
    return NextResponse.json(
      {
        message: "Database update failed",
        error: String(err),
        support: '@known.js'
      },
      { status: 500 }
    );
  }
}