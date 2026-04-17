# Profile Views

> Open-source, serverless, privacy-safe profile view counter with glass-style SVG badges. Runs entirely on **Deno Deploy** — no servers, no databases, no cost.

![License](https://img.shields.io/badge/license-MIT-blue)
![Runtime](https://img.shields.io/badge/runtime-Deno_Deploy-000000)
![Free](https://img.shields.io/badge/cost-free-brightgreen)
---

## Why self-host?

The point of this project is that **you deploy your own instance**. Don't embed someone else's URL in your README — the counter would be tracking you through their service. In 5 minutes you get your own `https://<your-project>.deno.net` and you own the data.

---

## Features

- Total views, unique visitors, and daily stats
- Glass-style SVG badges with gradient shimmer
- Path-based routing — clean URLs like `/badge/octocat`
- Bot filtering (heuristic-based)
- Rate limiting (5 increments per IP per user per hour)
- Hashed IPs, no cookies, GDPR-friendly
- Named sub-counters for per-repo tracking
- Zero dependencies beyond the Deno standard runtime

---

## Quick deploy (5 minutes)

### 1. Fork or clone

```bash
git clone https://github.com/Vermaarp/profile-views
cd profile-views
```

### 2. Install Deno (if you don't have it)

```bash
curl -fsSL https://deno.land/install.sh | sh
```

### 3. Run locally

```bash
deno task dev
# → http://localhost:8000
```

### 4. Deploy to Deno Deploy

1. Push your fork to GitHub.
2. Go to [dash.deno.com](https://dash.deno.com) → **New Project**.
3. Connect your GitHub repo, pick `main.ts` as the entrypoint.
4. Done. You get `https://<your-project>.deno.net`.

> If the first deploy fails with `Deno.openKv is not a function`, open your project's **Settings → KV Database** on Deno Deploy and provision a KV instance, then redeploy.

---

## Usage

Replace `<your-project>` with your actual Deno Deploy subdomain, and `<your-username>` with any GitHub username.

```markdown
![Profile Views](https://<your-project>.deno.net/badge/<your-username>)
```

### Colors

```markdown
![](https://<your-project>.deno.net/badge/<your-username>?color=blue)
![](https://<your-project>.deno.net/badge/<your-username>?color=green)
![](https://<your-project>.deno.net/badge/<your-username>?color=purple)
![](https://<your-project>.deno.net/badge/<your-username>?color=orange)
![](https://<your-project>.deno.net/badge/<your-username>?color=teal)
![](https://<your-project>.deno.net/badge/<your-username>?color=pink)
![](https://<your-project>.deno.net/badge/<your-username>?color=red)
```
### Preview

![Profile Views](https://profile-views.vermaarp.deno.net/badge/vermaarp?color=blue)
![Profile Views](https://profile-views.vermaarp.deno.net/badge/vermaarp?color=green)
![Profile Views](https://profile-views.vermaarp.deno.net/badge/vermaarp?color=purple)
![Profile Views](https://profile-views.vermaarp.deno.net/badge/vermaarp?color=orange)
![Profile Views](https://profile-views.vermaarp.deno.net/badge/vermaarp?color=teal)
![Profile Views](https://profile-views.vermaarp.deno.net/badge/vermaarp?color=pink)
![Profile Views](https://profile-views.vermaarp.deno.net/badge/vermaarp?color=red)


Or a custom hex: `?color=ff6b6b`.

### Other options

```markdown
<!-- Unique visitors -->
![](https://<your-project>.deno.net/badge/<your-username>?type=unique&label=Unique+Visitors)

<!-- Today's views, full number -->
![](https://<your-project>.deno.net/badge/<your-username>?type=daily&format=full&label=Today)

<!-- Per-repo counter -->
![](https://<your-project>.deno.net/badge/<your-username>?counter=my-repo&label=Repo+Views)
```

---

## API

| Endpoint | Description |
|---|---|
| `GET /badge/:user` | SVG badge |
| `GET /api/views/:user` | Current counts as JSON |
| `GET /api/stats/:user?days=7` | Daily history (up to 30 days) |
| `GET /health` | Health check |
| `GET /` | Endpoint index |

### Query parameters (badge)

| Param | Default | Options |
|---|---|---|
| `label` | `Profile Views` | any string |
| `color` | `blue` | `blue` `green` `purple` `orange` `teal` `pink` `red` or hex |
| `format` | `short` | `short` (1.2K) or `full` (1,234) |
| `type` | `total` | `total` `unique` `daily` |
| `counter` | *(none)* | any string — creates a separate sub-counter |

---

## Privacy

- **No cookies.** Ever.
- **Hashed IPs** — SHA-256 with a salt, truncated, never stored raw.
- **Short TTLs** — unique-visit markers expire after 24h, daily counters after 7 days, rate-limit windows after 1h.
- **No personal data** — nothing that could identify a visitor is persisted.

---

## KV schema

| Key | TTL | Value |
|---|---|---|
| `["views", scope]` | permanent | total view count |
| `["unique", scope]` | permanent | unique visitor count |
| `["daily", scope, "YYYY-MM-DD"]` | 7 days | daily view count |
| `["uniq", scope, hashedIP]` | 24h | unique-visit marker |
| `["rl", scope, hashedIP]` | 1h | rate-limit counter |

`scope` is `username` by default, or `username:counter` when the `counter` param is set.

---

## License

MIT
