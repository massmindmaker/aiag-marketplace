# AIAG Phase 13 — Growth Foundation Design

**Date:** 2026-04-29
**Status:** Approved (option A — minimal viable)
**Phase:** 13 (queued after Phase 11 + 12)
**Author:** brainstormed with @b0brov

## Context

After Phase 11 (admin base) + Phase 12 (admin critical views) AIAG admin is operationally complete. Phase 13 adds **growth fundamentals** — без них viral coefficient = 0 и founder не видит retention curve.

Three features chosen because they're (1) revenue-impacting, (2) cheap to build, (3) standard for SaaS.

## Goals

1. **Viral loop** — каждый довольный юзер приводит N новых
2. **Reactivation lever** — admin может поднять revenue точечной акцией («-30% на топап до конца недели»)
3. **Founder visibility** — увидеть когортные кривые retention за 30 секунд → понять что работает

## Non-goals

- Affiliate program (партнёр получает % lifetime) — Phase 14
- Email campaigns bulk — Phase 14
- A/B testing infrastructure — Phase 15
- Custom enterprise pricing per-org — Phase 14

## Architecture

Three independent components с shared admin RBAC. New tables in `0013_growth.sql` migration.

```
NEW DB TABLES:
  referral_codes        — каждому user одна row при первом login
  referral_redemptions  — событие: user X invited user Y, bonus paid
  promo_codes           — admin-created discount codes
  promo_redemptions     — event: user used promo X
  cohort_snapshots      — daily snapshot pre-aggregated retention

NEW ROUTES:
  /dashboard/referrals          — user side: «my code, my invites, my earnings»
  /admin/referrals              — admin: leaderboard, fraud detection
  /admin/promos                 — admin: CRUD promo codes
  /admin/cohorts                — admin: retention matrix
  /pricing (extension)          — promo code input field at top-up
  /register (extension)         — auto-detect ?ref= URL param
```

## Component 1 — Referral System

### Data model

```sql
CREATE TABLE referral_codes (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  code VARCHAR(12) UNIQUE NOT NULL,         -- e.g. "BOB-X7K2", short, shareable
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE referral_redemptions (
  id BIGSERIAL PRIMARY KEY,
  referrer_user_id UUID NOT NULL REFERENCES users(id),
  referred_user_id UUID NOT NULL REFERENCES users(id),
  redeemed_at TIMESTAMPTZ DEFAULT NOW(),
  bonus_referrer_rub NUMERIC(10,2) NOT NULL DEFAULT 100,    -- 100₽ for each invited
  bonus_referred_rub NUMERIC(10,2) NOT NULL DEFAULT 100,    -- 100₽ for joining via ref
  qualifying_event VARCHAR(50) DEFAULT 'first_topup',       -- when bonus triggered
  paid_out BOOLEAN DEFAULT false,                            -- credits applied?
  fraud_flagged BOOLEAN DEFAULT false,                       -- same IP, etc
  UNIQUE (referred_user_id)                                  -- can only be referred once
);
```

### Flow

1. User `A` registers → trigger generates `referral_codes` row with random 6-char code (e.g. `BOB-X7K2`)
2. User A shares URL `https://ai-aggregator.ru/register?ref=BOB-X7K2`
3. User B opens link → cookie `aiag_ref=BOB-X7K2` set (90 days)
4. User B registers → `referrer_user_id` saved on user record
5. User B does first top-up ≥ 100₽ → server action:
   - INSERT `referral_redemptions` row
   - Credit +100₽ to A's `payg_credits`
   - Credit +100₽ to B's `payg_credits` (bonus в дополнение к top-up)
   - INSERT 2 rows in `balance_transactions` with `kind='referral_bonus'`
   - Email A: «BOB-X7K2 used by [B]! +100₽ to your balance»

### `/dashboard/referrals` (user side)

- Hero: «Your code: **BOB-X7K2**» + copy button + share buttons (TG, VK, Telegram bot)
- «Your link: ai-aggregator.ru/register?ref=BOB-X7K2»
- Stats: invited (clicked link / registered / qualifying = paid), total earned ₽
- Table of invitees: anonymized email (b***@gmail.com), status, bonus paid

### `/admin/referrals` (admin side)

