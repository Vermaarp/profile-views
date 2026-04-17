import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const COLORS: Record<string, [string, string]> = {
  blue:   ["#3b82f6", "#2563eb"],
  green:  ["#22c55e", "#16a34a"],
  purple: ["#a855f7", "#8b5cf6"],
  orange: ["#f97316", "#ea580c"],
  teal:   ["#14b8a6", "#0d9488"],
  pink:   ["#ec4899", "#db2777"],
  red:    ["#ef4444", "#dc2626"],
};

const BOT_PATTERNS = [/bot/i,/crawler/i,/spider/i,/curl/i,/wget/i,/python/i,/Go-http/i,/PostmanRuntime/i,/axios/i,/node-fetch/i];
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };

function isBot(ua: string) { return !ua || ua.length < 10 || BOT_PATTERNS.some(p => p.test(ua)); }

function hashIP(ip: string) {
  let h = 0;
  for (let i = 0; i < ip.length; i++) { h = ((h << 5) - h) + ip.charCodeAt(i); h |= 0; }
  return Math.abs(h).toString(36);
}

function formatCount(n: number, fmt = "short") {
  if (fmt === "full") return n.toLocaleString();
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

function resolveColor(color: string): [string, string] {
  return COLORS[color] ?? [`#${color}`, `#${color}`];
}

function renderSVG(count: number, label: string, color: string, format: string) {
  const value = formatCount(count, format);
  const [c1, c2] = resolveColor(color);
  const H = 28, avgW = 7.2;
  const lw = Math.ceil(label.length * avgW) + 30;
  const vw = Math.ceil(value.length * avgW) + 30;
  const tw = lw + vw;
  const ty = 18;
  const gid = Math.random().toString(36).slice(2, 7);
  const font = `-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${tw}" height="${H}" role="img" aria-label="${label}: ${value}">
  <title>${label}: ${value}</title>
  <defs>
    <linearGradient id="${gid}-v" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
    <linearGradient id="${gid}-s" x2="0" y2="1">
      <stop offset="0%" stop-color="#fff" stop-opacity="0.22"/>
      <stop offset="50%" stop-color="#fff" stop-opacity="0.04"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.1"/>
    </linearGradient>
    <linearGradient id="${gid}-t" x2="0" y2="1">
      <stop offset="0%" stop-color="#fff" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <clipPath id="${gid}-c"><rect width="${tw}" height="${H}" rx="14"/></clipPath>
  </defs>
  <g clip-path="url(#${gid}-c)">
    <rect width="${tw}" height="${H}" fill="rgba(20,20,30,0.85)"/>
    <rect width="${lw}" height="${H}" fill="rgba(255,255,255,0.07)"/>
    <rect x="${lw}" width="${vw}" height="${H}" fill="url(#${gid}-v)"/>
    <rect width="${tw}" height="${H}" fill="url(#${gid}-s)"/>
    <rect width="${tw}" height="${H / 2}" fill="url(#${gid}-t)"/>
    <rect x="${lw - 0.5}" width="1" height="${H}" fill="rgba(255,255,255,0.1)"/>
    <rect width="${tw}" height="${H}" rx="14" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
  </g>
  <text x="${lw / 2}" y="${ty}" text-anchor="middle" font-family="${font}" font-size="12" font-weight="500" fill="rgba(255,255,255,0.72)">${label}</text>
  <text x="${lw + vw / 2}" y="${ty}" text-anchor="middle" font-family="${font}" font-size="12" font-weight="600" fill="#ffffff">${value}</text>
</svg>`.trim();
}

async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const { pathname } = url;

  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  if (pathname === "/health") {
    return new Response(JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  if (pathname === "/" || pathname === "/docs") {
    return new Response(JSON.stringify({
      name: "profile-views",
      version: "1.0.0",
      endpoints: { badge: "/badge?user=USERNAME", stats: "/stats?user=USERNAME&days=7", health: "/health" },
    }), { headers: { ...CORS, "Content-Type": "application/json" } });
  }

  if (pathname === "/badge" || pathname === "/stats" || pathname === "/api/v1/views") {
    const username = url.searchParams.get("user")?.toLowerCase().trim();
    if (!username) return new Response(JSON.stringify({ error: "Missing ?user= param" }), { status: 400, headers: { ...CORS, "Content-Type": "application/json" } });

    const label  = url.searchParams.get("label")  || "Profile Views";
    const color  = url.searchParams.get("color")  || "blue";
    const format = url.searchParams.get("format") || "short";
    const type   = url.searchParams.get("type")   || "total";

    const ua  = req.headers.get("user-agent") || "";
    const bot = isBot(ua);
    const ip  = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    const hIP = hashIP(ip);

    const kv = await Deno.openKv();

    // Increment if real visitor
    if (!bot && pathname !== "/stats") {
      const rlKey = ["rl", username, hIP];
      const rlEntry = await kv.get<number>(rlKey);
      const rlCount = rlEntry.value ?? 0;

      if (rlCount < 5) {
        await kv.atomic()
          .set(rlKey, rlCount + 1, { expireIn: 3_600_000 })
          .commit();

        const viewKey = ["views", username];
        const current = (await kv.get<number>(viewKey)).value ?? 0;
        await kv.set(viewKey, current + 1);

        const uniqKey = ["uniq", username, hIP];
        const seen = await kv.get(uniqKey);
        if (!seen.value) {
          await kv.set(uniqKey, 1, { expireIn: 86_400_000 });
          const uKey = ["unique", username];
          const uCount = (await kv.get<number>(uKey)).value ?? 0;
          await kv.set(uKey, uCount + 1);
        }

        const today = new Date().toISOString().slice(0, 10);
        const dKey = ["daily", username, today];
        const dCount = (await kv.get<number>(dKey)).value ?? 0;
        await kv.set(dKey, dCount + 1, { expireIn: 604_800_000 });
      }
    }

    // Read counts
    const total  = (await kv.get<number>(["views", username])).value ?? 0;
    const unique = (await kv.get<number>(["unique", username])).value ?? 0;
    const today  = new Date().toISOString().slice(0, 10);
    const daily  = (await kv.get<number>(["daily", username, today])).value ?? 0;

    if (pathname === "/stats") {
      const days = Math.min(parseInt(url.searchParams.get("days") || "7", 10), 30);
      const dailyStats = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        const count = (await kv.get<number>(["daily", username, dateStr])).value ?? 0;
        dailyStats.push({ date: dateStr, views: count });
      }
      return new Response(JSON.stringify({ user: username, total_views: total, unique_visitors: unique, today: daily, this_week: dailyStats.slice(-7).reduce((s, d) => s + d.views, 0), daily: dailyStats, generated_at: new Date().toISOString() }), {
        headers: { ...CORS, "Content-Type": "application/json", "Cache-Control": "public, max-age=60" },
      });
    }

    if (pathname === "/api/v1/views") {
      return new Response(JSON.stringify({ user: username, views: total, unique, daily }), {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // Badge
    const display = type === "unique" ? unique : type === "daily" ? daily : total;
    const svg = renderSVG(display, label, color, format);
    return new Response(svg, {
      headers: { ...CORS, "Content-Type": "image/svg+xml", "Cache-Control": bot ? "public, max-age=300" : "no-cache, no-store" },
    });
  }

  return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { ...CORS, "Content-Type": "application/json" } });
}

serve(handler);
