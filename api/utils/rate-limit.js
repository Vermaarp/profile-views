export async function checkRateLimit(env, key) {
  try {
    const current = parseInt(await env.KV.get(key) || '0', 10);
    if (current >= 5) return true;
    await env.KV.put(key, String(current + 1), { expirationTtl: 3600 });
    return false;
  } catch (_) { return false; }
}
