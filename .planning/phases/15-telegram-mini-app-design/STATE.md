# Phase 15 — Telegram Mini App (Design)

**Status:** Design complete (no code) — design refined per user 2026-05-08
**Started:** 2026-05-08
**Owner:** founder
**Type:** Design phase — produces spec + wireframes only.

## Position

Phase 15 of roadmap. Mini App + companion bot `@aiag_bot` as third product surface (web → web-app → TG). Crypto-first payments (TON Connect + Telegram Stars). Custom AI agents on Hermes 4 405B runtime.

## Outputs delivered

- [x] Spec markdown — `docs/superpowers/specs/2026-05-08-phase15-tg-miniapp-design.md`
- [x] Wireframes (11 files) — `C:\Users\боб\brain\Projects\AIAG\Wireframes\p15-tg-miniapp\`:
  - `01-onboarding.html`
  - `02-agents-list.html` (NEW — replaces deleted `02-manager-chat.html`)
  - `02b-agent-detail.html` (NEW)
  - `02c-agent-create.html` (NEW — 5-step wizard)
  - `03-marketplace.html`
  - `04-model-detail.html`
  - `05-balance-topup.html`
  - `06-ton-connect.html`
  - `07-payment-confirm.html`
  - `08-history.html`
  - `09-settings.html`
- [x] Schema additions proposed — `tg_users`, `ton_wallets`, `agents`, `agent_runs`. See spec §7.

## Refinement note (2026-05-08)

User reviewed initial Phase 15/16 specs and gave 6 directives — applied:

1. **Theme** — отказ от `var(--tg-theme-*)`, всё в dark `#0a0a0b` + amber `#f59e0b` per `Design/home.html` (Inter + JetBrains Mono).
2. **Scope cut** — Mini-App = marketplace + agent runtime + balance + history + settings. Конкурсы / supply / reviews — web-only.
3. **Bottom nav** — 3 tabs: **Агенты / Маркет / Профиль** (was Чат / Маркет / Профиль).
4. **Manager Bot → Agent Runtime** — replaced single-shot intent-parser with full agent runtime on Hermes 4 405B (NousResearch via OpenRouter). 6 prebuilt templates (Художник / Режиссёр / Композитор / Писатель / Аналитик / Свой).
5. **Hermes 4 architecture** — function-calling, BullMQ-driven `apps/agent-worker`, per-agent daily budget, 12-step cap, 5-min timeout, light/persist/stateless memory tiers.
6. **TON + x402 scope** — TG Mini App **only**. Web (`ai-aggregator.ru`) — Tinkoff/YooKassa/СБП only. x402 = протокол поверхности агентного слоя.

## Open questions (move into discuss-phase)

- OQ-1 Hermes 4 405B vs 70B for runtime — bench latency + tool-call quality
- OQ-2 Markup на Stars topups — fixed +35% или sliding scale
- OQ-3 Кто платит за `web_search` — fixed-fee к юзеру или поглощаем
- OQ-4 Memory persist (pgvector) — MVP или Phase 17
- OQ-5 TON Connect: только mainnet или offer testnet для dev/staging
