# Requirements: AI-Aggregator (AIAG)

**Defined:** 2026-04-26 (synthesized from spec v2.1 + 8 plan documents)
**Source:** `brain/Specs/2026-04-18-aiag-mvp-design.md` + `brain/Plans/2026-04-18-plan-0{1..8}-*.md`
**Core Value:** Any AI model. One API. Payment in ₽.

## v1 Requirements (MVP)

### Authentication & 152-ФЗ Consents

- [x] **REQ-AUTH-001**: User can register with email + password (Phase 1, merged)
- [x] **REQ-AUTH-002**: NextAuth v5 session persists across requests (Phase 1, merged)
- [x] **REQ-AUTH-003**: Registration captures три согласия — `consent_personal_data`, `consent_marketing`, `consent_terms` с timestamp (Phase 1, merged)
- [x] **REQ-AUTH-004**: Drizzle migration provisions `users`, `accounts`, `sessions`, `verification_tokens` tables for NextAuth + consent fields (Phase 1, merged)
- [ ] **REQ-AUTH-005**: User can sign in with Google / GitHub OAuth (Phase 1 partial — providers configured, end-to-end verify pending)
- [ ] **REQ-AUTH-006**: User can request password reset via emailed link (Phase 1 deferred to post-deploy smoke)
- [ ] **REQ-AUTH-007**: API key authentication on Gateway — `Authorization: Bearer sk_aiag_xxx` resolves to `org_id` + scopes (Phase 4)
- [ ] **REQ-AUTH-008**: API key revocation propagates to gateway in <1s via Redis cache invalidation (Phase 4)
- [ ] **REQ-AUTH-009**: Email verification grants +100 credits welcome bonus (Phase 4)

### Gateway Billing & Routing

- [ ] **REQ-GATE-001**: Atomic credit settlement — `UPDATE orgs SET balance = balance - cost WHERE id = ? AND balance >= cost RETURNING` ensures `balance ≥ 0` invariant (Phase 4)
- [ ] **REQ-GATE-002**: Dual-bucket billing — subscription_credits drained first, then payg_credits, with overage modes (soft block / auto pay-go rollover / auto-topup / invoice) (Phase 4)
- [ ] **REQ-GATE-003**: Subscription credits 50% rollover to next month, capped at plan × 1 (Phase 4)
- [ ] **REQ-GATE-004**: PAYG credits never expire except 12-month rule on large topups (Phase 4)
- [ ] **REQ-GATE-005**: Routing mode `auto` selects upstream by model availability + balanced score (Phase 4)
- [ ] **REQ-GATE-006**: Routing mode `fastest` minimizes p50 latency, ignoring price (Phase 4)
- [ ] **REQ-GATE-007**: Routing mode `cheapest` minimizes price × markup, ignoring latency (Phase 4)
- [ ] **REQ-GATE-008**: Routing mode `balanced` uses `0.5 × price + 0.3 × latency + 0.2 × uptime` formula (Phase 4)
- [ ] **REQ-GATE-009**: Routing mode `ru-only` restricts to upstreams with RU data residency (YandexGPT, GigaChat, internal) (Phase 4)
- [ ] **REQ-GATE-010**: Response includes `X-AIAG-Upstream` header showing actual upstream used (Phase 4)
- [ ] **REQ-GATE-011**: SSE streaming for LLM responses, with token-level metering on stream finish (Phase 4)
- [ ] **REQ-GATE-012**: Rate limiting — Redis token bucket per API key, returns 429 + `Retry-After` (Phase 4)
- [ ] **REQ-GATE-013**: Daily burn rate cap — 50% on Basic/Starter, 80% Growth/Pro, 100% Business (Phase 4)
- [ ] **REQ-GATE-014**: Insufficient balance returns 402 Payment Required + topup URL (Phase 4)
- [ ] **REQ-GATE-015**: PII redaction in logs — emails, phone numbers, API keys masked before storage (Phase 4)
- [ ] **REQ-GATE-016**: Batch API endpoint `/v1/batches` with -50% pricing passthrough (Phase 4)
- [ ] **REQ-GATE-017**: Prompt caching support — `cache_control` markers respected, cached input tokens billed at 50% (Phase 4)
- [ ] **REQ-GATE-018**: USD→RUB rate fixed daily 09:00 UTC by CBR + 2% spread (Phase 4)
- [ ] **REQ-GATE-019**: Idempotent payment webhooks — `transaction_id` unique constraint (Phase 4)

