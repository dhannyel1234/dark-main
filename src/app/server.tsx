const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
export default async function runTask() {
    await fetch(`${BASE_URL}/api/expirations/machine`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' }
    }).catch((err) => console.log('[Scheduler] Erro ao efetuá-lo.', err));
};