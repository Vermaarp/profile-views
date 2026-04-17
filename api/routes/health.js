import { corsHeaders } from '../utils/response.js';
export async function handleHealth(request, env) {
  let kvOk = false;
  try { await env.KV.put('__health__', '1', { expirationTtl: 10 }); kvOk = true; } catch (_) {}
  return new Response(JSON.stringify({ status: kvOk ? 'ok' : 'degraded', kv: kvOk, timestamp: new Date().toISOString() }), {
    status: kvOk ? 200 : 503,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
