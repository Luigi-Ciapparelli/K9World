import "jsr:@supabase/functions-js/edge-runtime.d.ts";
// Retired: no development OTP or legacy profile-flag mutation is accepted.
Deno.serve((req: Request) => new Response(req.method === 'OPTIONS' ? null : JSON.stringify({ error: 'Aggiorna la pagina e usa Email e telefono nel tuo account.' }), {
  status: req.method === 'OPTIONS' ? 204 : 410,
  headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
}));
