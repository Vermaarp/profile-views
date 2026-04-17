import { renderSVG } from '../../badge/render.js';
import { isBot } from '../utils/bot-filter.js';
import { checkRateLimit } from '../utils/rate-limit.js';
import { corsHeaders, errorResponse } from '../utils/response.js';
function hashIP(ip) { let h=0; for(let i=0;i<ip.length;i++){h=((h<<5)-h)+ip.charCodeAt(i);h|=0;} return Math.abs(h).toString(36); }
export async function handleBadge(request, env, ctx) {
  const url = new URL(request.url);
  const params = url.searchParams;
  const username = params.get('user')?.toLowerCase().trim();
  if (!username) return errorResponse(400, 'Missing ?user= param');
  const options = { label: params.get('label')||'Profile Views', color: params.get('color')||'4c8eda', style: params.get('style')||'flat', theme: params.get('theme')||'light', format: params.get('format')||'short', type: params.get('type')||'total' };
  const bot = isBot(request.headers.get('User-Agent')||'');
  let count = parseInt(await env.KV.get(`views:${username}`) || '0', 10);
  if (!bot) {
    const clientIP = request.headers.get('CF-Connecting-IP')||'unknown';
    const limited = await checkRateLimit(env, `rl:${username}:${hashIP(clientIP)}`);
    if (!limited) {
      count += 1;
      ctx.waitUntil(env.KV.put(`views:${username}`, String(count)));
      const uniqueKey = `uniq:${username}:${hashIP(clientIP)}`;
      const isUnique = !(await env.KV.get(uniqueKey));
      if (isUnique) {
        const uCount = parseInt(await env.KV.get(`unique:${username}`)||'0',10)+1;
        ctx.waitUntil(Promise.all([env.KV.put(uniqueKey,'1',{expirationTtl:86400}),env.KV.put(`unique:${username}`,String(uCount))]));
      }
      const today = new Date().toISOString().slice(0,10);
      ctx.waitUntil(env.KV.get(`daily:${username}:${today}`).then(v=>env.KV.put(`daily:${username}:${today}`,String(parseInt(v||'0',10)+1),{expirationTtl:604800})));
    }
  }
  let display = count;
  if (options.type==='unique') display = parseInt(await env.KV.get(`unique:${username}`)||'0',10);
  if (options.type==='daily') { const t=new Date().toISOString().slice(0,10); display=parseInt(await env.KV.get(`daily:${username}:${t}`)||'0',10); }
  const svg = renderSVG(display, options);
  return new Response(svg, { headers: { ...corsHeaders, 'Content-Type': 'image/svg+xml', 'Cache-Control': bot ? 'public, max-age=300' : 'no-cache, no-store' } });
}