### Upstream Adapters

- [ ] **REQ-UPST-001**: Common `UpstreamAdapter` interface — `supports / estimateCost / invoke (streaming) / healthCheck` (Phase 5)
- [ ] **REQ-UPST-002**: OpenRouter adapter handles proprietary LLM (Claude, GPT, Gemini) (Phase 5)
- [ ] **REQ-UPST-003**: Together.ai adapter handles open-source LLM with native Batch API (Phase 5)
- [ ] **REQ-UPST-004**: Groq adapter for fastest-mode (Llama 8B, gpt-oss, Whisper 228× RT) (Phase 5)
- [ ] **REQ-UPST-005**: Fal.ai adapter for media (Flux, Kling, Seedream, Nano Banana, Wan, Whisper) (Phase 5)
- [ ] **REQ-UPST-006**: Kie.ai adapter for media exclusives (Veo 3, Runway Aleph, Suno V4.5) (Phase 5)
- [ ] **REQ-UPST-007**: Yandex direct adapter — IAM token caching, YandexGPT Lite/Pro/Pro 5.1, Alice AI (Phase 5)
- [ ] **REQ-UPST-008**: GigaChat (Сбер) direct adapter (Phase 5)
- [ ] **REQ-UPST-009**: BYOK mode — client supplies own API key, gateway charges fixed `0.5 credits/req` fee, no upstream pass-through cost (Phase 5)
- [ ] **REQ-UPST-010**: Healthcheck failover — primary upstream down → automatic backup per matrix (Phase 5)
- [ ] **REQ-UPST-011**: Adapter response includes upstream cost breakdown for accurate metering (Phase 5)

### Marketplace UI

- [ ] **REQ-MKT-001**: `/marketplace` grid view of all active models with filters (modality, price, provider, tags, RU-residency badge) (Phase 6)
- [ ] **REQ-MKT-002**: `/marketplace/[org]/[model]` per-model SEO page with description, pricing, code samples, leaderboard position (Phase 6)
- [ ] **REQ-MKT-003**: `/playground` universal — pick model → run with form inputs (Phase 6)
- [ ] **REQ-MKT-004**: Playground works without API key for 5 requests/day per IP (free trial) (Phase 6)
- [ ] **REQ-MKT-005**: Code samples shown for curl, Python, Node.js with the user's API key embedded (Phase 6)
- [ ] **REQ-MKT-006**: Image upload to Timeweb S3 via presigned URL for playground/marketplace inputs (Phase 6)
- [ ] **REQ-MKT-007**: `/pricing` page with calculator + per-tier comparison + Van Westendorp-validated tiers (Free / Basic 990 / Starter 2490 / Pro 6990 / Business 29900) (Phase 6)
- [ ] **REQ-MKT-008**: SEO landing pages — `/compare/replicate`, `/compare/huggingface`, `/compare/polza` (Phase 6)
- [ ] **REQ-MKT-009**: `/rankings` — top models by usage / active apps (OpenRouter-style) (Phase 6)
- [ ] **REQ-MKT-010**: `/dashboard` shows balance, usage, recent requests, API keys (Phase 6)
- [ ] **REQ-MKT-011**: `/dashboard/billing/topup` integrated with T-Bank invoice flow (Phase 6)
- [ ] **REQ-MKT-012**: Shield-RF badge on every model with RU data residency (Phase 6)
- [ ] **REQ-MKT-013**: Model catalog seeded with ≥30 models across all categories at launch (Phase 6)

### Supply Side (Contests + Revshare)

