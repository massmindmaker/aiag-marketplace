# Phase 14 — Contest → Marketplace Workflow (Design)

**Status:** Design complete (no code)
**Started:** 2026-05-08
**Owner:** founder
**Type:** Design phase — produces spec + wireframes only.

## Position

Phase 14 of roadmap (post-MVP). Design-only fill of the gap between Phase 7 (Supply: contests + revshare schema) and a working end-to-end flow from contest win → live marketplace model → automated revshare → KYC → payout.

## Outputs delivered

- [x] Spec markdown — `docs/superpowers/specs/2026-05-08-phase14-contest-marketplace-workflow-design.md` (~520 lines, includes Mermaid flowchart)
- [x] Wireframes (6 files) — `C:\Users\боб\brain\Projects\AIAG\Wireframes\p14-contest-marketplace\`:
  - `01-admin-publish-modal.html`
  - `02-author-publish-consent.html`
  - `03-marketplace-winner-badge.html`
  - `04-dashboard-earnings.html`
  - `05-payout-request.html`
  - `06-kyc-verification.html`
- [x] Schema additions proposed (no migrations written yet) — see spec §3.

## Open questions (move into discuss-phase)

- OQ-1 СБП vs банковский перевод default
- OQ-2 auto-payout cap (50k vs 20k)
- OQ-3 ФНС API «Мой налог» pre-MVP or post-MVP
- OQ-4 escrow для prize_awards
- OQ-5 hosted-on-AIAG infra cost cap

## Next step

`/gsd:discuss-phase 14` → разрешить OQ-1..OQ-5 → `/gsd:plan-phase 14` → split в 14.1 (schema + cron + accrue), 14.2 (UI: admin publish modal, author consent, dashboard earnings, payout, KYC).

## Dependencies

Pulls in scope of Phases 4 / 6 / 7 / 8. Cannot execute before Phase 7 lands in master.

## Files touched in this design pass

- `docs/superpowers/specs/2026-05-08-phase14-contest-marketplace-workflow-design.md` (new)
- `.planning/phases/14-contest-marketplace-workflow-design/STATE.md` (this file, new)
- `C:\Users\боб\brain\Projects\AIAG\Wireframes\p14-contest-marketplace\*.html` (6 new files, outside repo)

No code in `apps/` or `packages/` modified — design-only constraint respected.
