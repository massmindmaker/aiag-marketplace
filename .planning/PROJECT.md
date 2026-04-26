# AI-Aggregator (AIAG)

**Codename / slug:** `aiag`
**Domain:** ai-aggregator.ru
**Repo:** github.com/massmindmaker/aiag-marketplace
**Runtime:** claude (Claude Code)
**Bootstrapped from brain docs:** 2026-04-26 (active dev for ~1 week, ~37% MVP complete)

## What This Is

Российский B2B-маркетплейс AI-моделей с единым OpenAI-совместимым API, оплатой в рублях и 152-ФЗ-compliance — «Russian Replicate» с уникальной комбинацией закрытых LLM (через OpenRouter), open-source LLM (Together/Groq), медиа-моделей (Fal/Kie) и RU-LLM (YandexGPT, GigaChat) под одним ключом. Supply-side — открытые ML-конкурсы по образцу Kaggle с revshare 70/30 авторам моделей-победителей.

## Core Value

**Any AI model. One API. Payment in ₽.** — единая точка входа ко всем frontier и community AI-моделям с локализацией биллинга, данных и юр-обвязки под РФ. Если фейлится всё остальное, должно работать одно: разработчик из РФ платит рублями и получает API-доступ к нужной модели за минуты.

## Target Users

- **Primary (demand):** российский продуктовый разработчик / CTO небольшого SaaS (28–40 лет), которому нужна конкретная AI-модель и нет возможности платить Replicate/HF из РФ
- **Secondary (supply):** ML-инженер / senior разработчик, монетизирующий модели через конкурсы + revshare
- **Tertiary:** B2B-заказчик, спонсирующий конкурс под свою задачу

## Success Metric

MVP запущен на ai-aggregator.ru, есть платящие клиенты с пополнением рублями, выплачен первый payout автору модели-победителя конкурса (доказательство revshare-механики работает end-to-end).

## Requirements

### Validated

(merged в master, tagged)

- ✓ **Foundation (Phase 1)** — NextAuth v5 auth + 152-ФЗ consents schema + Drizzle migrations (26 таблиц) — `v0.1.1-foundation-complete`
- ✓ **Design System (Phase 3)** — shadcn/ui + Tailwind 4 + i18n + a11y primitives + layout/form/advanced компоненты (12/15) — `v0.2.0-design`

### Active

- [ ] **Phase 2: Infrastructure** — bare-metal VPS (Postgres 16, Redis 7, Nginx, certbot, pm2 6) — ~90% done, остался GH Actions deploy + e2e verify
- [ ] **Phase 4: Gateway v2** — billing dual-bucket + 5 routing modes + SSE + PII redaction + rate limit (Hono on Bun) — ~60% code, schema applied, 57/58 tests
- [ ] **Phase 5: Upstream Adapters** — 7 провайдеров (OpenRouter / Together / Groq / Fal / Kie / Yandex / direct) + BYOK + IAM token cache — ~75% code
- [ ] **Phase 6: Marketplace UI** — каталог моделей + playground + per-model SEO + image upload — ~80% code
- [ ] **Phase 7: Supply** — конкурсы + leaderboard + submissions + eval-runner (systemd-run + unshare + ulimits) + revshare + payouts — ~50% code
- [ ] **Phase 8: Launch** — legal (privacy/terms/РКН-уведомление) + monitoring stack (prometheus/grafana/loki bare-metal) + deploy pipeline + production smoke — started, agent died

### Out of Scope (Phase 1 MVP)

- **Foreign legal entity / международная экспансия** — Phase 9, триггер MRR > 500k₽
- **TG Mini App клиент** — после web-MVP
- **Decentralization / web3** — не релевантно для B2B-API
- **Полная MUI purge (7 legacy страниц)** — отложено в `plan-03b` post-MVP
- **Supabase (self-hosted и Cloud)** — superseded D#12 (Timeweb managed PG + NextAuth + S3)
- **Docker / Dokploy** — superseded D#13/D#14 (bare-metal apt + systemd + pm2 + nginx)
- **Realtime / WebSocket подписки в БД** — стриминг LLM покрывается SSE, реалтайм-конкурсы откладываем
- **Self-hosting model file submissions (формат 1)** — MVP принимает только predictions CSV/JSON
- **Свой GPU-пул** — этап 2, после первых winners конкурсов

## Context

**Стадия:** Execution — 2 фазы merged в master, 5 фаз активно в worktree-ветках, ~37% MVP завершено по объёму кода. Активная разработка ~1 неделя.

**Технический фундамент:**
- Monorepo: `apps/web` (Next.js 15) + `apps/gateway` (Hono on Bun) + `apps/worker` (BullMQ) + `packages/database` (Drizzle) + `packages/tinkoff` + `packages/shared`
- Workspace tool: pnpm + turborepo
- Tests: vitest + playwright (e2e)
- VPS production: `5.129.200.99` (Timeweb ru-1, Ubuntu 24.04, 2GB RAM, 29GB disk) — Postgres 16.13, Redis 7.0.15, Nginx 1.24, Node 24.14.1, Bun 1.3.13, pm2 6.0.14, certbot 2.9. БД `aiag` (26 таблиц применены).
- DNS: `ai-aggregator.ru` — apex A-record на VPS, HTTPS активен. `www.` и `api.` ждут A-records от пользователя в Beget DNS.
- Worktrees: master, exec/plan-04-gateway, exec/plan-05-upstreams, exec/plan-06-marketplace, exec/plan-07-supply, exec/plan-08-launch, exec/plan-03-design (merged kept)
- Tags: `v0.1.0-foundation`, `v0.1.1-foundation-complete`, `v0.2.0-design`

