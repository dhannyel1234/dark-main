import { NextResponse, NextRequest } from "next/server";

import invoiceController from '@/functions/database/controllers/InvoiceController';
import machineController from '@/functions/database/controllers/MachineController';

export async function POST(req: NextRequest) {
  try {
    const machines = await machineController.findAll();

    for (const machine of machines) {
      if (new Date(machine?.plan.expirationDate) < new Date()) {
        const invoice = await invoiceController.find(machine.name);
        if (!invoice) {
          const id = Math.floor(Math.random() * Math.pow(10, 16)).toString();
          const expirationDate = new Date();
          expirationDate.setDate(expirationDate.getDate() + 3); // 3 days

          await invoiceController.create({
            id: id,
            machine_name: machine.name,
            expiration_date: expirationDate.toISOString(),
            owner_id: machine.ownerId
          });

          await machineController.update(machine.name, { opened_invoice: true });
        };

      };
    };

    return NextResponse.json({ message: "Processamento concluído com sucesso", support: "@sb4z7" }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: "Erro interno do servidor", support: "@sb4z7" }, { status: 500 });
  };
};