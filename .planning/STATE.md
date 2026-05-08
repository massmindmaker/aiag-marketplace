# Project State

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-04-26)

**Core value:** Any AI model. One API. Payment in ₽.
**Current focus:** Phase 8 (Launch) — recommended as next focus, blocks production

## Current Position

Phase: 8 of 9 (Launch)
Plan: 1 of 1 in current phase (08-01)
Status: Started — agent died (rate limit). Multiple parallel phases (4/5/6/7) also in flight.
Last activity: 2026-04-24 — three architectural decisions locked (D#12/D#13/D#14), Phase 04/05/06/07 active in worktrees, Phase 02 ~90%, Phase 03 merged.

Progress: [██░░░░░░░░] 25% (2 of 8 v1.0 phases shipped; in-flight code weight pushes effective progress to ~37%)

## Why Phase 8 Next

Phases 4/5/6/7 are progressing well in branches but **none can launch without Phase 8** (legal pages + РКН-уведомление + monitoring stack + deploy pipeline finalization). Phase 8 is the launch-blocker; everything else converges into it. Resume Phase 8 first, while letting feature branches naturally complete.

Alternative: `/gsd:execute-phase 2` to finish bare-metal infrastructure (10% remaining) — also a launch prerequisite. Then `/gsd:execute-phase 8`.

## Performance Metrics

**Velocity:**
- Total plans completed: 2 (Phase 1, Phase 3)
- Tags shipped: 3 (`v0.1.0-foundation`, `v0.1.1-foundation-complete`, `v0.2.0-design`)
- Master commits since 2026-04-20: 11
- Active development span: ~1 week

**By Phase:**

| Phase | Plans | Tests | Status |
|-------|-------|-------|--------|
| 1. Foundation | 1/1 | 44/44 passing (incl 2 integration vs VPS PG) | Complete |
| 2. Infrastructure | 0/1 | n/a | ~90% (Tasks 10, 12 pending; subdomain certs DNS-blocked) |
| 3. Design System | 1/1 | n/a | Complete |
| 4. Gateway | 0/1 | 57/58 passing | ~60% (deploy tasks 13–19 pending) |
| 5. Upstreams | 0/1 | n/a | ~75% (4 commits, ~4 tasks remain) |
| 6. Marketplace | 0/1 | n/a | ~80% (image upload + SEO landings remain) |
| 7. Supply | 0/1 | n/a | ~50% |
| 8. Launch | 0/1 | n/a | Started (agent died, rate limit) |

## Accumulated Context

### Decisions

Full log in `.planning/PROJECT.md` Key Decisions and `.planning/intel/decisions.md` (verbatim D#1–D#14).

Recent decisions affecting current work (all 2026-04-24):
- **D#12** Drop Supabase → Timeweb managed PG + NextAuth + S3 (152-ФЗ + RAM economy)
- **D#13** Drop Docker entirely → bare-metal apt + systemd
- **D#14** Drop Dokploy → pm2 + nginx + GitHub Actions SSH rsync (Capistrano-style releases)

### Pending Todos

None captured via GSD yet (workflow just bootstrapped today).

## Design Phases (post-MVP, no code)

- **Phase 14** — Contest → Marketplace Workflow (design complete 2026-05-08). Spec at `docs/superpowers/specs/2026-05-08-phase14-contest-marketplace-workflow-design.md`. Wireframes at `brain/Projects/AIAG/Wireframes/p14-contest-marketplace/`. Next: `/gsd:discuss-phase 14`.

### Blockers/Concerns

External (waiting on user):
- **DNS** — `www.` and `api.` A-records not added in Beget. Blocks subdomain certbot in Phase 2 (REQ-INF-007).
- **S3 bucket** — `aiag-storage` not created in Timeweb (no Cloud infra MCP). Blocks Phase 5 Fal/Replicate storage, Phase 6 image uploads, Phase 7 submissions (REQ-INF-011).
- **VPS RAM** — current 2GB is tight (free ~600MB). Recommend upgrade to 4GB before production deploy (REQ-INF-012).

Internal:
- **Phase 8 agent died** — original execution stopped on rate limit. Need to resume via `/gsd:resume-work` or fresh `/gsd:execute-phase 8`.
- **Plan 04 WIP commit** needs splitting into conventional commits before merge.
- **7 legacy MUI pages** not migrated — accepted, deferred to `plan-03b` post-MVP.
- **Pre-existing build issue** — `@aiag/database`, `@aiag/tinkoff`, `@aiag/shared` need explicit `npm run build` before web build (monorepo workspace linking quirk). Document in build runbook.
- **VPS root password** — SECURITY-TODO change/disable (key auth already active).

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| UI | Storybook + visual regression suite | Moved to v2.0 | 2026-04-24 (Phase 3 close) |
| UI | MUI cleanup on 7 legacy pages | Moved to plan-03b | 2026-04-24 (Phase 3 close) |
| Auth | Password reset email flow | Deferred to post-deploy smoke | 2026-04-22 (Phase 1 close, Task 3) |
| Eval | Model file (weights) submissions | Phase 2 / v2.0 | 2026-04-18 (D#7 fixed predictions-only MVP) |
| Infra | nsjail eval sandbox upgrade | SECURITY-TODO Phase 2 | 2026-04-24 |

## Session Continuity

Last session: 2026-04-24 (architectural pivot day — D#12/D#13/D#14 + 5 plans rewritten)
Stopped at: Phase 4/5/6/7 active in worktrees, Phase 8 agent died on rate limit
Resume file: `brain/Projects/AIAG/RESUME-HERE.md` (legacy pre-GSD format)

**Suggested next action:** `/gsd:execute-phase 8` (launch-blocker) — or `/gsd:resume-work` to use the legacy resume marker. Alternative: `/gsd:execute-phase 2` to finish bare-metal infra first.

**Worktrees in play (parallel work possible):**
- `C:\Users\боб\projects\aggregator` — `exec/plan-03-design` (current shell, 4ad927f)
- `C:\Users\боб\projects\aggregator-master-check` — `master` (314397d, used for this bootstrap commit)
- `C:\Users\боб\projects\aggregator-plan-04` — `exec/plan-04-gateway`
- `C:\Users\боб\projects\aggregator-plan-05` — `exec/plan-05-upstreams`
- `C:\Users\боб\projects\aggregator-plan-06` — `exec/plan-06-marketplace`
- `C:\Users\боб\projects\aggregator-plan-07` — `exec/plan-07-supply`
- `C:\Users\боб\projects\aggregator-plan-08` — `exec/plan-08-launch`

**VPS production:** `5.129.200.99` (Timeweb ru-1, Ubuntu 24.04, 2GB RAM). SSH `aiag-vps`. PG 16.13 + Redis 7 + Nginx + certbot + Node 24 + Bun + pm2. БД `aiag` (26 tables applied). HTTPS active on apex `ai-aggregator.ru`.
