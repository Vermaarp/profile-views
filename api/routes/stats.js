import { corsHeaders, errorResponse } from '../utils/response.js';
export async function handleStats(request, env) {
  const url = new URL(request.url);
  const username = url.searchParams.get('user')?.toLowerCase().trim();
  const days = Math.min(parseInt(url.searchParams.get('days') || '7', 10), 30);
  if (!username) return errorResponse(400, 'Missing ?user= param');
  const total = parseInt(await env.KV.get(`views:${username}`) || '0', 10);
  const unique = parseInt(await env.KV.get(`unique:${username}`) || '0', 10);
  const dailyStats = [];
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const count = parseInt(await env.KV.get(`daily:${username}:${dateStr}`) || '0', 10);
    dailyStats.unshift({ date: dateStr, views: count });
  }
  return new Response(JSON.stringify({ user: username, total_views: total, unique_visitors: unique, today: dailyStats.at(-1)?.views || 0, this_week: dailyStats.slice(-7).reduce((s,d)=>s+d.views,0), daily: dailyStats, generated_at: new Date().toISOString() }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' },
  });
}
