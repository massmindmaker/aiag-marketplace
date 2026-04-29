# AIAG Admin Panel — Critical Views Phase 12 Design

**Date:** 2026-04-29
**Status:** Approved (option D, all 4 critical)
**Phase:** 12 (extends Phase 11 — 8 base pages already in flight)
**Author:** brainstormed with @b0brov

## Context

Phase 11 agent currently building 8 admin pages (users, orgs, upstreams, contests, payouts, settings, audit, webhooks). Brainstorm with owner identified **4 critical gaps** specific to AIAG's actual schema (48 tables, 7 real `gateway_transactions` from OpenRouter live calls, 55 models × 9 upstreams = 57 routing rows).

These gaps are required before soft-launch — without them owner cannot debug user issues, monitor business health, or manage live routing.

## Goals

1. **30-second triage** — when user says "запрос не работает", owner finds the request and root cause in 30 seconds
2. **Live routing control** — disable a single broken model→upstream route without taking the whole upstream down
3. **Business pulse** — open `/admin` and immediately see today's revenue, margin, active users
4. **Async job visibility** — see Kie video / Fal image jobs queue, retry/cancel stuck ones

## Non-goals

- Reviews moderation (Phase 13)
- PII detections compliance view (Phase 13)
- Subscriptions management UI (Phase 13)
- Granular per-org dashboards (covered by Phase 11 `/admin/orgs`)

## Architecture

Four new admin pages + extending `/admin` overview. All under `apps/web/src/app/admin/` route group with shared layout and `requireAdmin()` auth guard from Phase 11.

```
/admin                          (extended) Business dashboard hero
/admin/requests                 Gateway request/response inspector
/admin/routing                  model_upstreams matrix (per-route toggle/markup)
/admin/jobs                     Async prediction_jobs queue
```

## Components

### 1. Business Dashboard (`/admin` extension)

**Source tables:** `gateway_transactions`, `usage_stats_daily`, `subscriptions`, `users`, `orgs`, `upstream_health`

**Hero strip** (4 KPI cards):
- **Revenue today** (₽) — `SUM(amount_rub)` of today's `gateway_transactions WHERE type='settle'`
- **MRR** — `SUM(plan_price_rub)` of `subscriptions WHERE status='active'`
- **DAU / MAU** — `COUNT(DISTINCT user_id)` from `gateway_transactions` last 24h / 30d
- **Margin %** — `(revenue - upstream_cost) / revenue` last 24h

**Two charts:**
- Daily revenue line (last 30 days) — pre-aggregated from `usage_stats_daily`
- Top-10 spending orgs (bar) — `SUM by org_id` last 7d

**Two side panels:**
- **Health summary** — list of upstreams with red/green dot from latest `upstream_health` row
- **Recent activity** — last 10 events: signups, top-ups, key creations, refunds

### 2. Request Inspector (`/admin/requests`)

**Source tables:** `requests` (partitioned `requests_2026_04` / `_05` / etc), `responses`, `request_responses`, `pii_detections`

**Top filter bar:**
- Search by `request_id`, `org_id`, `user_email`, `model`, status
- Date range picker (default last 24h, max 30d to prevent expensive cross-partition scans)
- Status filter: success / 4xx / 5xx / timeout

**Table:** request_id (clickable), timestamp, user, org, model (resolved), upstream, status, latency_ms, cost_rub

**Drill-down modal** on row click:
- Full request body (sanitized — auth headers masked, content shown)
- Full response body (or error)
- Routing decision: which upstream picked + why (mode + score breakdown)
- PII detections triggered (if any)
- Cost calculation breakdown (input tokens × $/1k, USD→RUB rate, markup)
- Settle transaction (subscription credits used vs payg)

**Performance:** All queries scoped to single partition by date filter. Index on `(created_at, org_id)` and `(created_at, status)`.

### 3. Routing Matrix (`/admin/routing`)

**Source table:** `model_upstreams` (57 rows) — joined with `models` and `upstreams`

**Table layout** (one row per model_upstream pair):
- Model slug | Modality | Upstream | upstream_model_id | Priority | Markup | Status (enabled/disabled)
- Inline edit: priority number, markup %, enable toggle
- Bulk actions: disable all routes for a model, set markup for all routes via upstream

**Search/filter:** by modality, by upstream, by status

**Test button** per row: dispatches a tiny test request via gateway → returns latency + sample response or error. Useful when a route mysteriously fails.

**Add new route** form: select model + upstream + upstream_model_id + priority + markup → INSERT row. Validation: no duplicate (model_id, upstream_id) pair.

### 4. Async Jobs Monitor (`/admin/jobs`)

**Source table:** `prediction_jobs` (Fal/Replicate/Kie video/audio jobs)

**Table:** job_id (Kie format `kie:family:taskId`), status (queued/running/completed/failed/timeout), upstream, model, user, created_at, completed_at, output_url (if completed)

**Filters:** status, upstream, date range

**Per-job actions:**
- View payload (input prompt + parameters)
- View result (image/video preview if completed)
- Retry (re-queue in BullMQ `upstream-poll`)
- Cancel (set status='cancelled', stop polling)
- View polling history (timestamps of each poll attempt)

**Live counter at top:** "12 queued / 3 running / 156 completed today / 4 failed"

## Data flow

All 4 pages are server components reading directly from Drizzle. No new ORM models needed — all tables exist (Plan 04 + 05 + 07 + 08 schemas already migrated). Read-only except routing matrix (PATCH to model_upstreams).

Drill-down modals use server actions to fetch detail-level data (requests body) avoiding double-loading.

## Schema changes

None. All 4 pages query existing tables. The only optional addition:

- **Index** `CREATE INDEX IF NOT EXISTS idx_requests_created_status ON requests(created_at DESC, status)` — for fast filtering in inspector
- **Index** `CREATE INDEX IF NOT EXISTS idx_prediction_jobs_status ON prediction_jobs(status, created_at DESC)`

Optional migration `0012_admin_indexes.sql`.

## Auth & RBAC

Reuse `requireAdmin()` helper from Phase 11. Server actions for routing edits and job retries log to `audit_log` with action types: `routing.toggle`, `routing.update_markup`, `routing.add_route`, `job.retry`, `job.cancel`.

## Testing

Per page: 4-6 unit tests covering query filters + auth guards. Integration test for routing matrix PATCH idempotency. No new e2e tests (admin Playwright comes in Phase 13).

## Risks & mitigations

- **Risk:** Cross-partition scans in `/admin/requests` slow down DB
  - **Mitigation:** Hard cap date range to 30 days, default to 24h, query partition explicitly when possible
- **Risk:** Live test button on `/admin/routing` could leak prod credentials in logs
  - **Mitigation:** Test request goes through gateway with internal admin-only API key, response truncated to 500 chars
- **Risk:** Job retry could double-charge user
  - **Mitigation:** Settle is idempotent (transaction.idempotency_key), retry only re-polls — doesn't re-bill

## Out of scope

- Reviews moderation
- PII compliance view
- Per-user notifications log
- Eval runner scripts CRUD
- Notifications/email-send queue UIs

These go to Phase 13.