- [ ] **REQ-SUP-001**: `/contests` lists active contests (grid with prize, deadline, sponsor) (Phase 7)
- [ ] **REQ-SUP-002**: `/contests/[slug]` shows description, dataset, metric, rules, leaderboard (Phase 7)
- [ ] **REQ-SUP-003**: Submission upload — predictions CSV/JSON only (D#7), virus-scanned + format-validated (Phase 7)
- [ ] **REQ-SUP-004**: Eval-runner executes scoring script in sandbox (`systemd-run` + `unshare` + `ulimit`) against private test set (Phase 7)
- [ ] **REQ-SUP-005**: Public score visible after each submission, private score hidden until contest close (invariant) (Phase 7)
- [ ] **REQ-SUP-006**: Leaderboard updates within 60s of submission scoring (Phase 7)
- [ ] **REQ-SUP-007**: Winner notification flow — top 3 emailed, model deployment offer (Phase 7)
- [ ] **REQ-SUP-008**: Author can convert winning submission to deployable model — upload weights or inference endpoint (Phase 7)
- [ ] **REQ-SUP-009**: Admin review/approve before model goes live in marketplace (Phase 7)
- [ ] **REQ-SUP-010**: Tiered revshare — 70% baseline / 75% volume / 80% self-hosted / 85% exclusive self-hosted (Phase 7)
- [ ] **REQ-SUP-011**: Monthly settlement (1st of month) calculates `author_share` = revenue × tier_pct (Phase 7)
- [ ] **REQ-SUP-012**: Author payout flow with ≥1000 ₽ minimum, withholding tax (13% физлицо), bank transfer (Phase 7)
- [ ] **REQ-SUP-013**: `/me/earnings` dashboard shows accruing balance + payout history (Phase 7)
- [ ] **REQ-SUP-014**: `/for-business` + `/contests/host` — B2B sponsor flow for paid contests (Phase 7)
- [ ] **REQ-SUP-015**: Submission rate limit per participant per contest (anti-spam) (Phase 7)

### Infrastructure (bare-metal)

- [x] **REQ-INF-001**: Postgres 16 installed via apt with `listen_addresses = 127.0.0.1` only (Phase 2)
- [x] **REQ-INF-002**: Redis 7 installed via apt with `requirepass` and 127.0.0.1 binding (Phase 2)
- [x] **REQ-INF-003**: Nginx + certbot active for `ai-aggregator.ru` apex with HTTPS (Phase 2)
- [x] **REQ-INF-004**: pm2 6 with systemd-supervised daemon + `pm2-logrotate` (10MB / 7 days / compress) (Phase 2)
- [x] **REQ-INF-005**: Capistrano-style layout — `/srv/aiag/{web,gateway,worker}/{releases/<sha>, current → releases/<sha>}` + `/srv/aiag/shared/.env.production` (Phase 2)
- [x] **REQ-INF-006**: Initial Drizzle migration applied — 26 tables on VPS DB `aiag` (Phase 1+2)
- [ ] **REQ-INF-007**: Subdomain certs `www.` and `api.` issued via certbot (BLOCKED — DNS A-records pending in Beget)
- [ ] **REQ-INF-008**: GitHub Actions deploy workflow — build → SSH rsync → symlink flip → `pm2 reload` → healthcheck → rollback on fail (Phase 2)
- [ ] **REQ-INF-009**: pg_dumpall daily cron at 03:00 MSK with 7daily / 4weekly / 3monthly retention (Phase 2)
- [ ] **REQ-INF-010**: Production smoke verification end-to-end (Phase 2)
- [ ] **REQ-INF-011**: Timeweb S3 bucket `aiag-storage` provisioned with access keys in `/srv/aiag/shared/.env.production` (BLOCKED — pending user manual creation)
- [ ] **REQ-INF-012**: VPS RAM upgrade 2GB → 4GB before production launch (recommended)

### Legal & Compliance

- [ ] **REQ-LEG-001**: `/legal/privacy` page (152-ФЗ-compliant) listing data categories, processing purposes, retention, transfer scope (no foreign servers) (Phase 8)
- [ ] **REQ-LEG-002**: `/legal/terms` — оферта for B2C and ИП customers (Phase 8)
- [ ] **REQ-LEG-003**: `/legal/contest-rules` — generic + per-contest specific rules (Phase 8)
- [ ] **REQ-LEG-004**: `/legal/author-agreement` — IP, exclusivity, revshare terms (Phase 8)
- [ ] **REQ-LEG-005**: РКН-уведомление об обработке ПДн filed before launch (Phase 8)
- [ ] **REQ-LEG-006**: Cookie consent banner (FZ-152 compliant) (Phase 8)
- [ ] **REQ-LEG-007**: Content moderation — automated scan on user submissions for illegal content + manual review queue (Phase 8)
- [ ] **REQ-LEG-008**: Audit log — `/var/log/aiag/audit.log` with admin actions (who/what/when/IP), logrotate (Phase 8)

### Monitoring & Ops

- [ ] **REQ-OPS-001**: `node_exporter` + `postgres_exporter` running as systemd services (apt, not Docker) (Phase 8)
- [ ] **REQ-OPS-002**: Prometheus + Grafana + Loki on monitoring VPS as systemd services (Phase 8)
- [ ] **REQ-OPS-003**: Alerting via Telegram webhook for: balance < $X provider, error rate > 1%, p50 latency > 2x baseline, disk > 80% (Phase 8)
- [ ] **REQ-OPS-004**: Healthchecks `/healthz` on web/gateway/worker — exit code drives deploy rollback (Phase 8)
- [ ] **REQ-OPS-005**: Pre-launch verification checklist (load test, security scan, DR drill) (Phase 8)

## v2 Requirements (Post-MVP)

### Decentralization & Foreign Entity (Phase 9 trigger: MRR > 500k₽)

- **REQ-FOR-001**: Foreign legal entity (UAE / Cyprus / Estonia) for international payments
- **REQ-FOR-002**: Stripe / Paddle integration for non-RU customers
- **REQ-FOR-003**: USD billing tier in parallel with RUB
- **REQ-FOR-004**: Cross-border data agreement compliance

### Realtime / Advanced Features

- **REQ-RT-001**: Live leaderboard with WebSocket subscriptions
- **REQ-RT-002**: Realtime collaboration on contests (CRDT)
- **REQ-RT-003**: Edge functions for low-latency inference

### Self-hosted GPU Pool

- **REQ-GPU-001**: Cog-compatible packaging for community models
- **REQ-GPU-002**: Auto-scale GPU cluster on Timeweb / Selectel
- **REQ-GPU-003**: Cold-start optimization (keep-warm for top-5 models)

### Advanced Submission Formats

- **REQ-EVAL-001**: Model file (weights) submissions with sandboxed inference
- **REQ-EVAL-002**: gVisor / kata containers for full isolation
- **REQ-EVAL-003**: GPU-accelerated eval runner

### Mobile / Other Clients

- **REQ-CLI-001**: Telegram Mini App for B2C playground
- **REQ-CLI-002**: Native mobile app (iOS / Android)

### Design System v2

- **REQ-UI-001**: MUI cleanup on 7 legacy pages (`plan-03b`)
- **REQ-UI-002**: Storybook + visual regression suite (deferred from Phase 3)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Decentralization / web3 | Not relevant for B2B-API marketplace |
| Self-hosting frontier LLMs (GPT, Claude) | Cost-prohibitive, no contracts available, OpenRouter sufficient |
| Real-time chat between users | Not core to dev-tool value prop |
| User-generated reviews on models | Out of scope until catalog has critical mass |
| Mobile app (v1) | Web-first, dev tools are desktop-primary |
| Supabase Realtime / Edge Functions | Pivot D#12 — SSE covers streaming need |
| Docker / Kubernetes (v1) | Pivot D#13 — single-VPS bare-metal sufficient until horizontal scale |
| Foreign currency billing (v1) | Phase 9 trigger MRR > 500k₽ |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| REQ-AUTH-001..004 | Phase 1 | Complete |
| REQ-AUTH-005..006 | Phase 1 | Pending (deferred) |
| REQ-AUTH-007..009 | Phase 4 | In Progress |
| REQ-GATE-001..019 | Phase 4 | In Progress |
| REQ-UPST-001..011 | Phase 5 | In Progress |
| REQ-MKT-001..013 | Phase 6 | In Progress |
| REQ-SUP-001..015 | Phase 7 | In Progress |
| REQ-INF-001..006 | Phase 2 | Complete |
| REQ-INF-007 | Phase 2 | Blocked (DNS) |
| REQ-INF-008..010, 012 | Phase 2 | Pending |
| REQ-INF-011 | Phase 2 | Blocked (S3 bucket) |
| REQ-LEG-001..008 | Phase 8 | Pending |
| REQ-OPS-001..005 | Phase 8 | Pending |

**Coverage:**
- v1 requirements: 79 total
- Mapped to phases: 79
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-26 (synthesized from spec v2.1 + plans 01–08)*
*Last updated: 2026-04-26 after bootstrap*
