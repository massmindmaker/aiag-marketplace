# AI-Aggregator — Launch Checklist

Финальный перечень действий перед публичным запуском. Эта страница — индекс;
детали — в соответствующих runbooks.

## Legal / Compliance

- [ ] Юрист передал финальный package (9 документов): privacy, consent processing,
      consent transborder, consent marketing, offer, author-agreement ×2,
      contest-host-agreement, РКН notification drafts.
- [ ] Documents hashed (SHA-256) + сохранены в `docs/legal/final/` + hashes в `hashes.txt`.
- [ ] DPO приказ подписан (`ops/legal/dpo-appointment-order.md`); `dpo@ai-aggregator.ru` forward работает.
- [ ] РКН уведомления поданы (processing + transborder отдельно), **operator number получен**.
- [ ] `RKN_OPERATOR_NUMBER` env var задан; `scripts/preflight-check.ts` проходит.
- [ ] Legal pages publish: /privacy, /terms, /offer, /author-agreement,
      /contest-host-agreement, /ai-disclosure, /cookies — все 200 OK.
- [ ] `<DpoFooter />` + `<AiDisclosureFooter />` site-wide.
- [ ] Cookie banner работает + DNT respected (H2).
- [ ] Transborder gate: E2E test проходит — foreign model без consent → 403 (H6).
- [ ] Prompt retention sweep worker запущен (daily cron).
- [ ] Art.16 human-review form + admin queue live (H3).

## Product

- [ ] ≥20 моделей в каталоге (с минимум 5 RF-resident).
- [ ] Shield-RF badge только на Yandex/GigaChat.
- [ ] Transborder warning badge на всех foreign моделях.
- [ ] Topup flow: T-Bank + ЮKassa — тест 100 ₽ успешны.
- [ ] Payout flow: test-выплата ≥1000 ₽ самозанятому.
- [ ] First launch-contest prepared (dataset + prize pool + leaderboard UI).

## Security

- [ ] `bun audit --prod` clean (или accept-with-note).
- [ ] API keys stored as SHA-256 hashes.
- [ ] BYOK keys encrypted (per-org DEK, master KEK в env).
- [ ] Admin 2FA + IP allowlist enforced.
- [ ] RLS убран; application-layer ACL verified via grep: все queries против
      `users|orgs|api_keys|requests|transactions|submissions|fraud_flags`
      содержат `eq(table.user_id, ...)`.
- [ ] Gitleaks в CI, последние 10 PR clean.
- [ ] Session cookies: httpOnly + secure + sameSite=strict.
- [ ] Rate-limit: 5 auth attempts / 15 мин + per-key RPM.

## Operations

- [ ] Monitoring stack deployed на VPS (Prometheus + Grafana + Alertmanager +
      Loki + Promtail via `ops/monitoring/install-observability.sh`).
- [ ] Gateway + Web exposes `/metrics` в Prometheus format.
- [ ] 9 alert rules загружены + smoke-test каждый → Telegram получен.
- [ ] `/health`, `/readiness`, `/version` endpoints на всех apps.
- [ ] Deploy pipeline: `.github/workflows/deploy-production.yml` — test run с staging OK.
- [ ] Rollback path verified: swap symlink `releases/` + pm2 reload.
- [ ] pgbackrest daily backup + verification зелёный.
- [ ] /status page live.

## Communications

- [ ] Press kit готов (logo, hero screenshots, bio, one-pager).
- [ ] Habr статья draft.
- [ ] Blog post «Founder story» draft.
- [ ] DTF / vc.ru pitch draft.
- [ ] Launch-day timeline (T-14 → T+7) документирован в `ops/runbook/public-launch-day.md`.
- [ ] Telegram канал `@aiag_ru` настроен.
- [ ] Support channels manned: `@aiag_support_bot`, `support@ai-aggregator.ru`.

## Go/No-Go

Все YES → Soft launch (50 beta, 7 days). Ноль P0 за 7 дней + юрист/owner confidence →
Public launch + `v1.0.0-launch` tag.
