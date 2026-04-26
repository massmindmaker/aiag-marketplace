# Architecture — Bare-metal production stack

**Source:** `C:\Users\боб\brain\Projects\AIAG\Knowledge\20-bare-metal-stack.md`
**Status:** Final stack post D#12 + D#13 + D#14 (2026-04-24)

## VPS specs

- **Provider:** Timeweb Cloud Servers, регион `ru-1` (Москва, msk-1)
- **IP:** `5.129.200.99`
- **Hostname:** `msk-1-vm-3qhp`
- **OS:** Ubuntu 24.04 LTS
- **Kernel:** 6.8.0-107-generic
- **RAM:** 2 GB (план: upgrade до 4GB перед production)
- **Swap:** 2 GB
- **Disk:** 29 GB (18% used)
- **CPU:** 2 vCPU
- **Cost:** ~1200₽/мес @ 2GB → ~1900₽/мес @ 4GB

## Installed (всё apt/нативно)

| Component | Version | Source | Config |
|---|---|---|---|
| PostgreSQL | 16.13 | apt (PGDG repo) | `/etc/postgresql/16/main/{postgresql.conf,pg_hba.conf}` |
| Redis | 7.0.15 | apt | `/etc/redis/redis.conf` |
| Nginx | 1.24.0 | apt | `/etc/nginx/sites-available/*` |
| certbot | 2.9.x | apt + python3-certbot-nginx | `/etc/letsencrypt/` |
| Node.js | 24.14.1 | NodeSource | — |
| Bun | 1.3.13 | curl-installer (`~/.bun/bin/bun`) | — |
| pm2 | 6.0.14 | npm install -g pm2 | `/srv/aiag/shared/ecosystem.config.cjs` |
| pm2-logrotate | latest | pm2 install pm2-logrotate | — |
| fail2ban | apt | apt | `/etc/fail2ban/` |
| ufw | apt | apt | — |

**NOT installed:** Docker, Dokploy, Traefik, docker-compose.

## Connection pattern

### Production
- External access: only Nginx 80/443
- Postgres: `127.0.0.1:5432` only (via `listen_addresses` in postgresql.conf)
- Redis: `127.0.0.1:6379` only with `requirepass`
- SSH: key-based (`ssh aiag-vps` from `~/.ssh/config`)

### Dev (local with prod DB)
- SSH tunnel: `ssh -L 15432:127.0.0.1:5432 aiag-vps`
- Local `.env.local`: `DATABASE_URL=postgres://aiag:***@127.0.0.1:15432/aiag`

### Secrets
- VPS master: `/root/aiag-secrets.env` (chmod 600)
- Apps: `/srv/aiag/shared/.env.production` (chmod 600, owner aiag), symlinked from releases

## Directory layout (Capistrano-style)

```
/srv/aiag/
├── web/
│   ├── releases/
│   │   ├── <sha1>/         # build artifact
│   │   ├── <sha2>/
│   │   └── <shaN>/         # ≤ 5 latest, rest pruned
│   └── current -> releases/<sha>  # atomic symlink
├── gateway/
│   ├── releases/<sha>/
│   └── current -> releases/<sha>
├── worker/
│   ├── releases/<sha>/
│   └── current -> releases/<sha>
└── shared/
    ├── .env.production
    ├── ecosystem.config.cjs
    └── logs/               # pm2-logrotate output
```

## Process supervision

- **pm2** runs three apps: `aiag-web` (Next.js standalone), `aiag-gateway` (Hono), `aiag-worker` (BullMQ)
- `pm2 startup systemd` + `pm2 save` → systemd unit auto-starts pm2 daemon at boot
- `pm2 reload <id>` — zero-downtime reload (graceful SIGINT → spawn new → swap)
- Logs rotated by pm2-logrotate (daily, 14 files kept, gzip compress)
- Postgres / Redis / Nginx — native systemd units (`postgresql@16-main`, `redis-server`, `nginx`)

## Deploy pipeline (GitHub Actions)

`.github/workflows/deploy.yml` on merge to master:

1. Runner (ubuntu-latest): `bun install`, `bun run build` for each app (web / gateway / worker)
2. Pack build artifact → tar.gz
3. SSH rsync to VPS in `/srv/aiag/<app>/releases/<sha>/`
4. Symlink flip: `ln -sfn releases/<sha> current` (atomic)
5. `pm2 reload aiag-<app>` — zero-downtime
6. Health check `curl https://.../healthz`. If fail → rollback symlink to previous release + `pm2 reload`

**Rollback runbook:** `cd /srv/aiag/<app> && ln -sfn releases/<prev_sha> current && pm2 reload aiag-<app>`

## Nginx config

- `/etc/nginx/sites-available/ai-aggregator.ru.conf` → proxy_pass 127.0.0.1:3000 (web)
- `/etc/nginx/sites-available/api.ai-aggregator.ru.conf` → proxy_pass 127.0.0.1:4000 (gateway)
- SSL: `certbot --nginx -d ai-aggregator.ru -d api.ai-aggregator.ru`
- Gzip, security headers (HSTS, X-Frame-Options, CSP), rate-limit zones on `/api/` and `/auth/`

## Backup strategy

- `pg_dumpall` cron daily at 03:00 MSK → `/var/backups/aiag/pg/<date>.sql.gz`
- Retention: 7 daily + 4 weekly + 3 monthly
- Phase 2: sync to Timeweb Object Storage (S3) with encryption
- Config backup: `/etc/{postgresql,nginx,redis}` → daily tar in `/var/backups/aiag/etc/`

## Monitoring (Phase 8)

- `node_exporter` + `postgres_exporter` via apt + systemd (NOT Docker)
- Prometheus + Grafana + Loki — also as systemd services on separate VPS (when needed)
- `pm2 monit` for process-level metrics
- Alerts → Telegram via webhook

## 152-ФЗ compliance

- **Data residency:** все ПДн на Timeweb Cloud ru-1 (Москва). Не покидают РФ.
- **Backup residency:** Timeweb Object Storage (ru-1) — тот же оператор, тот же регион.
- **Encryption:** TLS 1.3 наружу (Nginx + certbot), TLS для Postgres optional (currently disabled, localhost only).
- **Audit log:** `/var/log/aiag/audit.log` (Phase 8), logrotate.
- **РКН-уведомление:** оператор ПДн — заявление подаётся на этапе Phase 8.

## Cost summary (MVP)

| Item | ₽/mo |
|---|---|
| VPS 2GB → 4GB | 1200 → 1900 |
| Object Storage (~10GB) | ~100-300 |
| Domain ai-aggregator.ru | ~40 (yearly amortized) |
| **Total** | **~1400–2300₽/mo** |

Previous (Supabase + Docker + Dokploy): ~2900₽/mo + ops overhead.

## Phase 2 triggers

- CPU/RAM stable >75% → migrate to k3s cluster 3× VPS
- Real need for Supabase Realtime (live leaderboard) or Edge Functions → return to Supabase self-hosted
- Docker for eval sandbox isolation in Phase 7 → enable Docker selectively, not as infra base

---
**See also:** `brain/Knowledge/19-pivot-no-supabase.md`, `brain/Knowledge/04-tech-stack-decisions.md` D#13/D#14, `brain/Plans/2026-04-18-plan-02-infrastructure.md`.
