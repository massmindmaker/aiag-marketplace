# SYNTHESIS — AIAG one-pager

**Bootstrapped:** 2026-04-26 from brain docs

## What it is

**AI-Aggregator (AIAG)** — российский B2B-маркетплейс AI-моделей с единым OpenAI-совместимым API, оплатой в рублях и 152-ФЗ-compliance. Hero pitch: «Any AI model. One API. Payment in ₽.»

**Двухсторонний рынок:**
- **Demand (primary):** разработчик/CTO небольшого SaaS из РФ, кому нужен Replicate/HuggingFace, но платить из РФ нельзя
- **Supply (secondary):** ML-инженер монетизирует модели через ML-конкурсы (Russian Kaggle) с revshare 70/30

## Current state (2026-04-26)

- **Stage:** Execution. ~37% MVP по объёму кода. Активная разработка ~1 неделя.
- **Shipped (merged in master):** Phase 1 Foundation (auth + 152-ФЗ consents), Phase 3 Design System (shadcn + tokens + a11y)
- **In flight (worktree branches):** Phase 2 Infrastructure (~90%), Phase 4 Gateway (~60%), Phase 5 Upstreams (~75%), Phase 6 Marketplace (~80%), Phase 7 Supply (~50%), Phase 8 Launch (started, agent died)
- **Backlog:** Phase 9 Foreign Entity (trigger MRR > 500k₽)
- **Tags:** v0.1.0-foundation, v0.1.1-foundation-complete, v0.2.0-design

## Architecture (locked)

- **Frontend:** Next.js 15 + shadcn/ui + Tailwind 4 (apps/web)
- **Gateway:** Hono on Bun (apps/gateway) — billing, routing, SSE streaming, 5 routing modes
- **Worker:** BullMQ on Bun (apps/worker) — eval-runner, payouts, settlement
- **DB:** Timeweb managed PostgreSQL 16 (D#12 — replaces Supabase)
- **Auth:** NextAuth v5 (D#12 — replaces Supabase Auth)
- **Storage:** Timeweb Cloud S3 via @aws-sdk/client-s3 (D#12)
- **Cache/queue:** Redis 7
- **Production:** Timeweb VPS bare-metal (D#13/D#14 — no Docker, no Dokploy)
  - apt-installed services + systemd + pm2 + nginx + certbot
  - Capistrano-style `/srv/aiag/{web,gateway,worker}/{releases,current}` + GH Actions SSH rsync deploy
- **Eval sandbox:** systemd-run + unshare + ulimit (D#13 exception, MVP). nsjail in v2.

## 14 ADRs

Full text: `.planning/intel/decisions.md`. Summary: `.planning/PROJECT.md`.

D#1 shadcn/Tailwind, D#2 Hono+Bun, D#3 ⚫superseded, D#4 credits PAYG, D#5 ⚫superseded,
D#6 proxy→GPU staged, D#7 predictions-only eval, D#8 upstream matrix, D#9 routing modes,
D#10 batch -50%, D#11 caching -50%, **D#12 no-Supabase**, **D#13 no-Docker**, **D#14 no-Dokploy**.

## Upstream matrix (locked, D#8)

| Category | Primary | Backup | Margin |
|---|---|---|---|
| Proprietary LLM (Claude/GPT/Gemini) | OpenRouter | direct (future) | 5–10% |
| Open-source LLM (Llama/Qwen/DeepSeek) | Together.ai | Groq | 10–20% |
| Fastest-mode LLM | Groq | Together | 15% |
| Media image (Flux/Kling/Seedream) | Fal.ai | Replicate, direct | 15–20% |
| Media video/audio (Veo/Runway/Suno) | Kie.ai | Fal | 15–25% |
| Community open models | Internal GPU (Fal hosted) | Replicate proxy | 20–30% (revshare) |
| RU-models (YandexGPT/GigaChat) | Direct | — | 5–10% |
| BYOK | Client | — | fixed 0.5 cred/req |

## Routing modes (locked, D#9)

`mode: auto / fastest / cheapest / balanced / ru-only` — explicit API parameter, dropped into `X-AIAG-Upstream` response header. Differentiator vs OpenRouter (`provider.order` is heavier).

## Pricing tiers (validated Van Westendorp, see brain/Knowledge/14)

Free / Basic 990 ₽ / Starter 2 490 ₽ / Pro 6 990 ₽ / Business 29 900 ₽ / Enterprise (custom)

Dual-bucket billing on subscriptions: subscription_credits (rolling 50%) + payg_credits (no expiry).

## Revshare (tiered, locked)

- 70% baseline (we host)
- 75% volume (≥100k ₽/mo for 3 mo)
- 80% self-hosted (author hosts)
- 85% exclusive self-hosted (12-mo exclusivity clause)

Monthly settlement (1st of month), payout ≥ 1000 ₽ minimum, 13% withholding for физлицо.

## Production VPS

- IP `5.129.200.99` (Timeweb ru-1, Ubuntu 24.04 LTS, 2GB RAM, 29GB disk)
- SSH `aiag-vps` (key-based, root)
- Tunnel for dev: `ssh -L 15432:127.0.0.1:5432 aiag-vps`
- Stack: PG 16.13 + Redis 7.0.15 + Nginx 1.24 + Node 24.14.1 + Bun 1.3.13 + pm2 6.0.14 + certbot 2.9
- БД: `aiag` (owner aiag), 26 таблиц применены (Plan 01)
- HTTPS active on apex `ai-aggregator.ru`. Subdomains `www.` / `api.` waiting on A-records in Beget.

## Open blockers

1. DNS — `www`/`api` A-records pending in Beget DNS
2. S3 bucket — `aiag-storage` not yet created (Timeweb Cloud, manual)
3. VPS RAM — recommended 2GB → 4GB upgrade before launch
4. Phase 8 agent died — needs resume
5. Plan 04 WIP commit needs splitting

## Brain docs (read-only intel)

- `brain/Projects/AIAG/_dashboard.md` — current state ground truth
- `brain/Projects/AIAG/RESUME-HERE.md` — last checkpoint
- `brain/Projects/AIAG/Specs/2026-04-18-aiag-mvp-design.md` — main MVP spec v2.1
- `brain/Projects/AIAG/Plans/2026-04-18-plan-0{1..9}-*.md` — 8 implementation plans + foreign entity outline
- `brain/Projects/AIAG/Knowledge/{01..20}-*.md` — positioning, business logic, decisions, pricing, routing, sitemap, bare-metal stack
- `brain/Projects/AIAG/Sessions/2026-04-24-*.md` — 6 session logs from architectural pivot day
