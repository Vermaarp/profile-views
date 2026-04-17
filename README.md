# 👁️ Profile Views Counter

> Open-source, serverless, privacy-safe GitHub profile view counter with Apple-style glass SVG badges.

![License](https://img.shields.io/badge/license-MIT-blue)
![Cloudflare Workers](https://img.shields.io/badge/hosted_on-Cloudflare_Workers-orange)
![Free](https://img.shields.io/badge/cost-100%25_free-brightgreen)
![Profile Views](https://profile-views.vermaarp.workers.dev/badge?user=Vermaarp&color=blue)

---

## ✨ Features

- 🔢 **Total views** + **unique visitors** + **daily stats**
- 🍎 **Apple-style glass badge** — frosted glass effect with gradient shimmer
- 🎨 **Fully customizable** — color, label, format, type
- 🚫 **Bot filtering** — heuristic-based, no false positives
- 🛡️ **Rate limiting** — prevents artificial inflation
- 🔒 **Privacy-safe** — hashed IPs, no cookies, GDPR-friendly
- ⚡ **Edge-cached** — <100ms response when cached
- 🆓 **100% free** — Cloudflare Workers + KV free tier

---

## 🚀 Quick Embed

```markdown
![Profile Views](https://profile-views.vermaarp.workers.dev/badge?user=YOUR_USERNAME)
```

**Live demo** → [profile-views.vermaarp.workers.dev](https://profile-views.vermaarp.workers.dev)

---

## 🍎 Glass Badge Colors

| Color | Preview embed |
|-------|--------------|
| `blue` | `![](https://profile-views.vermaarp.workers.dev/badge?user=Vermaarp&color=blue)` |
| `green` | `![](https://profile-views.vermaarp.workers.dev/badge?user=Vermaarp&color=green)` |
| `purple` | `![](https://profile-views.vermaarp.workers.dev/badge?user=Vermaarp&color=purple)` |
| `orange` | `![](https://profile-views.vermaarp.workers.dev/badge?user=Vermaarp&color=orange)` |
| `teal` | `![](https://profile-views.vermaarp.workers.dev/badge?user=Vermaarp&color=teal)` |
| `pink` | `![](https://profile-views.vermaarp.workers.dev/badge?user=Vermaarp&color=pink)` |
| `red` | `![](https://profile-views.vermaarp.workers.dev/badge?user=Vermaarp&color=red)` |

---

## 📦 Deploy in 5 Minutes

### 1. Clone & install

```bash
git clone https://github.com/Vermaarp/profile-views
cd profile-views
npm install
```

### 2. Authenticate with Cloudflare

```bash
npx wrangler login
```

### 3. Create KV namespace

```bash
npm run kv:create
# Copy the two IDs printed and paste into wrangler.toml
```

### 4. Deploy

```bash
npm run deploy
# Live at: https://profile-views.YOUR_SUBDOMAIN.workers.dev
```

### 5. Add to your GitHub profile README

```markdown
![Profile Views](https://profile-views.YOUR_SUBDOMAIN.workers.dev/badge?user=YOUR_USERNAME&color=blue)
```

---

## ⚙️ Badge Query Parameters

| Param | Default | Options | Description |
|-------|---------|---------|-------------|
| `user` | *(required)* | any GitHub username | Username to track |
| `label` | `Profile Views` | any string | Badge label text |
| `color` | `blue` | `blue` `green` `purple` `orange` `teal` `pink` `red` or hex | Value gradient color |
| `format` | `short` | `short` `full` | `1.2K` vs `1,234` |
| `type` | `total` | `total` `unique` `daily` | Which counter to display |
| `counter` | `default` | any string | Named counter (per-repo use) |

---

## 📡 API Endpoints

### `GET /badge` — Glass SVG badge
```
https://profile-views.vermaarp.workers.dev/badge?user=Vermaarp&color=purple
```

### `GET /api/v1/views` — JSON view count
```
https://profile-views.vermaarp.workers.dev/api/v1/views?user=Vermaarp
```

### `GET /stats` — JSON analytics (up to 30 days)
```
https://profile-views.vermaarp.workers.dev/stats?user=Vermaarp&days=7
```

### `GET /health` — Health check
```
https://profile-views.vermaarp.workers.dev/health
```

Full OpenAPI spec: [`docs/openapi.yaml`](docs/openapi.yaml)

---

## 🎨 Badge Examples

```markdown
<!-- Blue glass (default) -->
![Profile Views](https://profile-views.vermaarp.workers.dev/badge?user=Vermaarp&color=blue)

<!-- Purple, unique visitors -->
![Unique Visitors](https://profile-views.vermaarp.workers.dev/badge?user=Vermaarp&color=purple&type=unique&label=Unique+Visitors)

<!-- Teal, today only -->
![Today](https://profile-views.vermaarp.workers.dev/badge?user=Vermaarp&color=teal&type=daily&label=Views+Today)

<!-- Green, full number -->
![Profile Views](https://profile-views.vermaarp.workers.dev/badge?user=Vermaarp&color=green&format=full)

<!-- Per-repo counter -->
![Repo Views](https://profile-views.vermaarp.workers.dev/badge?user=Vermaarp&counter=my-project&label=Repo+Views&color=orange)
```

---

## 🏗️ Project Structure

```
profile-views/
├── api/
│   ├── index.js              # Worker entry point & routing
│   ├── routes/
│   │   ├── badge.js          # SVG glass badge route
│   │   ├── stats.js          # JSON analytics route
│   │   ├── docs.js           # API docs route
│   │   └── health.js         # Health check
│   └── utils/
│       ├── bot-filter.js     # Bot detection (25+ patterns)
│       ├── rate-limit.js     # KV-backed rate limiter
│       └── response.js       # Response helpers & CORS
├── badge/
│   └── render.js             # Glass SVG generation engine
├── db/
│   └── schema.md             # KV key schema documentation
├── docs/
│   └── openapi.yaml          # OpenAPI 3.1 specification
├── examples/
│   └── README-examples.md    # Badge embed examples
├── .github/
│   ├── workflows/ci.yml      # CI/CD → auto deploy on push
│   └── ISSUE_TEMPLATE/       # Bug & feature templates
├── wrangler.toml             # Cloudflare Workers config
└── package.json
```

---

## 🔐 Privacy & Security

- **No cookies** — zero tracking cookies ever set
- **Hashed IPs** — one-way hashed, never stored raw
- **TTL'd data** — unique visit markers expire after 24h; daily stats after 7 days
- **GDPR-friendly** — no personal data stored at any point
- **Bot filtering** — 25+ bot UA patterns blocked from inflating counts
- **Rate limiting** — max 5 increments per IP per username per hour

---

## 📊 KV Storage Schema

| Key | TTL | Description |
|-----|-----|-------------|
| `views:{user}` | permanent | All-time total views |
| `unique:{user}` | permanent | All-time unique visitors |
| `uniq:{user}:{hashedIP}` | 24h | Unique visit marker |
| `daily:{user}:{YYYY-MM-DD}` | 7 days | Daily view count |
| `rl:{user}:{hashedIP}` | 1h | Rate limit counter |

---

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) to get started.

- 🐛 [Report a bug](.github/ISSUE_TEMPLATE/bug_report.md)
- 💡 [Request a feature](.github/ISSUE_TEMPLATE/feature_request.md)

---

## 📄 License

MIT © [Vermaarp](https://github.com/Vermaarp) — see [LICENSE](LICENSE)
