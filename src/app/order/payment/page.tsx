import { Metadata } from "next";
import PaymentClient from "./payment-client";

export const metadata: Metadata = {
  title: "Pagamento - DarkCloud",
  description: "Página de pagamento da DarkCloud",
};

export default function PaymentPage({ searchParams }: any) {
  return <PaymentClient searchParams={searchParams} />;
}