- Top referrers leaderboard (by # qualifying / by total bonus paid)
- Filter: by date range, status (paid/pending/fraud)
- **Fraud detection auto-flag** — same IP, same email domain (X@yandex.ru × 5), suspicious patterns
- Manual: mark fraud / unflag / pay-out manually / change bonus amount per redemption

### Admin settings (in `/admin/settings`)

- Toggle: referral system enabled (default: on)
- Bonus amount: referrer / referred (₽, default 100/100)
- Qualifying event: `first_topup` (any amount) / `first_topup_min_500` / `first_request`
- Min top-up to qualify (₽, default 100)
- Max bonus per referrer per month (anti-abuse, default 5000₽)

## Component 2 — Promo Codes

### Data model

```sql
CREATE TABLE promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,                       -- e.g. "LAUNCH50"
  description TEXT,
  kind VARCHAR(20) NOT NULL,                              -- 'percent_off' / 'fixed_off' / 'free_credit'
  value NUMERIC(10,2) NOT NULL,                           -- 50 (=50% off) | 200 (=200₽ off) | 100 (=100₽ free credit)
  min_amount_rub NUMERIC(10,2),                           -- min top-up to apply
  max_uses INTEGER,                                       -- null = unlimited
  uses_count INTEGER DEFAULT 0,
  per_user_limit INTEGER DEFAULT 1,                       -- max times one user can redeem
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  applies_to VARCHAR(20) DEFAULT 'topup',                 -- 'topup' / 'subscription' / 'first_topup_only'
  active BOOLEAN DEFAULT true,
  created_by_email VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE promo_redemptions (
  id BIGSERIAL PRIMARY KEY,
  promo_id UUID NOT NULL REFERENCES promo_codes(id),
  user_id UUID NOT NULL REFERENCES users(id),
  payment_id UUID REFERENCES payments(id),
  discount_applied_rub NUMERIC(10,2) NOT NULL,
  redeemed_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `/admin/promos`

- Table: code, kind, value, uses (X / Y), valid until, status
- Create form: all fields above + preview «what user sees»
- Per-row: edit / disable / view redemptions
- Bulk-create CSV import (для маркетинговых кампаний)

### Apply flow at `/dashboard/billing` top-up

- Поле «Промокод» (collapsible) → user types `LAUNCH50`
- AJAX validate: code valid? applies to amount? user eligible?
- If valid → preview «discount −250₽, you'll be charged 250₽ but get 500₽ credits»
- On payment success webhook → INSERT `promo_redemptions` + add discount to credit balance + INC `uses_count`

### Anti-abuse

- Per-user limit (default 1 use)
- Idempotency: same promo + same user + active payment = block
- Max uses globally
- Soft expiry warning at +24h before `valid_until`

## Component 3 — Cohort Retention Dashboard

### Data model

```sql
CREATE TABLE cohort_snapshots (
  cohort_week DATE NOT NULL,                              -- ISO week start (monday)
  measurement_day INTEGER NOT NULL,                       -- 0, 1, 7, 14, 30, 60, 90
  registered_count INTEGER NOT NULL,                      -- size of cohort
  active_count INTEGER NOT NULL,                          -- did ≥1 request in this measurement_day window
  paying_count INTEGER NOT NULL,                          -- did ≥1 top-up in this window
  total_revenue_rub NUMERIC(12,2) NOT NULL,
  computed_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (cohort_week, measurement_day)
);
```

Pre-aggregation via cron (BullMQ job, daily at 03:30 UTC after pg backup):
- For each cohort_week (last 12 weeks), compute active/paying/revenue at days 0/1/7/14/30/60/90
- INSERT/UPDATE row

### `/admin/cohorts`

- Heatmap matrix: rows = cohort_week (last 12), columns = days (0/1/7/14/30/60/90), cell = % active
- Toggle: % active / % paying / total revenue / avg revenue per user
- Export CSV
- Single-cohort drill-down: select row → see absolute counts + median time-to-first-purchase

## Schema migration

`packages/database/migrations/0013_growth.sql` with all 5 tables + indexes:
- `idx_referral_redemptions_referrer` ON `(referrer_user_id, redeemed_at DESC)`
- `idx_promo_redemptions_user` ON `(user_id, redeemed_at DESC)`
- `idx_cohort_snapshots_week` ON `(cohort_week DESC, measurement_day)`

Apply on VPS during deploy.

## Auth & RBAC

- `/dashboard/referrals` — authenticated user
- `/admin/{referrals,promos,cohorts}` — admin role only
- Promo redemption + referral bonus credit always logged to `audit_log`

## Testing

- Unit: code generator (uniqueness, format), bonus calc (referral + promo), cohort aggregation (synthetic data)
- Integration: full referral flow signup→topup→bonus credit; promo redemption idempotency
- Min 20 new tests

## Risks & mitigations

- **Risk:** Referral fraud (одна персона = N аккаунтов) — IP / email domain / device fingerprint clustering
  - **Mitigation:** Auto-flag heuristics + admin manual review queue + cap per-month bonus
- **Risk:** Promo code abuse (sharing widely) — set `max_uses` + `per_user_limit`
- **Risk:** Cohort job slow on big DB — incremental update only last 12 weeks daily

## Out of scope (Phase 14)

- Affiliate program (lifetime % share)
- Email campaign blasts (Unisender bulk)
- A/B testing infrastructure
- Custom enterprise pricing per-org
- Welcome credits campaign manager (broadcast +X₽ to all in cohort Y)
