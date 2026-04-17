// Profile Views — a serverless, privacy-safe view counter with glass-style SVG badges.
// Runs on Deno Deploy. Storage is Deno KV. No cookies, hashed IPs, GDPR-friendly.

const COLORS: Record<string, [string, string]> = {
  blue:   ["#3b82f6", "#2563eb"],
  green:  ["#22c55e", "#16a34a"],
  purple: ["#a855f7", "#8b5cf6"],
  orange: ["#f97316", "#ea580c"],
  teal:   ["#14b8a6", "#0d9488"],
  pink:   ["#ec4899", "#db2777"],
  red:    ["#ef4444", "#dc2626"],
};

const BOT_PATTERNS = [
  /bot/i, /crawler/i, /spider/i, /curl/i, /wget/i,
  /python/i, /Go-http/i, /PostmanRuntime/i, /axios/i, /node-fetch/i,
];

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const USERNAME_RE = /^[a-z0-9](?:[a-z0-9-]{0,37}[a-z0-9])?$/i;
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 3_600_000;
const UNIQUE_TTL_MS = 86_400_000;
const DAILY_TTL_MS = 604_800_000;

const kv = await Deno.openKv();

function isBot(ua: string): boolean {
  return !ua || ua.length < 10 || BOT_PATTERNS.some((p) => p.test(ua));
}

async function hashIP(ip: string): Promise<string> {
  const buf = new TextEncoder().encode(ip + "::profile-views");
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest).slice(0, 10))
    .map((b) => b.toString(16).padStart(2, "0")).join("");
}

function formatCount(n: number, fmt = "short"): string {
  if (fmt === "full") return n.toLocaleString("en-US");
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

function resolveColor(color: string): [string, string] {
  if (COLORS[color]) return COLORS[color];
  if (/^[0-9a-f]{3,8}$/i.test(color)) return [`#${color}`, `#${color}`];
  return COLORS.blue;
}

function escapeXML(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;",
  }[c]!));
}