**Workflow switch:** этот `.planning/` создан 2026-04-26 при переходе с Superpowers workflow на GSD plugin. Источник правды для GSD — этот каталог. Архитектурные документы остаются в `C:\Users\боб\brain\Projects\AIAG\` (Specs/Plans/Knowledge/Sessions) и считаются readonly intel.

## Constraints

- **Compliance**: 152-ФЗ строгий — все ПДн физически в РФ (Timeweb ru-1), bank/auth/payment data не покидают периметр, обязательное согласие на обработку при регистрации (`consent_personal_data`, `consent_marketing`, `consent_terms`)
- **Tech stack — bare-metal**: D#13 — никакого Docker/Dokploy на production VPS, всё через apt + systemd + pm2 + nginx (RAM economy + ops simplicity)
- **Data residency**: D#12 — Timeweb managed PostgreSQL 16 + Timeweb Cloud S3 (ru-1), НЕ Supabase Cloud (AWS), НЕ Neon
- **Auth**: NextAuth v5 (а не Supabase Auth, не Clerk)
- **Gateway runtime**: Hono на Bun (~20–60k RPS на ядро, TS shared с Next.js)
- **Billing**: pay-as-you-go в credits (1 credit = 1 ₽), атомарное списание через `UPDATE WHERE balance ≥ cost RETURNING`. Подписки используют dual-bucket: `subscription_credits` (rolling) + `payg_credits` (не сгорают)
- **Routing API**: явный параметр `mode: auto / fastest / cheapest / balanced / ru-only` (дифференциатор vs OpenRouter)
- **Upstreams**: фиксированная матрица — Proprietary LLM → OpenRouter, Open LLM → Together (Groq backup), Media → Fal+Kie, RU → direct, BYOK → клиент
- **Discounts passthrough**: Batch API -50% и Prompt caching -50% передаются клиенту без нашей маржи (build trust)
- **Eval sandbox**: только predictions CSV/JSON в MVP. Untrusted code execution через `systemd-run` + `unshare` + `ulimit` (D#13 exception, не Docker)
- **Budget**: VPS ~1200–1900₽/мес + S3 ~100–300₽ + domain — целевой run-rate ~2300₽/мес для MVP
- **Currency risk**: USD→RUB фиксируется ежедневно по курсу ЦБ + 5% spread, в markup зашит буфер 5% на intra-day volatility

## Key Decisions

Все 14 ADR locked. Полный текст в `.planning/intel/decisions.md` (синхронизирован с `brain/Knowledge/04-tech-stack-decisions.md`).

| # | Область | Решение | Дата | Outcome |
|---|---------|---------|------|---------|
| D#1 | UI | shadcn/ui + Tailwind 4 + Supabase DS-stylings | 2026-04-18 | ✓ Phase 3 merged |
| D#2 | Gateway runtime | Hono на Bun (TS-monorepo, 3x Node performance) | 2026-04-18 | — Pending (Phase 4 in flight) |
| D#3 | DB (initial) | Self-hosted Supabase на Timeweb VPS | 2026-04-18 | ⚫ Superseded → D#12 |
| D#4 | Billing | Credits / токены pay-as-you-go (1 credit = 1 ₽), атомарное списание | 2026-04-18 | — Pending (Phase 4) |
| D#5 | Deploy (initial) | Timeweb VPS → Docker → K8s | 2026-04-18 | ⚫ Superseded → D#13/D#14 |
| D#6 | Хостинг моделей | Этап 1: проксирование (Replicate/Fal/Kie/Together). Этап 2: свой GPU-пул для winners | 2026-04-18 | — Pending |
| D#7 | Конкурс-eval | MVP — только predictions CSV/JSON. Model file (weights) → Phase 2 | 2026-04-18 | — Pending (Phase 7) |
| D#8 | Upstream mapping | OpenRouter (proprietary) / Together+Groq (open) / Fal+Kie (media) / Direct (RU) / BYOK | 2026-04-18 | — Pending (Phase 5) |
| D#9 | Routing modes | API-параметр `mode: auto / fastest / cheapest / balanced / ru-only` | 2026-04-18 | — Pending (Phase 4) |
| D#10 | Batch API | -50% discount, passthrough клиенту (не берём маржу) | 2026-04-18 | — Pending (Phase 4/5) |
| D#11 | Prompt caching | -50% на cached input tokens, passthrough клиенту | 2026-04-18 | — Pending (Phase 4/5) |
| D#12 | DB / Auth / Storage | Drop Supabase → Timeweb managed PG 16 + NextAuth v5 + Timeweb S3 (152-ФЗ + economy) | 2026-04-24 | ✓ Locked, applied to plans |
| D#13 | Containerization | Drop Docker entirely → bare-metal apt + systemd (RAM на 2GB VPS) | 2026-04-24 | ✓ Locked, Phase 2 ~90% |
| D#14 | PaaS / Deploy | Drop Dokploy → pm2 + nginx + GitHub Actions SSH rsync, Capistrano-style releases | 2026-04-24 | ✓ Locked, Phase 2 implementing |

---
*Last updated: 2026-04-26 after bootstrap from brain docs (switch from Superpowers to GSD)*
