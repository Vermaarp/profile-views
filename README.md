# 👁️ Profile Views Counter

> Open-source, serverless, privacy-safe GitHub profile view counter with dynamic SVG badges.

![License](https://img.shields.io/badge/license-MIT-blue)
![Cloudflare Workers](https://img.shields.io/badge/hosted_on-Cloudflare_Workers-orange)
![Free](https://img.shields.io/badge/cost-100%25_free-brightgreen)

---

## ✨ Features

- 🔢 **Total views** + **unique visitors** + **daily stats**
- 🎨 **Fully customizable** — color, style, label, theme, format
- 🚫 **Bot filtering** — heuristic-based, no false positives
- 🛡️ **Rate limiting** — prevents artificial inflation
- 🔒 **Privacy-safe** — hashed IPs, no cookies, GDPR-friendly
- ⚡ **Edge-cached** — <100ms response when cached
- 🆓 **100% free** — Cloudflare Workers + KV free tier

---

## 🚀 Quick Embed

```markdown
![Profile Views](https://your-api.workers.dev/badge?user=YOUR_USERNAME)
```

---

## 📦 Deploy in 5 Minutes

### 1. Clone & install

```bash
git clone https://github.com/YOUR_USERNAME/profile-views
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
# Copy the KV namespace IDs printed, paste into wrangler.toml
```

### 4. Deploy

```bash
npm run deploy
# Your worker URL will be printed: https://profile-views.YOUR_SUBDOMAIN.workers.dev
```

### 5. Add to your README

```markdown
![Profile Views](https://profile-views.YOUR_SUBDOMAIN.workers.dev/badge?user=YOUR_USERNAME)
```

---

## ⚙️ Badge Query Parameters

| Param        | Default          | Options                                          | Description                     |
|--------------|------------------|--------------------------------------------------|---------------------------------|
| `user`       | *(required)*     | any GitHub username                              | Username to track               |
| `label`      | `Profile Views`  | any string                                       | Badge label text                |
| `color`      | `4c8eda`         | hex color (no #)                                 | Value background color          |
| `labelColor` | `555`            | hex color (no #)                                 | Label background color          |
| `style`      | `flat`           | `flat` `flat-square` `plastic` `for-the-badge`   | Badge style                     |
| `theme`      | `light`          | `light` `dark`                                   | Color theme                     |
| `format`     | `short`          | `short` `full`                                   | `1.2K` vs `1234`                |
| `type`       | `total`          | `total` `unique` `daily`                         | Which counter to display        |
| `counter`    | `default`        | any string                                       | Named counter (per-repo use)    |

---

## 📡 API Endpoints

### `GET /badge` — SVG badge
```
/badge?user=octocat&style=for-the-badge&color=2ea043
```

### `GET /api/v1/views` — JSON view count
```
/api/v1/views?user=octocat
```

### `GET /stats` — JSON analytics
```
/stats?user=octocat&days=14
```

### `GET /health` — Health check
```
/health
```

Full OpenAPI spec: [`docs/openapi.yaml`](docs/openapi.yaml)

---

## 🎨 Style Examples

| Style | Embed |
|---|---|
| `flat` | `![](https://your-api/badge?user=YOU&style=flat)` |
| `flat-square` | `![](https://your-api/badge?user=YOU&style=flat-square)` |
| `plastic` | `![](https://your-api/badge?user=YOU&style=plastic)` |
| `for-the-badge` | `![](https://your-api/badge?user=YOU&style=for-the-badge)` |

See full examples: [`examples/README-examples.md`](examples/README-examples.md)

---

## 🏗️ Project Structure

```
profile-views/
├── api/
│   ├── index.js            # Worker entry point & routing
│   ├── routes/
│   │   ├── badge.js        # SVG badge route
│   │   ├── stats.js        # JSON analytics route
│   │   └── health.js       # Health check
│   └── utils/
│       ├── bot-filter.js   # Bot detection heuristics
│       ├── rate-limit.js   # KV-backed rate limiter
│       └── response.js     # Response helpers
├── badge/
│   └── render.js           # SVG generation engine
├── db/
│   └── schema.md           # KV key schema documentation
├── docs/
│   └── openapi.yaml        # OpenAPI 3.1 specification
├── examples/
│   └── README-examples.md  # Badge embed examples
├── .github/
│   ├── workflows/ci.yml    # CI/CD pipeline
│   └── ISSUE_TEMPLATE/     # Bug & feature templates
├── wrangler.toml           # Cloudflare Workers config
└── package.json
```

---

## 🔐 Privacy & Security

- **No cookies** — zero tracking cookies
- **Hashed IPs** — IPs are one-way hashed (FNV-style), never stored raw
- **TTL'd data** — unique visit markers expire after 24h; daily stats after 7 days
- **GDPR-friendly** — no personal data stored
- **Bot filtering** — 25+ bot UA patterns blocked from inflating counts
- **Rate limiting** — max 5 increments per IP per username per hour

---

## 🐳 Self-Host with Docker (Optional)

A Docker variant using Node.js + Redis is available for self-hosting:

```bash
docker compose up
```

> See `docker/` directory (coming soon / community contribution welcome).

---

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) to get started.

- 🐛 [Report a bug](.github/ISSUE_TEMPLATE/bug_report.md)
- 💡 [Request a feature](.github/ISSUE_TEMPLATE/feature_request.md)

---

## 📄 License

MIT © — see [LICENSE](LICENSE)
