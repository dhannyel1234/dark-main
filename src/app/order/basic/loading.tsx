import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-[#0a0f1a] to-[#10182a] text-white">
        <div className="flex items-center gap-3 text-xl font-semibold text-blue-300">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Carregando sua página de pagamento...</span>
        </div>
        <p className="mt-2 text-sm text-gray-400">Por favor, aguarde um momento.</p>
    </div>
  );
}