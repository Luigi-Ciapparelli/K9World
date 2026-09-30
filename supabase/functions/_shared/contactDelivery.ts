export type ContactKind = 'email' | 'phone';

export function normalizeContact(kind: ContactKind, value: string): string {
  const normalized = kind === 'email' ? value.trim().toLowerCase() : value.replace(/[\s().-]/g, '');
  if (kind === 'email' ? normalized.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) : !/^\+[1-9]\d{7,14}$/.test(normalized)) {
    throw new Error(kind === 'email' ? 'Inserisci un indirizzo email valido.' : 'Inserisci il numero con prefisso internazionale, per esempio +39.');
  }
  return normalized;
}

export function createContactCode(): string {
  const buffer = new Uint32Array(1);
  do { crypto.getRandomValues(buffer); } while (buffer[0] >= 4294000000);
  return String(buffer[0] % 1000000).padStart(6, '0');
}

export async function contactCodeHash(secret: string, user: string, id: string, part: 'target' | 'other', code: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signed = await crypto.subtle.sign('HMAC', key, encoder.encode(['pc-contact-v1',user,id,part,code].join(':')));
  return Array.from(new Uint8Array(signed), value => value.toString(16).padStart(2,'0')).join('');
}

export function deliveryConfigured(kind: ContactKind, env: (key: string) => string | undefined): boolean {
  return kind === 'email' ? Boolean(env('RESEND_API_KEY') && env('VERIFICATION_FROM_EMAIL'))
    : env('CONTACT_SMS_ENABLED') === 'true'
      && Boolean(env('TWILIO_ACCOUNT_SID') && env('TWILIO_AUTH_TOKEN') && env('TWILIO_FROM_NUMBER'));
}

export async function deliverContactCode(kind: ContactKind, target: string, code: string, purpose: 'verify' | 'authorize', env: (key: string) => string | undefined, request: typeof fetch = fetch): Promise<boolean> {
  if (!deliveryConfigured(kind, env)) return false;
  const instruction = purpose === 'authorize'
    ? 'Codice per autorizzare la modifica dell’altro recapito del tuo account PortaleCinofilo'
    : 'Codice per verificare questo recapito su PortaleCinofilo';
  const message = `${instruction}: ${code}. Scade tra 10 minuti. Non condividerlo. Se non hai richiesto questa operazione, ignora il messaggio.`;
  try {
    const response = kind === 'email'
      ? await request('https://api.resend.com/emails', { method: 'POST', signal: AbortSignal.timeout(12000),
        headers: { Authorization: `Bearer ${env('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: env('VERIFICATION_FROM_EMAIL'), to: [target], subject: 'PortaleCinofilo — conferma recapito', text: message }) })
      : await request(`https://api.twilio.com/2010-04-01/Accounts/${env('TWILIO_ACCOUNT_SID')}/Messages.json`, { method: 'POST', signal: AbortSignal.timeout(12000),
        headers: { Authorization: `Basic ${btoa(`${env('TWILIO_ACCOUNT_SID')}:${env('TWILIO_AUTH_TOKEN')}`)}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ To: target, From: env('TWILIO_FROM_NUMBER')!, Body: message }).toString() });
    return response.ok;
  } catch { return false; }
}
