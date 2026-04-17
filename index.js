/**
 * GitHub Profile View Counter — Cloudflare Workers Entry Point
 * MIT License
 */

import { handleBadge } from './routes/badge.js';
import { handleStats } from './routes/stats.js';
import { handleHealth } from './routes/health.js';
import { handleDocs } from './routes/docs.js';
import { corsHeaders, errorResponse } from './utils/response.js';
import { isBot } from './utils/bot-filter.js';
import { checkRateLimit } from './utils/rate-limit.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname } = url;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Route matching
      if (pathname === '/' || pathname === '/docs') {
        return handleDocs(request, env);
      }

      if (pathname === '/health') {
        return handleHealth(request, env);
      }

      if (pathname.startsWith('/badge')) {
        return handleBadge(request, env, ctx);
      }

      if (pathname.startsWith('/stats')) {
        return handleStats(request, env, ctx);
      }

      if (pathname.startsWith('/api/v1/views')) {
        return handleViews(request, env, ctx);
      }

      return errorResponse(404, 'Route not found');
    } catch (err) {
      console.error('Unhandled error:', err);
      return errorResponse(500, 'Internal server error');
    }
  },
};

/**
 * POST /api/v1/views — increment counter + return JSON
 * GET  /api/v1/views — return current count
 */
async function handleViews(request, env, ctx) {
  const url = new URL(request.url);
  const username = url.searchParams.get('user')?.toLowerCase().trim();

  if (!username) {
    return errorResponse(400, 'Missing required query param: user');
  }
  if (!/^[a-z0-9](?:[a-z0-9-]{0,37}[a-z0-9])?$/i.test(username)) {
    return errorResponse(400, 'Invalid GitHub username format');
  }

  // Bot filtering
  const userAgent = request.headers.get('User-Agent') || '';
  if (isBot(userAgent)) {
    const count = await getCount(env, username);
    return jsonResponse({ user: username, views: count, unique: null, cached: true });
  }

  // Rate limiting (per IP per username)
  const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
  const rateLimitKey = `rl:${username}:${hashIP(clientIP)}`;
  const limited = await checkRateLimit(env, rateLimitKey);
  if (limited) {
    const count = await getCount(env, username);
    return jsonResponse({ user: username, views: count, unique: null, rate_limited: true });
  }

  // Increment total views
  const viewKey = `views:${username}`;
  const newCount = await env.KV.get(viewKey).then(v => parseInt(v || '0', 10) + 1);
  ctx.waitUntil(env.KV.put(viewKey, String(newCount)));

  // Track unique (hashed IP, TTL 24h)
  const uniqueKey = `uniq:${username}:${hashIP(clientIP)}`;
  const isUnique = !(await env.KV.get(uniqueKey));
  let uniqueCount = parseInt(await env.KV.get(`unique:${username}`) || '0', 10);
  if (isUnique) {
    uniqueCount += 1;
    ctx.waitUntil(Promise.all([
      env.KV.put(uniqueKey, '1', { expirationTtl: 86400 }),
      env.KV.put(`unique:${username}`, String(uniqueCount)),
    ]));
  }

  // Daily stats
  const today = new Date().toISOString().slice(0, 10);
  const dailyKey = `daily:${username}:${today}`;
  const dailyCount = parseInt(await env.KV.get(dailyKey) || '0', 10) + 1;
  ctx.waitUntil(env.KV.put(dailyKey, String(dailyCount), { expirationTtl: 604800 }));

  return jsonResponse({
    user: username,
    views: newCount,
    unique: uniqueCount,
    is_unique_visit: isUnique,
    daily: dailyCount,
  });
}

async function getCount(env, username) {
  return parseInt(await env.KV.get(`views:${username}`) || '0', 10);
}

function hashIP(ip) {
  // Simple hash for privacy — not reversible
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    hash = ((hash << 5) - hash) + ip.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