function renderBadge(count: number, label: string, color: string, format: string): string {
  const value = formatCount(count, format);
  const safeLabel = escapeXML(label);
  const [c1, c2] = resolveColor(color);
  const H = 20;
  const avgW = 5.8;
  const padX = 7;
  const lw = Math.ceil(safeLabel.length * avgW) + padX * 2;
  const vw = Math.ceil(value.length * avgW) + padX * 2;
  const tw = lw + vw;
  const rx = H / 2;
  const ty = Math.round(H / 2 + 4);
  const gid = Math.random().toString(36).slice(2, 7);
  const font = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${tw}" height="${H}" role="img" aria-label="${safeLabel}: ${value}">
  <title>${safeLabel}: ${value}</title>
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
    <clipPath id="${gid}-c"><rect width="${tw}" height="${H}" rx="${rx}"/></clipPath>
  </defs>
  <g clip-path="url(#${gid}-c)">
    <rect width="${tw}" height="${H}" fill="rgba(20,20,30,0.85)"/>
    <rect width="${lw}" height="${H}" fill="rgba(255,255,255,0.07)"/>
    <rect x="${lw}" width="${vw}" height="${H}" fill="url(#${gid}-v)"/>
    <rect width="${tw}" height="${H}" fill="url(#${gid}-s)"/>
    <rect width="${tw}" height="${H / 2}" fill="url(#${gid}-t)"/>
    <rect x="${lw - 0.5}" width="1" height="${H}" fill="rgba(255,255,255,0.1)"/>
    <rect width="${tw}" height="${H}" rx="${rx}" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
  </g>
  <text x="${lw / 2}" y="${ty}" text-anchor="middle" font-family="${font}" font-size="11" font-weight="500" fill="rgba(255,255,255,0.72)">${safeLabel}</text>
  <text x="${lw + vw / 2}" y="${ty}" text-anchor="middle" font-family="${font}" font-size="11" font-weight="600" fill="#ffffff">${value}</text>
</svg>`.trim();
}

function json(data: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json", ...extra },
  });
}

async function getNum(key: Deno.KvKey): Promise<number> {
  const entry = await kv.get<number>(key);
  return entry.value ?? 0;
}

async function recordVisit(scope: string, hIP: string): Promise<void> {
  const rlKey = ["rl", scope, hIP];
  const rlCount = await getNum(rlKey);
  if (rlCount >= RATE_LIMIT) return;

  const today = new Date().toISOString().slice(0, 10);
  const uniqKey = ["uniq", scope, hIP];
  const isNewUnique = !(await kv.get(uniqKey)).value;

  const totalKey: Deno.KvKey = ["views", scope];
  const uniqueKey: Deno.KvKey = ["unique", scope];
  const dailyKey: Deno.KvKey = ["daily", scope, today];

  const [total, unique, daily] = await Promise.all([
    getNum(totalKey), getNum(uniqueKey), getNum(dailyKey),
  ]);

  const op = kv.atomic()
    .set(rlKey, rlCount + 1, { expireIn: RATE_WINDOW_MS })
    .set(totalKey, total + 1)
    .set(dailyKey, daily + 1, { expireIn: DAILY_TTL_MS });

  if (isNewUnique) {
    op.set(uniqueKey, unique + 1).set(uniqKey, 1, { expireIn: UNIQUE_TTL_MS });
  }

  await op.commit();
}

async function readCounts(scope: string) {
  const today = new Date().toISOString().slice(0, 10);
  const [total, unique, daily] = await Promise.all([
    getNum(["views", scope]),
    getNum(["unique", scope]),
    getNum(["daily", scope, today]),
  ]);
  return { total, unique, daily };
}

function normalizeUser(raw: string): string | null {
  const u = raw.toLowerCase().trim();
  return USERNAME_RE.test(u) ? u : null;
}

function scopeOf(username: string, counter: string | null): string {
  return counter ? `${username}:${counter}` : username;
}

async function handleBadge(req: Request, username: string): Promise<Response> {
  const url = new URL(req.url);
  const label   = url.searchParams.get("label")   ?? "Profile Views";
  const color   = url.searchParams.get("color")   ?? "blue";
  const format  = url.searchParams.get("format")  ?? "short";
  const type    = url.searchParams.get("type")    ?? "total";
  const counter = url.searchParams.get("counter");
  const scope   = scopeOf(username, counter);

  const ua = req.headers.get("user-agent") ?? "";
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const hIP = await hashIP(ip);
  const bot = isBot(ua);

  if (!bot) await recordVisit(scope, hIP);

  const { total, unique, daily } = await readCounts(scope);
  const display = type === "unique" ? unique : type === "daily" ? daily : total;
  const svg = renderBadge(display, label, color, format);

  return new Response(svg, {
    headers: {
      ...CORS,
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": bot ? "public, max-age=300" : "no-cache, no-store, must-revalidate",
    },
  });
}

async function handleViews(_req: Request, username: string, counter: string | null): Promise<Response> {
  const { total, unique, daily } = await readCounts(scopeOf(username, counter));
  return json({ user: username, counter: counter ?? "default", total, unique, daily });
}

async function handleStats(req: Request, username: string, counter: string | null): Promise<Response> {
  const url = new URL(req.url);
  const days = Math.min(Math.max(parseInt(url.searchParams.get("days") ?? "7", 10) || 7, 1), 30);
  const scope = scopeOf(username, counter);
  const { total, unique, daily } = await readCounts(scope);

  const history: Array<{ date: string; views: number }> = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    const date = d.toISOString().slice(0, 10);
    history.push({ date, views: await getNum(["daily", scope, date]) });
  }
  const thisWeek = history.slice(-7).reduce((s, d) => s + d.views, 0);

  return json({
    user: username,
    counter: counter ?? "default",
    total_views: total,
    unique_visitors: unique,
    today: daily,
    this_week: thisWeek,
    daily: history,
    generated_at: new Date().toISOString(),
  }, 200, { "Cache-Control": "public, max-age=60" });
}

function handleRoot(req: Request): Response {
  const origin = new URL(req.url).origin;
  return json({
    name: "profile-views",
    description: "Privacy-safe profile view counter with glass-style SVG badges.",
    source: "https://github.com/Vermaarp/profile-views",
    endpoints: {
      badge:  `${origin}/badge/:user`,
      views:  `${origin}/api/views/:user`,
      stats:  `${origin}/api/stats/:user?days=7`,
      health: `${origin}/health`,
    },
    badge_params: {
      label:   "string (default: Profile Views)",
      color:   "blue|green|purple|orange|teal|pink|red|<hex>",
      format:  "short|full",
      type:    "total|unique|daily",
      counter: "string — named sub-counter (per-repo)",
    },
  });
}

function handleHealth(): Response {
  return json({ status: "ok", timestamp: new Date().toISOString() });
}

function matchRoute(pathname: string): { route: string; user?: string } {
  if (pathname === "/" || pathname === "") return { route: "root" };
  if (pathname === "/health") return { route: "health" };

  const badge = pathname.match(/^\/badge\/([^/]+)\/?$/);
  if (badge) return { route: "badge", user: decodeURIComponent(badge[1]) };

  const views = pathname.match(/^\/api\/views\/([^/]+)\/?$/);
  if (views) return { route: "views", user: decodeURIComponent(views[1]) };

  const stats = pathname.match(/^\/api\/stats\/([^/]+)\/?$/);
  if (stats) return { route: "stats", user: decodeURIComponent(stats[1]) };

  return { route: "notfound" };
}

async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);

  const url = new URL(req.url);
  const { route, user: rawUser } = matchRoute(url.pathname);

  if (route === "root")   return handleRoot(req);
  if (route === "health") return handleHealth();

  if (route === "badge" || route === "views" || route === "stats") {
    const user = normalizeUser(rawUser ?? "");
    if (!user) return json({ error: "Invalid GitHub username" }, 400);
    const counter = url.searchParams.get("counter");

    try {
      if (route === "badge") return await handleBadge(req, user);
      if (route === "views") return await handleViews(req, user, counter);
      return await handleStats(req, user, counter);
    } catch (err) {
      console.error("handler error:", err);
      return json({ error: "Internal server error" }, 500);
    }
  }

  return json({ error: "Not found" }, 404);
}

Deno.serve(handler);
